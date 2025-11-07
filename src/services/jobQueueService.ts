import { JOBS } from '@/constants/apiEndpoints'
import { apiClient } from '@/plugins/axios'
import type {
    BaseResponse,
    Job,
    JobDetails,
    JobListResponse,
    JobFilterCriteria,
    RetryJobResponse,
    PaginationInfo
} from '@/types/content'

/**
 * Job Queue Service
 * Handles API calls for job queue management operations
 */
class JobQueueService {
    /**
     * Get paginated list of jobs with filtering and search
     */
    async getJobs(
        page = 0,
        size = 10,
        filters?: JobFilterCriteria
    ): Promise<BaseResponse<JobListResponse>> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        })

        // Add filter parameters
        if (filters?.search) {
            params.append('search', filters.search)
        }

        if (filters?.status && filters.status.length > 0) {
            filters.status.forEach(status => params.append('status', status))
        }

        if (filters?.contentType && filters.contentType.length > 0) {
            filters.contentType.forEach(type => params.append('contentType', type))
        }

        if (filters?.dateRange && filters.dateRange.length === 2) {
            params.append('startDate', filters.dateRange[0])
            params.append('endDate', filters.dateRange[1])
        }

        const url = `${JOBS.LIST}?${params.toString()}`

        try {
            const response = await apiClient.get(url, {
                timeout: 30000, // 30 seconds timeout for job list
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to fetch jobs')
        }
    }

    /**
     * Get detailed information for a specific job
     */
    async getJobDetails(jobId: number): Promise<BaseResponse<JobDetails>> {
        try {
            const response = await apiClient.get(JOBS.DETAILS(jobId), {
                timeout: 15000, // 15 seconds timeout for job details
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to fetch job details')
        }
    }

    /**
     * Retry a failed or cancelled job
     */
    async retryJob(jobId: number): Promise<BaseResponse<RetryJobResponse>> {
        try {
            const response = await apiClient.post(JOBS.RETRY(jobId), {}, {
                timeout: 30000, // 30 seconds timeout for retry operation
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to retry job')
        }
    }

    /**
     * Download job content in specified format
     */
    async downloadJobContent(
        jobId: number,
        format: 'txt' | 'json' | 'pdf' = 'txt'
    ): Promise<Blob> {
        try {
            const params = new URLSearchParams({ format })
            const response = await apiClient.get(
                `${JOBS.DOWNLOAD(jobId)}?${params.toString()}`,
                {
                    responseType: 'blob',
                    timeout: 60000, // 60 seconds timeout for file download
                }
            )
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to download job content')
        }
    }

    /**
     * Download job content and trigger browser download
     */
    async downloadJobContentFile(
        jobId: number,
        format: 'txt' | 'json' | 'pdf' = 'txt',
        filename?: string
    ): Promise<void> {
        try {
            const blob = await this.downloadJobContent(jobId, format)

            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename || `job-${jobId}-content.${format}`

            // Trigger download
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Cleanup
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            throw error
        }
    }

    /**
     * Get job statistics for dashboard
     */
    async getJobStatistics(): Promise<BaseResponse<any>> {
        try {
            const response = await apiClient.get('/jobs/statistics', {
                timeout: 10000, // 10 seconds timeout for statistics
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to fetch job statistics')
        }
    }

    /**
     * Cancel a pending or processing job
     */
    async cancelJob(jobId: number): Promise<BaseResponse<void>> {
        try {
            const response = await apiClient.delete(JOBS.BY_ID(jobId), {
                timeout: 15000, // 15 seconds timeout for cancel operation
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to cancel job')
        }
    }

    /**
     * Refresh job status (useful for manual refresh)
     */
    async refreshJobStatus(jobId: number): Promise<BaseResponse<Job>> {
        try {
            const response = await apiClient.get(JOBS.BY_ID(jobId), {
                timeout: 10000, // 10 seconds timeout for status refresh
            })
            return response.data
        } catch (error: any) {
            throw this.handleApiError(error, 'Failed to refresh job status')
        }
    }

    /**
     * Handle API errors with retry logic for specific error types
     */
    private handleApiError(error: any, defaultMessage: string): Error {
        // Check if it's a network error that might benefit from retry
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
            return new Error(`${defaultMessage}. Please check your connection and try again.`)
        }

        // Check for specific HTTP status codes
        if (error.response?.status) {
            switch (error.response.status) {
                case 400:
                    return new Error(error.response.data?.errorMessage || 'Invalid request parameters')
                case 401:
                    return new Error('Authentication required. Please log in again.')
                case 403:
                    return new Error('You do not have permission to perform this action')
                case 404:
                    return new Error('Job not found or has been deleted')
                case 409:
                    return new Error('Job is in a state that does not allow this operation')
                case 429:
                    return new Error('Too many requests. Please wait a moment and try again.')
                case 500:
                    return new Error('Server error. Please try again later.')
                case 503:
                    return new Error('Service temporarily unavailable. Please try again later.')
                default:
                    return new Error(error.response.data?.errorMessage || defaultMessage)
            }
        }

        // Return the original error message or default
        return new Error(error.message || defaultMessage)
    }

    /**
     * Retry API call with exponential backoff
     */
    private async retryApiCall<T>(
        apiCall: () => Promise<T>,
        maxRetries = 3,
        baseDelay = 1000
    ): Promise<T> {
        let lastError: Error

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall()
            } catch (error: any) {
                lastError = error

                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                    throw error
                }

                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    break
                }

                // Calculate delay with exponential backoff
                const delay = baseDelay * Math.pow(2, attempt)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        throw lastError!
    }

    /**
     * Get jobs with automatic retry on failure
     */
    async getJobsWithRetry(
        page = 0,
        size = 10,
        filters?: JobFilterCriteria,
        maxRetries = 2
    ): Promise<BaseResponse<JobListResponse>> {
        return this.retryApiCall(
            () => this.getJobs(page, size, filters),
            maxRetries
        )
    }

    /**
     * Retry job with automatic retry on failure
     */
    async retryJobWithRetry(
        jobId: number,
        maxRetries = 2
    ): Promise<BaseResponse<RetryJobResponse>> {
        return this.retryApiCall(
            () => this.retryJob(jobId),
            maxRetries
        )
    }
}

export const jobQueueService = new JobQueueService()