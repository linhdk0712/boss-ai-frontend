import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useJobQueue } from './useJobQueue'
import { useJobFilters } from './useJobFilters'
import { useVideoGeneration } from './useVideoGeneration'
import { jobQueueService } from '@/services/jobQueueService'
import { workflowIntegrationService } from '@/services/workflowIntegrationService'
import type {
    Job,
    JobDetails,
    RetryJobResponse,
    WorkflowResponse,
    JobStatistics
} from '@/types/content'

export interface JobAction {
    type: 'retry' | 'download' | 'video' | 'cancel' | 'details'
    jobId: number
    job?: Job
}

export interface JobQueueState {
    selectedJobs: number[]
    showDetailsModal: boolean
    showVideoDialog: boolean
    showFiltersPanel: boolean
    bulkActionInProgress: boolean
    lastRefresh: Date | null
}

export function useJobQueueManagement() {
    // Use existing composables
    const jobQueue = useJobQueue()
    const jobFilters = useJobFilters()
    const videoGeneration = useVideoGeneration()

    // Additional state
    const state = reactive<JobQueueState>({
        selectedJobs: [],
        showDetailsModal: false,
        showVideoDialog: false,
        showFiltersPanel: false,
        bulkActionInProgress: false,
        lastRefresh: null
    })

    const statistics = ref<JobStatistics | null>(null)
    const statisticsLoading = ref(false)
    const autoRefreshEnabled = ref(true)
    const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)
    const refreshIntervalMs = ref(30000) // 30 seconds

    // Computed properties
    const selectedJobsData = computed(() => {
        return jobQueue.jobs.value.filter(job => state.selectedJobs.includes(job.id))
    })

    const canRetrySelected = computed(() => {
        return selectedJobsData.value.some(job => job.canRetry)
    })

    const canGenerateVideoSelected = computed(() => {
        return selectedJobsData.value.some(job => job.canGenerateVideo)
    })

    const hasSelectedJobs = computed(() => {
        return state.selectedJobs.length > 0
    })

    const allJobsSelected = computed(() => {
        return jobQueue.jobs.value.length > 0 &&
            state.selectedJobs.length === jobQueue.jobs.value.length
    })

    const someJobsSelected = computed(() => {
        return state.selectedJobs.length > 0 &&
            state.selectedJobs.length < jobQueue.jobs.value.length
    })

    // Methods
    const loadJobs = async (page?: number, size?: number) => {
        const currentPage = page ?? jobQueue.pagination.page
        const currentSize = size ?? jobQueue.pagination.size
        const filters = jobFilters.getApiFilters()

        await jobQueue.getJobs(currentPage, currentSize, filters)
        state.lastRefresh = new Date()
    }

    const refreshJobs = async () => {
        await loadJobs()
    }

    const loadJobStatistics = async () => {
        statisticsLoading.value = true
        try {
            const result = await jobQueueService.getJobStatistics()
            if (result.errorCode === 'SUCCESS') {
                statistics.value = result.data
            }
        } catch (error) {
            console.error('Error loading job statistics:', error)
        } finally {
            statisticsLoading.value = false
        }
    }

    // Job selection methods
    const selectJob = (jobId: number) => {
        if (!state.selectedJobs.includes(jobId)) {
            state.selectedJobs.push(jobId)
        }
    }

    const deselectJob = (jobId: number) => {
        const index = state.selectedJobs.indexOf(jobId)
        if (index > -1) {
            state.selectedJobs.splice(index, 1)
        }
    }

    const toggleJobSelection = (jobId: number) => {
        if (state.selectedJobs.includes(jobId)) {
            deselectJob(jobId)
        } else {
            selectJob(jobId)
        }
    }

    const selectAllJobs = () => {
        state.selectedJobs = jobQueue.jobs.value.map(job => job.id)
    }

    const deselectAllJobs = () => {
        state.selectedJobs = []
    }

    const toggleAllJobsSelection = () => {
        if (allJobsSelected.value) {
            deselectAllJobs()
        } else {
            selectAllJobs()
        }
    }

    // Job action methods
    const handleJobAction = async (action: JobAction) => {
        switch (action.type) {
            case 'retry':
                await handleRetryJob(action.jobId)
                break
            case 'download':
                await handleDownloadJob(action.jobId)
                break
            case 'video':
                await handleGenerateVideo(action.jobId)
                break
            case 'cancel':
                await handleCancelJob(action.jobId)
                break
            case 'details':
                await handleViewJobDetails(action.jobId)
                break
        }
    }

    const handleRetryJob = async (jobId: number) => {
        try {
            const result = await jobQueue.retryJob(jobId)
            console.log(`Job ${jobId} retry initiated:`, result)

            // Refresh jobs to show the new retry job
            await refreshJobs()

            return result
        } catch (error) {
            console.error(`Error retrying job ${jobId}:`, error)
            throw error
        }
    }

    const handleDownloadJob = async (jobId: number, format: 'txt' | 'json' | 'pdf' = 'txt') => {
        try {
            await jobQueue.downloadJobContent(jobId, format)
        } catch (error) {
            console.error(`Error downloading job ${jobId}:`, error)
            throw error
        }
    }

    const handleGenerateVideo = async (jobId: number) => {
        try {
            state.showVideoDialog = true
            const result = await videoGeneration.generateVideoFromJobAsync(jobId)
            console.log(`Video generation started for job ${jobId}:`, result)
            return result
        } catch (error) {
            console.error(`Error generating video for job ${jobId}:`, error)
            state.showVideoDialog = false
            throw error
        }
    }

    const handleCancelJob = async (jobId: number) => {
        try {
            const result = await jobQueueService.cancelJob(jobId)
            console.log(`Job ${jobId} cancelled:`, result)

            // Refresh jobs to show updated status
            await refreshJobs()

            return result
        } catch (error) {
            console.error(`Error cancelling job ${jobId}:`, error)
            throw error
        }
    }

    const handleViewJobDetails = async (jobId: number) => {
        try {
            await jobQueue.getJobDetails(jobId)
            state.showDetailsModal = true
        } catch (error) {
            console.error(`Error loading job details for ${jobId}:`, error)
            throw error
        }
    }

    // Bulk operations
    const bulkRetryJobs = async (jobIds?: number[]) => {
        const targetJobs = jobIds || state.selectedJobs.filter(id => {
            const job = jobQueue.jobs.value.find(j => j.id === id)
            return job?.canRetry
        })

        if (targetJobs.length === 0) return

        state.bulkActionInProgress = true
        const results: Array<{ jobId: number; success: boolean; error?: string }> = []

        try {
            for (const jobId of targetJobs) {
                try {
                    await handleRetryJob(jobId)
                    results.push({ jobId, success: true })
                } catch (error: any) {
                    results.push({
                        jobId,
                        success: false,
                        error: error.message || 'Unknown error'
                    })
                }
            }

            // Clear selection after bulk operation
            deselectAllJobs()

            return results
        } finally {
            state.bulkActionInProgress = false
        }
    }

    const bulkGenerateVideos = async (jobIds?: number[]) => {
        const targetJobs = jobIds || state.selectedJobs.filter(id => {
            const job = jobQueue.jobs.value.find(j => j.id === id)
            return job?.canGenerateVideo
        })

        if (targetJobs.length === 0) return

        state.bulkActionInProgress = true

        try {
            const result = await workflowIntegrationService.batchGenerateVideosFromJobs(targetJobs)

            // Clear selection after bulk operation
            deselectAllJobs()

            return result
        } finally {
            state.bulkActionInProgress = false
        }
    }

    const bulkDownloadJobs = async (jobIds?: number[], format: 'txt' | 'json' | 'pdf' = 'txt') => {
        const targetJobs = jobIds || state.selectedJobs

        if (targetJobs.length === 0) return

        state.bulkActionInProgress = true
        const results: Array<{ jobId: number; success: boolean; error?: string }> = []

        try {
            for (const jobId of targetJobs) {
                try {
                    await handleDownloadJob(jobId, format)
                    results.push({ jobId, success: true })

                    // Add small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 500))
                } catch (error: any) {
                    results.push({
                        jobId,
                        success: false,
                        error: error.message || 'Unknown error'
                    })
                }
            }

            // Clear selection after bulk operation
            deselectAllJobs()

            return results
        } finally {
            state.bulkActionInProgress = false
        }
    }

    // Auto-refresh functionality
    const startAutoRefresh = () => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
        }

        autoRefreshInterval.value = setInterval(async () => {
            if (autoRefreshEnabled.value && !state.bulkActionInProgress) {
                try {
                    await refreshJobs()
                } catch (error) {
                    console.error('Auto-refresh failed:', error)
                }
            }
        }, refreshIntervalMs.value)
    }

    const stopAutoRefresh = () => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
            autoRefreshInterval.value = null
        }
    }

    const toggleAutoRefresh = () => {
        autoRefreshEnabled.value = !autoRefreshEnabled.value

        if (autoRefreshEnabled.value) {
            startAutoRefresh()
        } else {
            stopAutoRefresh()
        }
    }

    // Modal control methods
    const closeDetailsModal = () => {
        state.showDetailsModal = false
        jobQueue.selectedJob.value = null
    }

    const closeVideoDialog = () => {
        state.showVideoDialog = false
        videoGeneration.reset()
    }

    const toggleFiltersPanel = () => {
        state.showFiltersPanel = !state.showFiltersPanel
    }

    // Pagination methods
    const goToPage = async (page: number) => {
        await loadJobs(page)
    }

    const changePageSize = async (size: number) => {
        await loadJobs(0, size) // Reset to first page when changing size
    }

    // Filter methods
    const applyFilters = async () => {
        await loadJobs(0) // Reset to first page when applying filters
    }

    const clearFilters = async () => {
        jobFilters.clearAllFilters()
        await loadJobs(0)
    }

    // Initialize
    onMounted(async () => {
        // Load initial data
        await Promise.all([
            loadJobs(),
            loadJobStatistics()
        ])

        // Load saved filters
        jobFilters.loadFiltersFromStorage()

        // Start auto-refresh if enabled
        if (autoRefreshEnabled.value) {
            startAutoRefresh()
        }
    })

    // Cleanup
    onUnmounted(() => {
        stopAutoRefresh()
        jobFilters.saveFiltersToStorage()
    })

    return {
        // State from composables
        ...jobQueue,
        ...jobFilters,
        ...videoGeneration,

        // Additional state
        state,
        statistics,
        statisticsLoading,
        autoRefreshEnabled,
        refreshIntervalMs,

        // Computed
        selectedJobsData,
        canRetrySelected,
        canGenerateVideoSelected,
        hasSelectedJobs,
        allJobsSelected,
        someJobsSelected,

        // Methods
        loadJobs,
        refreshJobs,
        loadJobStatistics,

        // Selection methods
        selectJob,
        deselectJob,
        toggleJobSelection,
        selectAllJobs,
        deselectAllJobs,
        toggleAllJobsSelection,

        // Action methods
        handleJobAction,
        handleRetryJob,
        handleDownloadJob,
        handleGenerateVideo,
        handleCancelJob,
        handleViewJobDetails,

        // Bulk operations
        bulkRetryJobs,
        bulkGenerateVideos,
        bulkDownloadJobs,

        // Auto-refresh
        startAutoRefresh,
        stopAutoRefresh,
        toggleAutoRefresh,

        // Modal control
        closeDetailsModal,
        closeVideoDialog,
        toggleFiltersPanel,

        // Pagination
        goToPage,
        changePageSize,

        // Filters
        applyFilters,
        clearFilters
    }
}