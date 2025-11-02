import { apiClient } from '@/plugins/axios'
import { SETTINGS } from '@/constants/apiEndpoints'
import type { VUserConfigDto, SettingsUpdateRequest } from '@/types/settings'
import { SettingsCategory } from '@/types/settings'
import type { BaseResponse } from '@/types/auth'

/**
 * Settings Service
 * Handles API calls for user settings management
 */
class SettingsService {
    /**
     * Fetch tone settings for current user
     */
    async getToneSettings(): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.get(SETTINGS.TONE)
        return response.data
    }

    /**
     * Fetch industry settings for current user
     */
    async getIndustrySettings(): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.get(SETTINGS.INDUSTRY)
        return response.data
    }

    /**
     * Fetch language settings for current user
     */
    async getLanguageSettings(): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.get(SETTINGS.LANGUAGE)
        return response.data
    }

    /**
     * Fetch target audience settings for current user
     */
    async getTargetAudienceSettings(): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.get(SETTINGS.TARGET_AUDIENCE)
        return response.data
    }

    /**
     * Fetch content type settings for current user
     */
    async getContentTypeSettings(): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.get(SETTINGS.CONTENT_TYPE)
        return response.data
    }

    /**
     * Get settings by category
     */
    async getSettingsByCategory(category: SettingsCategory): Promise<BaseResponse<VUserConfigDto[]>> {
        switch (category) {
            case SettingsCategory.TONE:
                return this.getToneSettings()
            case SettingsCategory.INDUSTRY:
                return this.getIndustrySettings()
            case SettingsCategory.LANGUAGE:
                return this.getLanguageSettings()
            case SettingsCategory.TARGET_AUDIENCE:
                return this.getTargetAudienceSettings()
            case SettingsCategory.CONTENT_TYPE:
                return this.getContentTypeSettings()
            default:
                throw new Error(`Unknown settings category: ${category}`)
        }
    }

    /**
     * Update user setting (toggle on/off)
     */
    async updateSetting(request: SettingsUpdateRequest): Promise<BaseResponse<VUserConfigDto[]>> {
        const response = await apiClient.post(SETTINGS.UPDATE, request)
        return response.data
    }

    /**
     * Fetch all settings categories in parallel
     * Useful for loading all settings data at once
     */
    async getAllSettings(): Promise<{
        tone: VUserConfigDto[]
        industry: VUserConfigDto[]
        language: VUserConfigDto[]
        targetAudience: VUserConfigDto[]
        contentType: VUserConfigDto[]
    }> {
        const [
            toneResponse,
            industryResponse,
            languageResponse,
            targetAudienceResponse,
            contentTypeResponse,
        ] = await Promise.all([
            this.getToneSettings(),
            this.getIndustrySettings(),
            this.getLanguageSettings(),
            this.getTargetAudienceSettings(),
            this.getContentTypeSettings(),
        ])

        return {
            tone: toneResponse.data || [],
            industry: industryResponse.data || [],
            language: languageResponse.data || [],
            targetAudience: targetAudienceResponse.data || [],
            contentType: contentTypeResponse.data || [],
        }
    }
}

export const settingsService = new SettingsService()