import { CONTENT, QUEUE } from '@/constants/apiEndpoints'
import { apiClient } from '@/plugins/axios'
import type {
    BaseResponse,
    ContentGenerateRequest,
    ContentGenerateResponse,
    ContentGenerationDto,
    ContentSaveRequest,
    ContentWorkflowRequest
} from '@/types/content'

/**
 * Content Service
 * Handles API calls for content generation and management
 */
class ContentService {
    /**
     * Generate AI content based on user input and configuration
     * Uses extended timeout (5 minutes) for OpenAI API calls which can take longer
     */
    async generateContent(request: ContentGenerateRequest): Promise<BaseResponse<ContentGenerateResponse>> {
        const response = await apiClient.post(CONTENT.GENERATE, request, {
            timeout: 300000, // 5 minutes for content generation (OpenAI can be slow)
        })
        return response.data
    }

    /**
     * Save generated content to user's library
     */
    async saveContent(request: ContentSaveRequest): Promise<BaseResponse<ContentGenerationDto>> {
        const response = await apiClient.post(CONTENT.BASE, request)
        return response.data
    }

    /**
     * Trigger workflow for video generation from content
     * Uses extended timeout (3 minutes) for workflow operations
     */
    async triggerWorkflow(request: ContentWorkflowRequest): Promise<BaseResponse<any>> {
        const response = await apiClient.post(CONTENT.WORKFLOW, request, {
            timeout: 180000, // 3 minutes for workflow operations
        })
        return response.data
    }

    /**
     * Generate content asynchronously with job tracking
     */
    async generateContentAsync(request: any): Promise<BaseResponse<{ jobId: string }>> {
        const response = await apiClient.post(QUEUE.JOBS, request)
        return response.data
    }

    /**
     * Trigger workflow asynchronously with job tracking
     */
    async triggerWorkflowAsync(request: ContentWorkflowRequest & { jobId: string }): Promise<BaseResponse<{ jobId: string }>> {
        const response = await apiClient.post(CONTENT.WORKFLOW_ASYNC, request)
        return response.data
    }

    /**
     * Get job status for async operations (content-specific)
     */
    async getContentJobStatus(jobId: string): Promise<BaseResponse<{
        status: 'queued' | 'processing' | 'completed' | 'failed'
        progress: number
        message: string
        result?: any
        error?: string
    }>> {
        const response = await apiClient.get(CONTENT.JOB_STATUS(jobId))
        return response.data
    }

    /**
     * Cancel active content job
     */
    async cancelContentJob(jobId: string): Promise<BaseResponse<void>> {
        const response = await apiClient.delete(CONTENT.JOB_CANCEL(jobId))
        return response.data
    }

    /**
     * Get all content items for the authenticated user
     */
    async getUserContents(): Promise<BaseResponse<ContentGenerationDto[]>> {
        const response = await apiClient.get(CONTENT.BASE)
        return response.data
    }

    /**
     * Get specific content item by ID
     */
    async getContentById(id: number): Promise<BaseResponse<ContentGenerationDto>> {
        const response = await apiClient.get(CONTENT.BY_ID(id))
        return response.data
    }

    /**
     * Update existing content item
     */
    async updateContent(id: number, request: Partial<ContentSaveRequest>): Promise<BaseResponse<ContentGenerationDto>> {
        const response = await apiClient.put(CONTENT.BY_ID(id), request)
        return response.data
    }

    /**
     * Delete content item
     */
    async deleteContent(id: number): Promise<BaseResponse<void>> {
        const response = await apiClient.delete(CONTENT.BY_ID(id))
        return response.data
    }

    /**
     * Get paginated list of user's content with search and filtering
     */
    async getContentList(params?: {
        page?: number
        size?: number
        search?: string
        contentType?: string
        language?: string
    }): Promise<BaseResponse<ContentGenerationDto[]>> {
        const queryParams = new URLSearchParams()

        if (params?.page !== undefined) queryParams.append('page', params.page.toString())
        if (params?.size !== undefined) queryParams.append('size', params.size.toString())
        if (params?.search) queryParams.append('search', params.search)
        if (params?.contentType) queryParams.append('contentType', params.contentType)
        if (params?.language) queryParams.append('language', params.language)

        const url = queryParams.toString() ? `${CONTENT.BASE}?${queryParams}` : CONTENT.BASE
        const response = await apiClient.get(url)
        return response.data
    }

    /**
     * Get video generation status for specific content
     */
    async getVideoStatus(id: number): Promise<BaseResponse<{ status: string; progress?: number; videoUrl?: string }>> {
        const response = await apiClient.get(CONTENT.VIDEO_STATUS(id))
        return response.data
    }

    /**
     * Retry video generation for failed content
     */
    async retryVideoGeneration(id: number): Promise<BaseResponse<any>> {
        const response = await apiClient.post(CONTENT.VIDEO_RETRY(id))
        return response.data
    }

    /**
     * Download generated video
     */
    async downloadVideo(id: number): Promise<Blob> {
        const response = await apiClient.get(CONTENT.VIDEO_DOWNLOAD(id), {
            responseType: 'blob'
        })
        return response.data
    }

    /**
     * Get video download URL
     */
    async getVideoDownloadUrl(id: number): Promise<BaseResponse<{ downloadUrl: string; expiresAt: string }>> {
        const response = await apiClient.get(`${CONTENT.VIDEO_DOWNLOAD(id)}/url`)
        return response.data
    }

    /**
     * Get job status by job ID
     */
    async getJobStatus(jobId: string): Promise<BaseResponse<any>> {
        const response = await apiClient.get(QUEUE.JOB_BY_ID(jobId))
        return response.data
    }

    /**
     * Cancel a queued job
     */
    async cancelJob(jobId: string): Promise<BaseResponse<void>> {
        const response = await apiClient.delete(QUEUE.JOB_BY_ID(jobId))
        return response.data
    }

    /**
     * Get user's job history
     */
    async getUserJobs(page = 0, size = 20): Promise<BaseResponse<any>> {
        const response = await apiClient.get(`${QUEUE.JOBS}?page=${page}&size=${size}`)
        return response.data
    }
}

export const contentService = new ContentService()