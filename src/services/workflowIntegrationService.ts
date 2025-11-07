import { CONTENT } from '@/constants/apiEndpoints'
import { apiClient } from '@/plugins/axios'
import { jobQueueService } from './jobQueueService'
import type {
    BaseResponse,
    WorkflowRequest,
    WorkflowResponse,
    JobDetails
} from '@/types/content'

/**
 * Workflow Integration Service
 * Handles integration between job queue and content workflow API
 */
class WorkflowIntegrationService {
    /**
     * Prepare job content for video generation workflow
     * Extracts content from completed job and formats it for workflow API
     */
    async prepareJobContentForWorkflow(jobId: number): Promise<WorkflowRequest> {
        try {
            // Get job details
            const jobResponse = await jobQueueService.getJobDetails(jobId)

            if (jobResponse.errorCode !== 'SUCCESS') {
                throw new Error(jobResponse.errorMessage || 'Failed to fetch job details')
            }

            const job = jobResponse.data

            // Validate job is suitable for video generation
            this.validateJobForVideoGeneration(job)

            // Extract content and parameters
            const workflowRequest = this.extractWorkflowRequest(job)

            return workflowRequest
        } catch (error: any) {
            throw new Error(error.message || 'Failed to prepare job content for video generation')
        }
    }

    /**
     * Generate video from job content using existing workflow API
     */
    async generateVideoFromJob(jobId: number): Promise<BaseResponse<WorkflowResponse>> {
        try {
            // Prepare workflow request from job content
            const workflowRequest = await this.prepareJobContentForWorkflow(jobId)

            // Add job reference to workflow request
            const enhancedRequest = {
                ...workflowRequest,
                sourceJobId: jobId,
                sourceType: 'job_queue'
            }

            // Call existing workflow API
            const response = await apiClient.post(CONTENT.WORKFLOW, enhancedRequest, {
                timeout: 180000, // 3 minutes for workflow operations
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to generate video from job')
        }
    }

    /**
     * Generate video asynchronously from job content
     */
    async generateVideoFromJobAsync(jobId: number): Promise<BaseResponse<WorkflowResponse>> {
        try {
            // Prepare workflow request from job content
            const workflowRequest = await this.prepareJobContentForWorkflow(jobId)

            // Add job reference to workflow request
            const enhancedRequest = {
                ...workflowRequest,
                sourceJobId: jobId,
                sourceType: 'job_queue',
                async: true
            }

            // Call async workflow API
            const response = await apiClient.post(CONTENT.WORKFLOW_ASYNC, enhancedRequest, {
                timeout: 30000, // 30 seconds for async workflow initiation
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to start async video generation from job')
        }
    }

    /**
     * Check workflow progress for job-initiated video generation
     */
    async checkJobVideoProgress(jobId: number, workflowId: string): Promise<BaseResponse<any>> {
        try {
            const response = await apiClient.get(`${CONTENT.WORKFLOW}/${workflowId}/status`, {
                timeout: 10000, // 10 seconds for status check
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to check video generation progress')
        }
    }

    /**
     * Cancel workflow initiated from job
     */
    async cancelJobVideoGeneration(jobId: number, workflowId: string): Promise<BaseResponse<void>> {
        try {
            const response = await apiClient.post(`${CONTENT.WORKFLOW}/${workflowId}/cancel`, {
                sourceJobId: jobId,
                reason: 'User cancelled'
            }, {
                timeout: 15000, // 15 seconds for cancel operation
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to cancel video generation')
        }
    }

    /**
     * Get video generation history for a specific job
     */
    async getJobVideoHistory(jobId: number): Promise<BaseResponse<any[]>> {
        try {
            const response = await apiClient.get(`/jobs/${jobId}/video-history`, {
                timeout: 10000, // 10 seconds for history retrieval
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to fetch video generation history')
        }
    }

    /**
     * Validate that job is suitable for video generation
     */
    private validateJobForVideoGeneration(job: JobDetails): void {
        // Check job status
        if (job.status !== 'COMPLETED') {
            throw new Error(`Job must be completed to generate video. Current status: ${job.status}`)
        }

        // Check if job has result content
        if (!job.result) {
            throw new Error('Job does not have result content for video generation')
        }

        // Check content type compatibility
        const videoCompatibleTypes = [
            'blog-post',
            'article',
            'social-media-post',
            'marketing-copy',
            'product-description',
            'story',
            'script'
        ]

        // Content type and length validation (warnings removed for production)
    }

    /**
     * Extract workflow request from job details
     */
    private extractWorkflowRequest(job: JobDetails): WorkflowRequest {
        // Extract content from job result
        let content = ''
        if (typeof job.result === 'string') {
            content = job.result
        } else if (job.result && typeof job.result === 'object') {
            // Handle structured result
            content = job.result.generatedContent || job.result.content || JSON.stringify(job.result)
        }

        // Parse job parameters if available
        let parameters: any = {}
        if (job.parameters) {
            try {
                parameters = typeof job.parameters === 'string'
                    ? JSON.parse(job.parameters)
                    : job.parameters
            } catch (error) {
                // Failed to parse job parameters
            }
        }

        // Build workflow request
        const workflowRequest: WorkflowRequest = {
            content,
            title: job.title || parameters.title || 'Generated Content',
            contentType: job.contentType || parameters.contentType,
            industry: parameters.industry,
            language: parameters.language || 'en',
            tone: parameters.tone,
            targetAudience: parameters.targetAudience
        }

        return workflowRequest
    }

    /**
     * Handle workflow API errors
     */
    private handleWorkflowError(error: any, defaultMessage: string): Error {
        // Check for specific workflow errors
        if (error.response?.data?.errorCode) {
            switch (error.response.data.errorCode) {
                case 'WORKFLOW_NOT_FOUND':
                    return new Error('Video generation workflow not found')
                case 'WORKFLOW_ALREADY_RUNNING':
                    return new Error('Video generation is already in progress for this content')
                case 'CONTENT_TOO_LONG':
                    return new Error('Content is too long for video generation. Please shorten it.')
                case 'CONTENT_INAPPROPRIATE':
                    return new Error('Content is not suitable for video generation')
                case 'QUOTA_EXCEEDED':
                    return new Error('Video generation quota exceeded. Please try again later.')
                case 'SERVICE_UNAVAILABLE':
                    return new Error('Video generation service is temporarily unavailable')
                default:
                    return new Error(error.response.data.errorMessage || defaultMessage)
            }
        }

        // Handle HTTP status codes
        if (error.response?.status) {
            switch (error.response.status) {
                case 400:
                    return new Error('Invalid content or parameters for video generation')
                case 402:
                    return new Error('Payment required for video generation')
                case 429:
                    return new Error('Too many video generation requests. Please wait and try again.')
                case 503:
                    return new Error('Video generation service is temporarily unavailable')
                default:
                    return new Error(error.response.data?.errorMessage || defaultMessage)
            }
        }

        return new Error(error.message || defaultMessage)
    }

    /**
     * Batch generate videos from multiple jobs
     */
    async batchGenerateVideosFromJobs(jobIds: number[]): Promise<{
        successful: Array<{ jobId: number; workflowResponse: WorkflowResponse }>
        failed: Array<{ jobId: number; error: string }>
    }> {
        const successful: Array<{ jobId: number; workflowResponse: WorkflowResponse }> = []
        const failed: Array<{ jobId: number; error: string }> = []

        // Process jobs sequentially to avoid overwhelming the workflow service
        for (const jobId of jobIds) {
            try {
                const response = await this.generateVideoFromJobAsync(jobId)
                if (response.errorCode === 'SUCCESS') {
                    successful.push({ jobId, workflowResponse: response.data })
                } else {
                    failed.push({ jobId, error: response.errorMessage || 'Unknown error' })
                }
            } catch (error: any) {
                failed.push({ jobId, error: error.message || 'Unknown error' })
            }

            // Add small delay between requests to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return { successful, failed }
    }

    /**
     * Get workflow templates suitable for job content types
     */
    async getWorkflowTemplatesForJob(jobId: number): Promise<BaseResponse<any[]>> {
        try {
            const jobResponse = await jobQueueService.getJobDetails(jobId)

            if (jobResponse.errorCode !== 'SUCCESS') {
                throw new Error('Failed to fetch job details')
            }

            const job = jobResponse.data
            const response = await apiClient.get(`${CONTENT.WORKFLOW}/templates`, {
                params: {
                    contentType: job.contentType,
                    language: job.parameters?.language || 'en'
                },
                timeout: 10000
            })

            return response.data
        } catch (error: any) {
            throw this.handleWorkflowError(error, 'Failed to fetch workflow templates')
        }
    }
}

export const workflowIntegrationService = new WorkflowIntegrationService()