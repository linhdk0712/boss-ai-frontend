// Preset types for content generation configuration management

export interface UserPreset {
    id: number
    userId: number
    name: string
    description?: string

    // Configuration
    configuration: PresetConfiguration

    // Metadata
    isDefault: boolean
    usageCount: number
    lastUsedAt?: string

    createdAt: string
    updatedAt: string
}

export interface PresetConfiguration {
    content?: string
    industry?: string
    contentType: string
    language: string
    tone?: string
    targetAudience?: string
    title?: string
    customParams?: Record<string, any>
}

export interface CreatePresetRequest {
    name: string
    description?: string
    configuration: PresetConfiguration
    isDefault?: boolean
}

export interface UpdatePresetRequest {
    name?: string
    description?: string
    configuration?: PresetConfiguration
    isDefault?: boolean
}

export interface PresetSearchFilters {
    query?: string
    contentType?: string
    isDefault?: boolean
    sortBy?: 'name' | 'usageCount' | 'lastUsedAt' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
}
