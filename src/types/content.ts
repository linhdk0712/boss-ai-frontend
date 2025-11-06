// Job related types
export interface Job {
    id: string
    jobId: string
    userId: number
    status: JobStatus
    priority: JobPriority
    contentType: string
    requestParams: Record<string, any>
    result?: string
    errorMessage?: string
    queuePosition?: number
    estimatedCompletionTime?: string
    createdAt: string
    startedAt?: string
    completedAt?: string
    expiresAt?: string
    retryCount: number
    maxRetries: number
    lastRetryAt?: string
}

export interface JobDetails extends Job {
    processingLog?: string[]
    metadata?: Record<string, any>
}

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
export type JobPriority = 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT'

export interface PaginationInfo {
    page: number
    size: number
    total: number
    totalPages: number
}

export interface JobFilterCriteria {
    status?: JobStatus[]
    contentType?: string[]
    priority?: JobPriority[]
    dateFrom?: string
    dateTo?: string
    userId?: number
}

// API Response types
export interface BaseResponse<T> {
    errorCode: string
    errorMessage: string
    data: T
}

export interface PagedResponse<T> {
    content: T[]
    number: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

// Content Generation Types
export interface ContentGenerationDto {
    id: number
    user: UserDto
    contentType: string
    status: string
    aiProvider: string
    aiModel?: string
    prompt?: string
    generatedContent?: string
    title?: string
    wordCount?: number
    characterCount?: number
    tokensUsed?: number
    generationCost?: number
    processingTimeMs?: number
    qualityScore?: number
    readabilityScore?: number
    sentimentScore?: number
    templateId?: number
    industry?: string
    targetAudience?: string
    tone?: string
    language?: string
    errorMessage?: string
    retryCount: number
    maxRetries: number
    startedAt?: string
    completedAt?: string
    failedAt?: string
    isBillable: boolean
    subscriptionId?: number
    createdAt: string
    updatedAt?: string
    version?: number
    currentVersion?: number
    openaiResponseId?: string
}

export interface UserDto {
    id: number
    username: string
    email: string
    roles?: string[]
}

export interface ContentGenerateRequest {
    content: string
    contentType: string
    title?: string
    tone?: string
    language?: string
    industry?: string
    targetAudience?: string
}

export interface ContentGenerateResponse {
    contentId?: number
    generatedContent: string
    title?: string
    wordCount?: number
    characterCount?: number
    tokensUsed?: number
    generationCost?: number
    processingTimeMs?: number
    status: string
    errorMessage?: string
    generationParams?: Record<string, any>
    aiProvider?: string
    aiModel?: string
    openaiResponseId?: string
    readabilityScore?: number
    seoScore?: number
    qualityScore?: number
    sentimentScore?: number
    industry?: string
    targetAudience?: string
    tone?: string
    language?: string
}

export interface ContentSaveRequest {
    title: string
    generatedContent: string
    contentType?: string
    prompt?: string
    tone?: string
    language?: string
    industry?: string
    targetAudience?: string
}

export interface ContentWorkflowRequest {
    title: string
    generatedContent: string
    contentType?: string
    prompt?: string
    tone?: string
    language?: string
    industry?: string
    targetAudience?: string
}

export interface GenerationStats {
    totalGenerated: number
    totalSaved: number
    averageWordCount: number
    mostUsedContentType: string
    totalTokensUsed: number
    totalCost: number
}

export interface ContentVersion {
    id: number
    contentId: number
    versionNumber: number
    title: string
    generatedContent: string
    wordCount?: number
    characterCount?: number
    qualityScore?: number
    readabilityScore?: number
    sentimentScore?: number
    createdAt: string
    isActive: boolean
}