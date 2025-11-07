import { ref, computed, onMounted, onUnmounted } from 'vue'
import { contentService } from '@/services/contentService'
import { useWebSocket } from '@/composables/useWebSocket'
import type {
    ContentGenerateRequest,
    ContentGenerateResponse,
    ContentSaveRequest,
    ContentGenerationDto,
    ContentWorkflowRequest,
    GenerationStats
} from '@/types/content'

export interface AsyncJob {
    id: string
    type: 'content_generation' | 'video_generation'
    status: 'queued' | 'processing' | 'completed' | 'failed'
    progress: number
    message: string
    request: ContentGenerateRequest | ContentWorkflowRequest
    result?: ContentGenerateResponse | any
    error?: string
    startedAt: number
    completedAt?: number
    estimatedDuration?: number
}

/**
 * Composable for asynchronous content generation with real-time updates
 * Provides job queue management, WebSocket integration, and fallback polling
 */
export function useAsyncContentGeneration() {
    // Job queue state
    const activeJobs = ref<Map<string, AsyncJob>>(new Map())
    const completedJobs = ref<Map<string, AsyncJob>>(new Map())
    const jobHistory = ref<AsyncJob[]>([])

    // WebSocket connection
    const {
        isConnected: wsConnected,
        connect: connectWebSocket,
        disconnect: disconnectWebSocket,
        subscribe: subscribeToJob,
        unsubscribe: unsubscribeFromJob,
        onMessage
    } = useWebSocket()

    // Fallback polling
    const pollingInterval = ref<NodeJS.Timeout | null>(null)
    const pollingEnabled = ref(false)
    const pollingIntervalMs = 2000 // Poll every 2 seconds

    // Operation states
    const isGenerating = computed(() => {
        return Array.from(activeJobs.value.values()).some(job =>
            job.type === 'content_generation' && job.status === 'processing'
        )
    })

    const isCreatingVideo = computed(() => {
        return Array.from(activeJobs.value.values()).some(job =>
            job.type === 'video_generation' && job.status === 'processing'
        )
    })

    const hasActiveJobs = computed(() => activeJobs.value.size > 0)

    const queueLength = computed(() => {
        return Array.from(activeJobs.value.values()).filter(job =>
            job.status === 'queued'
        ).length
    })

    const processingJobs = computed(() => {
        return Array.from(activeJobs.value.values()).filter(job =>
            job.status === 'processing'
        )
    })

    /**
     * Generate content asynchronously
     */
    const generateContentAsync = async (request: any): Promise<string> => {
        try {
            // Start the async generation process first to get the real job ID
            const queueRequest = {
                requestParams: request,
                contentType: request.contentType || 'article',
                priority: 'STANDARD',
                expirationHours: 24,
                maxRetries: 3
            }

            const response = await contentService.generateContentAsync(queueRequest as any)

            if (response.errorCode === 'SUCCESS') {
                const jobId = response.data?.jobId
                if (!jobId) {
                    throw new Error('No job ID returned from server')
                }

                // Create job entry with the real job ID
                const job: AsyncJob = {
                    id: jobId,
                    type: 'content_generation',
                    status: 'queued',
                    progress: 0,
                    message: 'Job queued successfully',
                    request,
                    startedAt: Date.now(),
                    estimatedDuration: 30000 // 30 seconds estimate
                }

                activeJobs.value.set(jobId, job)

                // Subscribe to job updates via WebSocket with the real job ID
                if (wsConnected.value) {
                    subscribeToJob(jobId)
                } else {
                    // Enable polling fallback
                    enablePolling()
                }

                return jobId
            } else {
                throw new Error(response.errorMessage || 'Failed to start generation')
            }
        } catch (error: any) {
            // console.error('Failed to start async content generation:', error)
            throw error
        }
    }

    /**
     * Create video asynchronously
     */
    const createVideoAsync = async (request: ContentWorkflowRequest): Promise<string> => {
        const jobId = generateJobId()

        const job: AsyncJob = {
            id: jobId,
            type: 'video_generation',
            status: 'queued',
            progress: 0,
            message: 'Queuing video generation...',
            request,
            startedAt: Date.now(),
            estimatedDuration: 120000 // 2 minutes estimate
        }

        activeJobs.value.set(jobId, job)

        try {
            if (wsConnected.value) {
                subscribeToJob(jobId)
            } else {
                enablePolling()
            }

            const response = await contentService.triggerWorkflowAsync({
                ...request,
                jobId
            })

            if (response.errorCode === 'SUCCESS') {
                updateJobStatus(jobId, 'processing', 5, 'Video generation started...')
                return jobId
            } else {
                updateJobStatus(jobId, 'failed', 0, response.errorMessage || 'Failed to start video generation')
                throw new Error(response.errorMessage)
            }
        } catch (error: any) {
            updateJobStatus(jobId, 'failed', 0, error.message || 'Failed to start video generation')
            throw error
        }
    }

    /**
     * Cancel active job
     */
    const cancelJob = async (jobId: string): Promise<void> => {
        const job = activeJobs.value.get(jobId)
        if (!job) return

        try {
            // Call backend to cancel job
            await contentService.cancelJob(jobId)

            // Update local state
            updateJobStatus(jobId, 'failed', job.progress, 'Job cancelled by user')

            // Unsubscribe from updates
            if (wsConnected.value) {
                unsubscribeFromJob(jobId)
            }
        } catch (error: any) {
            // console.error('Failed to cancel job:', error)
        }
    }

    /**
     * Retry failed job
     */
    const retryJob = async (jobId: string): Promise<string> => {
        const job = completedJobs.value.get(jobId) || activeJobs.value.get(jobId)
        if (!job || job.status !== 'failed') return jobId

        // Create new job with same request
        if (job.type === 'content_generation') {
            return await generateContentAsync(job.request as ContentGenerateRequest)
        } else if (job.type === 'video_generation') {
            return await createVideoAsync(job.request as ContentWorkflowRequest)
        }

        return jobId
    }

    /**
     * Get job by ID
     */
    const getJob = (jobId: string): AsyncJob | undefined => {
        return activeJobs.value.get(jobId) || completedJobs.value.get(jobId)
    }

    /**
     * Clear completed jobs
     */
    const clearCompletedJobs = (): void => {
        completedJobs.value.clear()
        jobHistory.value = jobHistory.value.filter(job =>
            job.status === 'processing' || job.status === 'queued'
        )
    }

    /**
     * Update job status
     */
    const updateJobStatus = (
        jobId: string,
        status: AsyncJob['status'],
        progress: number,
        message: string,
        result?: any,
        error?: string
    ): void => {
        const job = activeJobs.value.get(jobId)
        if (!job) return

        const updatedJob: AsyncJob = {
            ...job,
            status,
            progress: Math.max(0, Math.min(100, progress)),
            message,
            result,
            error,
            completedAt: (status === 'completed' || status === 'failed') ? Date.now() : undefined
        }

        if (status === 'completed' || status === 'failed') {
            // Move to completed jobs
            activeJobs.value.delete(jobId)
            completedJobs.value.set(jobId, updatedJob)

            // Add to history
            jobHistory.value.unshift(updatedJob)

            // Keep only last 50 jobs in history
            if (jobHistory.value.length > 50) {
                jobHistory.value = jobHistory.value.slice(0, 50)
            }

            // Unsubscribe from updates
            if (wsConnected.value) {
                unsubscribeFromJob(jobId)
            }
        } else {
            activeJobs.value.set(jobId, updatedJob)
        }
    }

    /**
     * Handle WebSocket messages
     */
    const handleWebSocketMessage = (message: any): void => {
        if (message.type === 'job_status_update') {
            const { jobId, data } = message
            updateJobStatus(
                jobId,
                data.status,
                data.progress || 0,
                data.message || 'Processing...',
                data.result,
                data.error
            )
        } else if (message.type === 'job_completed') {
            const { jobId, result } = message
            updateJobStatus(
                jobId,
                result.success ? 'completed' : 'failed',
                100,
                result.success ? 'Job completed successfully' : 'Job failed',
                result.success ? result.result : undefined,
                result.success ? undefined : result.error
            )
        }
    }

    /**
     * Enable polling fallback when WebSocket is unavailable
     */
    const enablePolling = (): void => {
        if (pollingEnabled.value || pollingInterval.value) return

        pollingEnabled.value = true
        pollingInterval.value = setInterval(async () => {
            if (activeJobs.value.size === 0) {
                disablePolling()
                return
            }

            // Poll status for all active jobs
            for (const [jobId, job] of activeJobs.value.entries()) {
                try {
                    const response = await contentService.getJobStatus(jobId)
                    if (response.errorCode === 'SUCCESS') {
                        const { status, progress, message, result, error } = response.data
                        updateJobStatus(jobId, status, progress, message, result, error)
                    }
                } catch (error) {
                    // console.error(`Failed to poll status for job ${jobId}:`, error)
                }
            }
        }, pollingIntervalMs)
    }

    /**
     * Disable polling
     */
    const disablePolling = (): void => {
        if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
        }
        pollingEnabled.value = false
    }

    /**
     * Generate unique job ID
     */
    const generateJobId = (): string => {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Initialize WebSocket connection and message handling
     */
    const initialize = (): void => {
        // Connect to WebSocket
        connectWebSocket()

        // Set up message handler
        onMessage(handleWebSocketMessage)

        // Enable polling if WebSocket fails to connect
        setTimeout(() => {
            if (!wsConnected.value && activeJobs.value.size > 0) {
                enablePolling()
            }
        }, 5000)
    }

    /**
     * Cleanup resources
     */
    const cleanup = (): void => {
        disablePolling()
        disconnectWebSocket()

        // Clear all jobs
        activeJobs.value.clear()
        completedJobs.value.clear()
    }

    // Initialize on mount
    onMounted(() => {
        initialize()
    })

    // Cleanup on unmount
    onUnmounted(() => {
        cleanup()
    })

    return {
        // State
        activeJobs: computed(() => Array.from(activeJobs.value.values())),
        completedJobs: computed(() => Array.from(completedJobs.value.values())),
        jobHistory,

        // Computed properties
        isGenerating,
        isCreatingVideo,
        hasActiveJobs,
        queueLength,
        processingJobs,
        wsConnected,
        pollingEnabled,

        // Methods
        generateContentAsync,
        createVideoAsync,
        cancelJob,
        retryJob,
        getJob,
        clearCompletedJobs,
        updateJobStatus,

        // Connection management
        initialize,
        cleanup
    }
}