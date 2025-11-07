import { ref, computed } from 'vue'
import { contentService } from '@/services/contentService'
import type { ContentGenerationDto } from '@/types/content'

/**
 * Composable for tracking video generation progress
 * Provides real-time status updates for video workflows
 */
export function useVideoProgress() {
    // State
    const videoJobs = ref<Map<number, ContentGenerationDto>>(new Map())
    const polling = ref(false)
    const pollingInterval = ref<NodeJS.Timeout | null>(null)

    // Computed
    const activeVideoJobs = computed(() => {
        return Array.from(videoJobs.value.values()).filter(job =>
            job.status === 'WORKFLOW_TRIGGERED' || job.status === 'PROCESSING'
        )
    })

    const completedVideoJobs = computed(() => {
        return Array.from(videoJobs.value.values()).filter(job =>
            job.status === 'WORKFLOW_COMPLETED'
        )
    })

    const failedVideoJobs = computed(() => {
        return Array.from(videoJobs.value.values()).filter(job =>
            job.status === 'WORKFLOW_FAILED'
        )
    })

    const hasActiveJobs = computed(() => activeVideoJobs.value.length > 0)

    /**
     * Add a video job to tracking
     */
    const addVideoJob = (content: ContentGenerationDto) => {
        videoJobs.value.set(content.id, content)

        // Start polling if not already active
        if (!polling.value && hasActiveJobs.value) {
            startPolling()
        }
    }

    /**
     * Update video job status
     */
    const updateVideoJob = (contentId: number, updates: Partial<ContentGenerationDto>) => {
        const existing = videoJobs.value.get(contentId)
        if (existing) {
            videoJobs.value.set(contentId, { ...existing, ...updates })
        }
    }

    /**
     * Remove video job from tracking
     */
    const removeVideoJob = (contentId: number) => {
        videoJobs.value.delete(contentId)

        // Stop polling if no active jobs
        if (!hasActiveJobs.value) {
            stopPolling()
        }
    }

    /**
     * Start polling for video job updates
     */
    const startPolling = () => {
        if (polling.value) return

        polling.value = true
        pollingInterval.value = setInterval(async () => {
            await checkVideoJobsStatus()
        }, 5000) // Poll every 5 seconds
    }

    /**
     * Stop polling for video job updates
     */
    const stopPolling = () => {
        if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
        }
        polling.value = false
    }

    /**
     * Check status of all active video jobs
     */
    const checkVideoJobsStatus = async () => {
        const activeJobs = activeVideoJobs.value
        if (activeJobs.length === 0) {
            stopPolling()
            return
        }

        try {
            // Check each active job
            for (const job of activeJobs) {
                const response = await contentService.getContentById(job.id)

                if (response.errorCode === 'SUCCESS') {
                    const updatedContent = response.data
                    updateVideoJob(job.id, updatedContent)

                    // If job is completed or failed, we can stop tracking it
                    if (updatedContent.status === 'WORKFLOW_COMPLETED' ||
                        updatedContent.status === 'WORKFLOW_FAILED') {
                        // Keep in map for UI display, but it won't be polled anymore
                        // console.log(`Video job ${job.id} completed with status: ${updatedContent.status}`)
                    }
                }
            }
        } catch (error) {
            // console.error('Error checking video job status:', error)
        }
    }

    /**
     * Get video job by content ID
     */
    const getVideoJob = (contentId: number): ContentGenerationDto | undefined => {
        return videoJobs.value.get(contentId)
    }

    /**
     * Clear all completed and failed jobs
     */
    const clearCompletedJobs = () => {
        const activeIds = activeVideoJobs.value.map(job => job.id)
        const newMap = new Map<number, ContentGenerationDto>()

        // Keep only active jobs
        activeIds.forEach(id => {
            const job = videoJobs.value.get(id)
            if (job) {
                newMap.set(id, job)
            }
        })

        videoJobs.value = newMap
    }

    /**
     * Get progress percentage for a video job
     */
    const getJobProgress = (job: ContentGenerationDto): number => {
        switch (job.status) {
            case 'WORKFLOW_TRIGGERED':
                return 25
            case 'PROCESSING':
                return 50
            case 'WORKFLOW_COMPLETED':
                return 100
            case 'WORKFLOW_FAILED':
                return 0
            default:
                return 0
        }
    }

    /**
     * Get status color for UI display
     */
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'WORKFLOW_TRIGGERED':
            case 'PROCESSING':
                return 'warning'
            case 'WORKFLOW_COMPLETED':
                return 'success'
            case 'WORKFLOW_FAILED':
                return 'error'
            default:
                return 'grey'
        }
    }

    /**
     * Get status icon for UI display
     */
    const getStatusIcon = (status: string): string => {
        switch (status) {
            case 'WORKFLOW_TRIGGERED':
                return 'mdi-clock-outline'
            case 'PROCESSING':
                return 'mdi-cog'
            case 'WORKFLOW_COMPLETED':
                return 'mdi-check-circle'
            case 'WORKFLOW_FAILED':
                return 'mdi-alert-circle'
            default:
                return 'mdi-help-circle'
        }
    }

    /**
     * Get human-readable status text
     */
    const getStatusText = (status: string): string => {
        switch (status) {
            case 'WORKFLOW_TRIGGERED':
                return 'Đang khởi tạo...'
            case 'PROCESSING':
                return 'Đang xử lý...'
            case 'WORKFLOW_COMPLETED':
                return 'Hoàn thành'
            case 'WORKFLOW_FAILED':
                return 'Thất bại'
            default:
                return 'Không xác định'
        }
    }

    // Cleanup on unmount
    const cleanup = () => {
        stopPolling()
        videoJobs.value.clear()
    }

    return {
        // State
        videoJobs: computed(() => Array.from(videoJobs.value.values())),
        polling,

        // Computed
        activeVideoJobs,
        completedVideoJobs,
        failedVideoJobs,
        hasActiveJobs,

        // Methods
        addVideoJob,
        updateVideoJob,
        removeVideoJob,
        startPolling,
        stopPolling,
        checkVideoJobsStatus,
        getVideoJob,
        clearCompletedJobs,
        getJobProgress,
        getStatusColor,
        getStatusIcon,
        getStatusText,
        cleanup
    }
}