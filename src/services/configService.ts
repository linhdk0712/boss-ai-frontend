import { apiClient } from '@/plugins/axios'
import { CONFIG } from '@/constants/apiEndpoints'
import type { BaseResponse, ConfigOption } from '@/types/content'

/**
 * Configuration Service
 * Handles API calls for fetching configuration data (dropdowns)
 */
class ConfigService {
    /**
     * Fetch industry configuration options
     */
    async getIndustryConfigs(): Promise<BaseResponse<ConfigOption[]>> {
        const response = await apiClient.get(CONFIG.INDUSTRY)
        return response.data
    }

    /**
     * Fetch content type configuration options
     */
    async getContentTypeConfigs(): Promise<BaseResponse<ConfigOption[]>> {
        const response = await apiClient.get(CONFIG.CONTENT_TYPE)
        return response.data
    }

    /**
     * Fetch language configuration options
     */
    async getLanguageConfigs(): Promise<BaseResponse<ConfigOption[]>> {
        const response = await apiClient.get(CONFIG.LANGUAGE)
        return response.data
    }

    /**
     * Fetch tone configuration options
     */
    async getToneConfigs(): Promise<BaseResponse<ConfigOption[]>> {
        const response = await apiClient.get(CONFIG.TONE)
        return response.data
    }

    /**
     * Fetch target audience configuration options
     */
    async getTargetAudienceConfigs(): Promise<BaseResponse<ConfigOption[]>> {
        const response = await apiClient.get(CONFIG.TARGET_AUDIENCE)
        return response.data
    }

    /**
     * Fetch all configuration options in parallel
     * Useful for loading all dropdown data at once
     */
    async getAllConfigs(): Promise<{
        industry: ConfigOption[]
        contentType: ConfigOption[]
        language: ConfigOption[]
        tone: ConfigOption[]
        targetAudience: ConfigOption[]
    }> {
        const [
            industryResponse,
            contentTypeResponse,
            languageResponse,
            toneResponse,
            targetAudienceResponse,
        ] = await Promise.all([
            this.getIndustryConfigs(),
            this.getContentTypeConfigs(),
            this.getLanguageConfigs(),
            this.getToneConfigs(),
            this.getTargetAudienceConfigs(),
        ])

        return {
            industry: industryResponse.data || [],
            contentType: contentTypeResponse.data || [],
            language: languageResponse.data || [],
            tone: toneResponse.data || [],
            targetAudience: targetAudienceResponse.data || [],
        }
    }
}

export const configService = new ConfigService()