import { CONTENT } from '@/constants/apiEndpoints'
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
}

export const contentService = new ContentService()