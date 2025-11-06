/**
 * N8N Node Run Types
 * Based on the sequence diagram for content-status functionality
 */

export interface N8nNodeRunDto {
    id: number
    userId: number
    workflowId: string
    workflowName: string
    executionId: string
    nodeId: string
    nodeName: string
    nodeType: string
    status: N8nNodeRunStatus
    startTime: string
    endTime?: string
    duration?: number
    inputData?: Record<string, any>
    outputData?: Record<string, any>
    errorMessage?: string
    retryCount: number
    maxRetries: number
    createdAt: string
    updatedAt: string
}

export type N8nNodeRunStatus =
    | 'PENDING'
    | 'RUNNING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CANCELLED'
    | 'TIMEOUT'

export interface N8nNodeRunFilter {
    status?: N8nNodeRunStatus[]
    workflowId?: string
    nodeType?: string
    dateFrom?: string
    dateTo?: string
    search?: string
}

export interface N8nNodeRunStatistics {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    runningRuns: number
    averageDuration: number
    successRate: number
}

// API Response types
export interface BaseResponse<T> {
    errorCode: string
    errorMessage: string
    data: T
}

export interface PaginatedN8nNodeRunResponse {
    content: N8nNodeRunDto[]
    number: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}