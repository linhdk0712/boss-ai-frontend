import apiClient from '@/plugins/axios'
import { TEMPLATES } from '@/constants/apiEndpoints'
import type { BaseResponse } from '@/types/auth'

export interface ContentTemplate {
    id: number
    name: string
    description?: string
    category: string
    promptTemplate: string
    defaultParams: Record<string, any>
    industry?: string
    contentType: string
    targetAudience?: string
    tags: string[]
    usageCount: number
    averageRating: number
    successRate: number
    createdBy: number
    isPublic: boolean
    isSystemTemplate: boolean
    createdAt: string
    updatedAt: string
}

export interface TemplateSearchParams {
    query?: string
    category?: string
    industry?: string
    contentType?: string
    tags?: string[]
    minRating?: number
    isPublic?: boolean
}

export interface TemplateRatingRequest {
    rating: number
    feedback?: string
}

export interface ApplyTemplateRequest {
    customParams?: Record<string, any>
}

export interface ApplyTemplateResponse {
    content: string
    industry?: string
    contentType: string
    targetAudience?: string
    customParams: Record<string, any>
}

class TemplateService {
    /**
     * Get all templates
     */
    async getTemplates(): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(TEMPLATES.BASE)
        return response.data
    }

    /**
     * Get template by ID
     */
    async getTemplateById(id: number): Promise<BaseResponse<ContentTemplate>> {
        const response = await apiClient.get(TEMPLATES.BY_ID(id))
        return response.data
    }

    /**
     * Get templates by category
     */
    async getTemplatesByCategory(category: string): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(TEMPLATES.BY_CATEGORY(category))
        return response.data
    }

    /**
     * Get templates by industry
     */
    async getTemplatesByIndustry(industry: string): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(TEMPLATES.BY_INDUSTRY(industry))
        return response.data
    }

    /**
     * Get recommended templates for current user
     */
    async getRecommendedTemplates(): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(TEMPLATES.RECOMMENDED)
        return response.data
    }

    /**
     * Get popular templates
     */
    async getPopularTemplates(limit: number = 10): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(`${TEMPLATES.POPULAR}?limit=${limit}`)
        return response.data
    }

    /**
     * Search templates
     */
    async searchTemplates(params: TemplateSearchParams): Promise<BaseResponse<ContentTemplate[]>> {
        const response = await apiClient.get(TEMPLATES.SEARCH, { params })
        return response.data
    }

    /**
     * Apply template to generate content request
     */
    async applyTemplate(
        templateId: number,
        request: ApplyTemplateRequest
    ): Promise<BaseResponse<ApplyTemplateResponse>> {
        const response = await apiClient.post(TEMPLATES.APPLY(templateId), request)
        return response.data
    }

    /**
     * Rate a template
     */
    async rateTemplate(
        templateId: number,
        request: TemplateRatingRequest
    ): Promise<BaseResponse<void>> {
        const response = await apiClient.post(TEMPLATES.RATE(templateId), request)
        return response.data
    }

    /**
     * Record template usage
     */
    async recordTemplateUsage(templateId: number): Promise<BaseResponse<void>> {
        const response = await apiClient.post(TEMPLATES.USAGE(templateId))
        return response.data
    }
}

export const templateService = new TemplateService()
