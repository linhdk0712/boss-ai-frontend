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