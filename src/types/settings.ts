// Settings Types based on VUserConfigDto from backend
export interface VUserConfigDto {
    id: number
    category: string
    value: string
    label: string
    displayLabel: string
    description?: string
    sortOrder: number
    configActive: boolean
    language: string
    configCreatedAt: string
    configUpdatedAt: string
    userId?: number
    isSelected: boolean
    userSelectionCreatedAt?: string
    userSelectionUpdatedAt?: string
}

// Settings Categories (matching backend constants)
export enum SettingsCategory {
    TONE = 'tone',
    INDUSTRY = 'industry',
    LANGUAGE = 'language',
    TARGET_AUDIENCE = 'target-audience',
    CONTENT_TYPE = 'content-type'
}

// Settings Tab Configuration
export interface SettingsTab {
    key: SettingsCategory
    title: string
    icon: string
    description: string
}

// Update Request for Settings
export interface SettingsUpdateRequest {
    id: number
    category: string
    isSelected: boolean
}

// Settings Response Types
import type { BaseResponse } from './auth'

export interface SettingsResponse extends BaseResponse<VUserConfigDto[]> { }