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

// Content Version Management Types
export interface ContentVersion {
    id: number
    contentId: number
    versionNumber: number
    content: string
    title?: string

    // Generation parameters
    generationParams: Record<string, any>
    aiProvider: string
    aiModel: string

    // Metrics
    tokensUsed?: number
    generationCost?: number
    processingTimeMs?: number
    readabilityScore?: number
    seoScore?: number
    qualityScore?: number
    sentimentScore?: number

    // Content statistics
    wordCount?: number
    characterCount?: number

    // Metadata
    industry?: string
    targetAudience?: string
    tone?: string
    language?: string

    // Version branching and tagging
    parentVersionId?: number
    branchName?: string
    isExperimental?: boolean
    versionTag?: string
    annotation?: string

    // Audit fields
    createdBy: number
    createdByUsername?: string
    createdAt: string
    updatedAt?: string

    // Calculated fields
    overallScore?: number
    isLatestVersion?: boolean
    totalVersions?: number
}

export interface ContentVersionComparison {
    contentId: number
    versionA: ContentVersion
    versionB: ContentVersion

    // Text comparison results
    textDifferences: TextDifference[]
    comparisonSummary: ComparisonSummary

    // Metrics comparison
    metricsComparison: MetricComparison

    // Performance analysis
    performanceComparison: PerformanceComparison

    // Recommendation
    recommendation: VersionRecommendation

    // Comparison metadata
    comparedBy: number
    comparedByUsername?: string
    comparedAt: string
}

export interface TextDifference {
    type: 'ADDITION' | 'DELETION' | 'MODIFICATION' | 'UNCHANGED'
    originalText?: string
    newText?: string
    startPosition: number
    endPosition: number
    lineNumber: number
}

export interface ComparisonSummary {
    totalChanges: number
    additions: number
    deletions: number
    modifications: number
    similarityPercentage: number
    wordCountDifference: number
    characterCountDifference: number
}

export interface MetricComparison {
    qualityScore?: ScoreComparison
    readabilityScore?: ScoreComparison
    seoScore?: ScoreComparison
    sentimentScore?: ScoreComparison
    overallScore?: ScoreComparison

    // Performance metrics
    processingTimeDifference?: number
    costDifference?: number
    tokenUsageDifference?: number
}

export interface ScoreComparison {
    versionAScore?: number
    versionBScore?: number
    difference: number
    percentageChange: number
    winner: 'A' | 'B' | 'TIE'
    significance: 'MAJOR' | 'MINOR' | 'NEGLIGIBLE'
}

export interface PerformanceComparison {
    overallWinner: 'A' | 'B' | 'TIE'
    performanceGap: number
    versionAStrengths: string[]
    versionBStrengths: string[]
    improvementAreas: string[]
    detailedAnalysis: Record<string, any>
}

export interface VersionRecommendation {
    recommendedVersion: 'A' | 'B'
    confidenceScore: number
    reasoning: string
    keyFactors: string[]
    considerations: string[]
    analysisDetails: Record<string, any>
}

export interface VersionStatistics {
    totalVersions: number
    latestVersion: number
    averageQualityScore?: number
    averageReadabilityScore?: number
    averageSeoScore?: number
    totalTokensUsed: number
    totalCost: number
    averageProcessingTime: number
    branchCount: number
    tagCount: number
}

export interface VersionBranch {
    branchName: string
    description?: string
    isExperimental: boolean
    versionCount: number
    latestVersion: ContentVersion
    versions: ContentVersion[]
    createdAt: string
}

export interface CreateVersionBranchRequest {
    parentVersionId: number
    branchName: string
    description?: string
    isExperimental?: boolean
}

export interface VersionTagRequest {
    versionTag: string
    annotation?: string
}