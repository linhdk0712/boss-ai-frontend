import apiClient from '@/plugins/axios'
import type { BaseResponse } from '@/types/auth'

export interface VideoTemplate {
    id: number
    name: string
    description?: string
    category?: string

    // Style Configuration
    styleName?: string
    animationStyle?: string
    transitionStyle?: string

    // Branding Options
    logoUrl?: string
    logoPosition?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontFamily?: string
    fontSize?: string

    // Duration and Format Options
    defaultDuration?: number
    minDuration?: number
    maxDuration?: number
    aspectRatio?: string
    resolution?: string
    frameRate?: number
    videoFormat?: string

    // Voice and Audio Options
    voiceOverEnabled?: boolean
    voiceType?: string
    voiceSpeed?: string
    backgroundMusicEnabled?: boolean
    musicGenre?: string
    musicVolume?: number

    // Advanced Configuration
    advancedConfig?: Record<string, any>

    // Template Metadata
    isPublic?: boolean
    isSystemTemplate?: boolean
    usageCount?: number
    averageRating?: number
    successRate?: number

    // Ownership
    createdById?: number
    createdByUsername?: string

    // Timestamps
    createdAt?: string
    updatedAt?: string
}

export interface CreateVideoTemplateRequest {
    name: string
    description?: string
    category?: string
    styleName?: string
    animationStyle?: string
    transitionStyle?: string
    logoUrl?: string
    logoPosition?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontFamily?: string
    fontSize?: string
    defaultDuration?: number
    minDuration?: number
    maxDuration?: number
    aspectRatio?: string
    resolution?: string
    frameRate?: number
    videoFormat?: string
    voiceOverEnabled?: boolean
    voiceType?: string
    voiceSpeed?: string
    backgroundMusicEnabled?: boolean
    musicGenre?: string
    musicVolume?: number
    advancedConfig?: Record<string, any>
    isPublic?: boolean
}

class VideoTemplateService {
    private readonly baseUrl = '/video-templates'

    /**
     * Create a new video template
     */
    async createTemplate(request: CreateVideoTemplateRequest): Promise<BaseResponse<VideoTemplate>> {
        const response = await apiClient.post(this.baseUrl, request)
        return response.data
    }

    /**
     * Get template by ID
     */
    async getTemplateById(id: number): Promise<BaseResponse<VideoTemplate>> {
        const response = await apiClient.get(`${this.baseUrl}/${id}`)
        return response.data
    }

    /**
     * Get all public templates
     */
    async getPublicTemplates(): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/public`)
        return response.data
    }

    /**
     * Get templates by category
     */
    async getTemplatesByCategory(category: string): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/category/${category}`)
        return response.data
    }

    /**
     * Get user's templates
     */
    async getUserTemplates(): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/my-templates`)
        return response.data
    }

    /**
     * Get popular templates
     */
    async getPopularTemplates(limit = 10): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/popular`, {
            params: { limit }
        })
        return response.data
    }

    /**
     * Get recommended templates
     */
    async getRecommendedTemplates(limit = 10): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/recommended`, {
            params: { limit }
        })
        return response.data
    }

    /**
     * Search templates
     */
    async searchTemplates(query: string): Promise<BaseResponse<VideoTemplate[]>> {
        const response = await apiClient.get(`${this.baseUrl}/search`, {
            params: { query }
        })
        return response.data
    }

    /**
     * Update template
     */
    async updateTemplate(id: number, request: CreateVideoTemplateRequest): Promise<BaseResponse<VideoTemplate>> {
        const response = await apiClient.put(`${this.baseUrl}/${id}`, request)
        return response.data
    }

    /**
     * Delete template
     */
    async deleteTemplate(id: number): Promise<BaseResponse<void>> {
        const response = await apiClient.delete(`${this.baseUrl}/${id}`)
        return response.data
    }
}

export const videoTemplateService = new VideoTemplateService()
