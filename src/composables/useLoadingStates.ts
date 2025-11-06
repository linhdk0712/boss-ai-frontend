import { ref, reactive, computed } from 'vue'

export interface LoadingState {
    isLoading: boolean
    progress?: number
    stage?: string
    message?: string
    startTime?: number
    estimatedDuration?: number
}

export interface OperationProgress {
    current: number
    total: number
    percentage: number
    stage: string
    message: string
    estimatedTimeRemaining?: number
}

/**
 * Composable for managing loading states and progress indicators
 * Provides centralized loading state management with progress tracking
 */
export function useLoadingStates() {
    // Global loading states for different operations
    const loadingStates = reactive<Record<string, LoadingState>>({
        fetchJobs: { isLoading: false },
        jobDetails: { isLoading: false },
        retryJob: { isLoading: false },
        downloadJob: { isLoading: false },
        generateVideo: { isLoading: false },
        cancelJob: { isLoading: false },
        bulkOperations: { isLoading: false },
        statistics: { isLoading: false }
    })

    // Operation progress tracking
    const operationProgress = reactive<Record<string, OperationProgress>>({})

    // Skeleton loading states
    const showSkeletonTable = ref(false)
    const showSkeletonDetails = ref(false)
    const showSkeletonFilters = ref(false)

    // Global loading indicator
    const globalLoading = computed(() => {
        return Object.values(loadingStates).some(state => state.isLoading)
    })

    // Critical operations that should show global loading
    const criticalOperations = ['fetchJobs', 'bulkOperations']
    const criticalLoading = computed(() => {
        return criticalOperations.some(op => loadingStates[op]?.isLoading)
    })

    /**
     * Start loading for a specific operation
     */
    const startLoading = (
        operation: string,
        options?: {
            message?: string
            estimatedDuration?: number
            stage?: string
        }
    ) => {
        loadingStates[operation] = {
            isLoading: true,
            startTime: Date.now(),
            message: options?.message,
            estimatedDuration: options?.estimatedDuration,
            stage: options?.stage
        }

        // Show skeleton loaders for specific operations
        if (operation === 'fetchJobs') {
            showSkeletonTable.value = true
        } else if (operation === 'jobDetails') {
            showSkeletonDetails.value = true
        }
    }

    /**
     * Stop loading for a specific operation
     */
    const stopLoading = (operation: string) => {
        if (loadingStates[operation]) {
            loadingStates[operation].isLoading = false
            loadingStates[operation].progress = undefined
            loadingStates[operation].stage = undefined
            loadingStates[operation].message = undefined
        }

        // Hide skeleton loaders
        if (operation === 'fetchJobs') {
            showSkeletonTable.value = false
        } else if (operation === 'jobDetails') {
            showSkeletonDetails.value = false
        }

        // Remove progress tracking
        delete operationProgress[operation]
    }

    /**
     * Update loading progress for an operation
     */
    const updateProgress = (
        operation: string,
        progress: number,
        options?: {
            stage?: string
            message?: string
            estimatedTimeRemaining?: number
        }
    ) => {
        if (loadingStates[operation]) {
            loadingStates[operation].progress = Math.min(100, Math.max(0, progress))
            loadingStates[operation].stage = options?.stage
            loadingStates[operation].message = options?.message
        }

        // Update detailed progress tracking
        operationProgress[operation] = {
            current: progress,
            total: 100,
            percentage: Math.min(100, Math.max(0, progress)),
            stage: options?.stage || 'Processing',
            message: options?.message || 'Please wait...',
            estimatedTimeRemaining: options?.estimatedTimeRemaining
        }
    }

    /**
     * Update operation stage without changing progress
     */
    const updateStage = (operation: string, stage: string, message?: string) => {
        if (loadingStates[operation]) {
            loadingStates[operation].stage = stage
            if (message) {
                loadingStates[operation].message = message
            }
        }

        if (operationProgress[operation]) {
            operationProgress[operation].stage = stage
            if (message) {
                operationProgress[operation].message = message
            }
        }
    }

    /**
     * Get loading state for a specific operation
     */
    const getLoadingState = (operation: string): LoadingState => {
        return loadingStates[operation] || { isLoading: false }
    }

    /**
     * Check if a specific operation is loading
     */
    const isLoading = (operation: string): boolean => {
        return loadingStates[operation]?.isLoading || false
    }

    /**
     * Get progress for a specific operation
     */
    const getProgress = (operation: string): OperationProgress | null => {
        return operationProgress[operation] || null
    }

    /**
     * Get estimated time remaining for an operation
     */
    const getEstimatedTimeRemaining = (operation: string): number | null => {
        const state = loadingStates[operation]
        if (!state?.isLoading || !state.startTime || !state.estimatedDuration) {
            return null
        }

        const elapsed = Date.now() - state.startTime
        const remaining = state.estimatedDuration - elapsed

        return Math.max(0, remaining)
    }

    /**
     * Get elapsed time for an operation
     */
    const getElapsedTime = (operation: string): number => {
        const state = loadingStates[operation]
        if (!state?.startTime) return 0

        return Date.now() - state.startTime
    }

    /**
     * Format duration in human-readable format
     */
    const formatDuration = (milliseconds: number): string => {
        if (milliseconds < 1000) {
            return `${Math.round(milliseconds)}ms`
        }

        const seconds = Math.floor(milliseconds / 1000)
        if (seconds < 60) {
            return `${seconds}s`
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes < 60) {
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
        }

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }

    /**
     * Execute operation with loading state management
     */
    const withLoading = async <T>(
        operation: string,
        asyncFn: () => Promise<T>,
        options?: {
            message?: string
            estimatedDuration?: number
            stage?: string
            showProgress?: boolean
        }
    ): Promise<T> => {
        startLoading(operation, options)

        try {
            const result = await asyncFn()
            return result
        } finally {
            stopLoading(operation)
        }
    }

    /**
     * Execute operation with progress tracking
     */
    const withProgress = async <T>(
        operation: string,
        asyncFn: (updateProgress: (progress: number, stage?: string, message?: string) => void) => Promise<T>,
        options?: {
            message?: string
            estimatedDuration?: number
        }
    ): Promise<T> => {
        startLoading(operation, options)

        try {
            const progressCallback = (progress: number, stage?: string, message?: string) => {
                updateProgress(operation, progress, { stage, message })
            }

            const result = await asyncFn(progressCallback)
            return result
        } finally {
            stopLoading(operation)
        }
    }

    /**
     * Simulate progress for operations without real progress tracking
     */
    const simulateProgress = (
        operation: string,
        duration: number = 3000,
        stages: Array<{ progress: number; stage: string; message?: string }> = []
    ) => {
        if (!isLoading(operation)) return

        const defaultStages = [
            { progress: 10, stage: 'Initializing', message: 'Starting operation...' },
            { progress: 30, stage: 'Processing', message: 'Processing request...' },
            { progress: 60, stage: 'Finalizing', message: 'Almost done...' },
            { progress: 90, stage: 'Completing', message: 'Finishing up...' }
        ]

        const progressStages = stages.length > 0 ? stages : defaultStages
        const stageInterval = duration / progressStages.length

        progressStages.forEach((stage, index) => {
            setTimeout(() => {
                if (isLoading(operation)) {
                    updateProgress(operation, stage.progress, {
                        stage: stage.stage,
                        message: stage.message
                    })
                }
            }, stageInterval * index)
        })
    }

    /**
     * Clear all loading states
     */
    const clearAllLoading = () => {
        Object.keys(loadingStates).forEach(operation => {
            stopLoading(operation)
        })
        showSkeletonTable.value = false
        showSkeletonDetails.value = false
        showSkeletonFilters.value = false
    }

    /**
     * Get loading summary for debugging
     */
    const getLoadingSummary = () => {
        const activeOperations = Object.entries(loadingStates)
            .filter(([, state]) => state.isLoading)
            .map(([operation, state]) => ({
                operation,
                duration: state.startTime ? Date.now() - state.startTime : 0,
                stage: state.stage,
                progress: state.progress
            }))

        return {
            totalActive: activeOperations.length,
            operations: activeOperations,
            globalLoading: globalLoading.value,
            criticalLoading: criticalLoading.value
        }
    }

    return {
        // State
        loadingStates,
        operationProgress,
        showSkeletonTable,
        showSkeletonDetails,
        showSkeletonFilters,

        // Computed
        globalLoading,
        criticalLoading,

        // Methods
        startLoading,
        stopLoading,
        updateProgress,
        updateStage,
        getLoadingState,
        isLoading,
        getProgress,
        getEstimatedTimeRemaining,
        getElapsedTime,
        formatDuration,
        withLoading,
        withProgress,
        simulateProgress,
        clearAllLoading,
        getLoadingSummary
    }
}