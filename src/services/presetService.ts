import apiClient from '@/plugins/axios'
import type { BaseResponse } from '@/types/auth'
import type {
    UserPreset,
    CreatePresetRequest,
    UpdatePresetRequest,
    PresetSearchFilters
} from '@/types/preset'

const PRESET_BASE_URL = '/api/v1/presets'

class PresetService {
    /**
     * Get all user presets with optional filters
     */
    async getUserPresets(filters?: PresetSearchFilters): Promise<BaseResponse<UserPreset[]>> {
        const params = new URLSearchParams()

        if (filters?.query) params.append('query', filters.query)
        if (filters?.contentType) params.append('contentType', filters.contentType)
        if (filters?.isDefault !== undefined) params.append('isDefault', String(filters.isDefault))
        if (filters?.sortBy) params.append('sortBy', filters.sortBy)
        if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

        const queryString = params.toString()
        const url = queryString ? `${PRESET_BASE_URL}?${queryString}` : PRESET_BASE_URL

        const response = await apiClient.get(url)
        return response.data
    }

    /**
     * Get a specific preset by ID
     */
    async getPresetById(id: number): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.get(`${PRESET_BASE_URL}/${id}`)
        return response.data
    }

    /**
     * Create a new preset
     */
    async createPreset(request: CreatePresetRequest): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.post(PRESET_BASE_URL, request)
        return response.data
    }

    /**
     * Update an existing preset
     */
    async updatePreset(id: number, request: UpdatePresetRequest): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.put(`${PRESET_BASE_URL}/${id}`, request)
        return response.data
    }

    /**
     * Delete a preset
     */
    async deletePreset(id: number): Promise<BaseResponse<void>> {
        const response = await apiClient.delete(`${PRESET_BASE_URL}/${id}`)
        return response.data
    }

    /**
     * Set a preset as default
     */
    async setDefaultPreset(id: number): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.post(`${PRESET_BASE_URL}/${id}/set-default`)
        return response.data
    }

    /**
     * Apply a preset (increment usage count and update last used)
     */
    async applyPreset(id: number): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.post(`${PRESET_BASE_URL}/${id}/apply`)
        return response.data
    }

    /**
     * Share a preset with workspace members
     */
    async sharePreset(id: number, workspaceId: number): Promise<BaseResponse<void>> {
        const response = await apiClient.post(`${PRESET_BASE_URL}/${id}/share`, { workspaceId })
        return response.data
    }

    /**
     * Get shared presets from workspace
     */
    async getSharedPresets(workspaceId: number): Promise<BaseResponse<UserPreset[]>> {
        const response = await apiClient.get(`${PRESET_BASE_URL}/shared/${workspaceId}`)
        return response.data
    }

    /**
     * Import a preset from JSON
     */
    async importPreset(presetData: CreatePresetRequest): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.post(`${PRESET_BASE_URL}/import`, presetData)
        return response.data
    }

    /**
     * Export a preset to JSON
     */
    async exportPreset(id: number): Promise<BaseResponse<UserPreset>> {
        const response = await apiClient.get(`${PRESET_BASE_URL}/${id}/export`)
        return response.data
    }
}

export const presetService = new PresetService()
export default presetService
