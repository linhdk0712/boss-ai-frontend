// Content Generation Types
export interface ContentGenerationForm {
    content: string
    industry?: string
    contentType: string
    language: string
    tone?: string
    targetAudience?: string
    title?: string
}

export interface ContentGenerateRequest {
    content: string
    industry?: string
    contentType: string
    language?: string
    tone?: string
    targetAudience?: string
    title?: string
}

export interface ContentGenerateResponse {
    generatedContent: string
    title: string
    wordCount: number
    characterCount: number
    tokensUsed: number
    generationCost: number
    processingTimeMs: number
    status: string
    errorMessage?: string
    // OpenAI incomplete response support
    isIncomplete?: boolean
    incompleteDetails?: {
        reason?: string
    }
    // Additional metrics
    estimatedCost?: number
    qualityScore?: number
}

export interface ConfigOption {
    id: number
    category: string
    value: string
    label: string
    displayLabel: string
    description?: string
    sortOrder: number
    active: boolean
    language: string
}

export interface ContentSaveRequest {
    title: string
    content: string
    generatedContent: string
    industry?: string
    contentType: string
    language: string
    tone?: string
    targetAudience?: string
}

export interface ContentWorkflowRequest {
    content: string
    title?: string
    contentType: string
    industry?: string
    language?: string
    tone?: string
    targetAudience?: string
}

// User type for content response
export interface ContentUser {
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
    language: string
    isActive: boolean
    lastLoginAt: string
    createdAt: string
    updatedAt: string
}

// Content Management Types
export interface ContentGenerationDto {
    id: number
    user: ContentUser
    contentType: string
    status: string
    aiProvider: string
    aiModel: string
    prompt?: string
    generatedContent: string
    title: string
    wordCount: number
    characterCount: number
    tokensUsed?: number
    generationCost?: number
    processingTimeMs?: number
    qualityScore?: number
    readabilityScore?: number
    sentimentScore?: number
    templateId?: number
    industry: string
    targetAudience: string
    tone: string
    language: string
    errorMessage?: string
    retryCount: number
    maxRetries: number
    startedAt?: string
    completedAt?: string
    failedAt?: string
    isBillable: boolean
    subscriptionId?: number
    createdAt: string
    updatedAt: string
    version?: number
    currentVersion: number
    // Legacy field for backward compatibility
    content?: string
}

// Generation Statistics
export interface GenerationStats {
    wordCount: number
    characterCount: number
    tokensUsed: number
    generationCost: number
    processingTimeMs: number
}

// Form Validation Types
export interface ContentFormValidation {
    content: {
        required: boolean
        maxLength: number
    }
    title: {
        maxLength: number
    }
    contentType: {
        required: boolean
    }
}

// API Response Types (re-export BaseResponse from auth.ts for convenience)
export type { BaseResponse } from './auth'

// Paginated Response for content lists
export interface PaginatedResponse<T> {
    errorCode: string
    errorMessage: string
    data: T[]
    pagination: {
        page: number
        size: number
        total: number
        totalPages: number
    }
}