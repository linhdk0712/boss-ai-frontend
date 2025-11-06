import { ref, reactive } from 'vue'
import { useJobNotifications } from './useJobNotifications'

export interface ErrorDetails {
    code: string
    message: string
    details?: any
    timestamp: number
    context?: string
    retryable: boolean
    userFriendlyMessage: string
}

export interface RetryConfig {
    maxAttempts: number
    baseDelay: number
    maxDelay: number
    backoffMultiplier: number
}

export interface NetworkErrorState {
    isOffline: boolean
    lastOnline: Date | null
    reconnectAttempts: number
    maxReconnectAttempts: number
}

/**
 * Enhanced error handling composable for job queue operations
 * Provides comprehensive error handling, retry mechanisms, and user-friendly error messages
 */
export function useJobQueueErrorHandler() {
    const { notifySystem } = useJobNotifications()

    // Error state
    const currentError = ref<ErrorDetails | null>(null)
    const errorHistory = ref<ErrorDetails[]>([])
    const showErrorDialog = ref(false)
    const showRetryDialog = ref(false)

    // Network state
    const networkState = reactive<NetworkErrorState>({
        isOffline: !navigator.onLine,
        lastOnline: navigator.onLine ? new Date() : null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5
    })

    // Retry state
    const retryInProgress = ref(false)
    const retryConfig = reactive<RetryConfig>({
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    })

    /**
     * Handle API errors with comprehensive error analysis
     */
    const handleApiError = (error: any, context: string = 'Unknown operation'): ErrorDetails => {
        const errorDetails = analyzeError(error, context)

        // Store error
        currentError.value = errorDetails
        addToErrorHistory(errorDetails)

        // Show appropriate user feedback
        showUserFeedback(errorDetails)

        return errorDetails
    }

    /**
     * Analyze error and create detailed error information
     */
    const analyzeError = (error: any, context: string): ErrorDetails => {
        const timestamp = Date.now()
        let code = 'UNKNOWN_ERROR'
        let message = 'An unexpected error occurred'
        let userFriendlyMessage = 'Something went wrong. Please try again.'
        let retryable = true
        let details = null

        // Network errors
        if (!navigator.onLine || error.code === 'NETWORK_ERROR') {
            code = 'NETWORK_ERROR'
            message = 'Network connection lost'
            userFriendlyMessage = 'Please check your internet connection and try again.'
            retryable = true
            updateNetworkState(false)
        }
        // Timeout errors
        else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
            code = 'TIMEOUT_ERROR'
            message = 'Request timed out'
            userFriendlyMessage = 'The operation is taking longer than expected. Please try again.'
            retryable = true
        }
        // HTTP errors
        else if (error.response?.status) {
            const status = error.response.status
            const responseData = error.response.data

            switch (status) {
                case 400:
                    code = 'BAD_REQUEST'
                    message = responseData?.errorMessage || 'Invalid request parameters'
                    userFriendlyMessage = 'Please check your input and try again.'
                    retryable = false
                    details = responseData?.validationErrors
                    break

                case 401:
                    code = 'UNAUTHORIZED'
                    message = 'Authentication required'
                    userFriendlyMessage = 'Your session has expired. Please log in again.'
                    retryable = false
                    break

                case 403:
                    code = 'FORBIDDEN'
                    message = 'Access denied'
                    userFriendlyMessage = 'You do not have permission to perform this action.'
                    retryable = false
                    break

                case 404:
                    code = 'NOT_FOUND'
                    message = 'Resource not found'
                    userFriendlyMessage = 'The requested item could not be found. It may have been deleted.'
                    retryable = false
                    break

                case 409:
                    code = 'CONFLICT'
                    message = 'Operation conflict'
                    userFriendlyMessage = 'This operation cannot be performed due to the current state of the resource.'
                    retryable = false
                    break

                case 422:
                    code = 'VALIDATION_ERROR'
                    message = responseData?.errorMessage || 'Validation failed'
                    userFriendlyMessage = 'Please check your input and correct any errors.'
                    retryable = false
                    details = responseData?.validationErrors
                    break

                case 429:
                    code = 'RATE_LIMIT'
                    message = 'Too many requests'
                    userFriendlyMessage = 'You are making requests too quickly. Please wait a moment and try again.'
                    retryable = true
                    break

                case 500:
                    code = 'SERVER_ERROR'
                    message = 'Internal server error'
                    userFriendlyMessage = 'A server error occurred. Our team has been notified. Please try again later.'
                    retryable = true
                    break

                case 502:
                case 503:
                case 504:
                    code = 'SERVICE_UNAVAILABLE'
                    message = 'Service temporarily unavailable'
                    userFriendlyMessage = 'The service is temporarily unavailable. Please try again in a few minutes.'
                    retryable = true
                    break

                default:
                    code = `HTTP_${status}`
                    message = responseData?.errorMessage || `HTTP ${status} error`
                    userFriendlyMessage = 'An error occurred while processing your request. Please try again.'
                    retryable = status >= 500
            }
        }
        // JavaScript errors
        else if (error instanceof Error) {
            code = 'JAVASCRIPT_ERROR'
            message = error.message
            userFriendlyMessage = 'A technical error occurred. Please refresh the page and try again.'
            retryable = true
            details = {
                stack: error.stack,
                name: error.name
            }
        }
        // Custom business logic errors
        else if (typeof error === 'string') {
            code = 'BUSINESS_ERROR'
            message = error
            userFriendlyMessage = error
            retryable = false
        }

        return {
            code,
            message,
            details,
            timestamp,
            context,
            retryable,
            userFriendlyMessage
        }
    }

    /**
     * Show appropriate user feedback based on error type
     */
    const showUserFeedback = (errorDetails: ErrorDetails) => {
        // For critical errors, show dialog
        if (['UNAUTHORIZED', 'FORBIDDEN', 'SERVER_ERROR'].includes(errorDetails.code)) {
            showErrorDialog.value = true
        }
        // For retryable errors, show retry dialog
        else if (errorDetails.retryable && ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT'].includes(errorDetails.code)) {
            showRetryDialog.value = true
        }
        // For other errors, show notification
        else {
            notifySystem('error', 'Operation Failed', errorDetails.userFriendlyMessage, false,
                errorDetails.retryable ? [{
                    label: 'Retry',
                    color: 'primary',
                    action: () => showRetryDialog.value = true
                }] : undefined
            )
        }
    }

    /**
     * Retry operation with exponential backoff
     */
    const retryOperation = async <T>(
        operation: () => Promise<T>,
        context: string = 'Operation',
        customConfig?: Partial<RetryConfig>
    ): Promise<T> => {
        const config = { ...retryConfig, ...customConfig }
        let lastError: any

        retryInProgress.value = true

        try {
            for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
                try {
                    const result = await operation()

                    // Success - reset network state if it was offline
                    if (networkState.isOffline) {
                        updateNetworkState(true)
                    }

                    return result
                } catch (error) {
                    lastError = error
                    const errorDetails = analyzeError(error, context)

                    // Don't retry non-retryable errors
                    if (!errorDetails.retryable) {
                        throw error
                    }

                    // Don't retry on last attempt
                    if (attempt === config.maxAttempts) {
                        break
                    }

                    // Calculate delay with exponential backoff
                    const delay = Math.min(
                        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
                        config.maxDelay
                    )

                    console.log(`Retry attempt ${attempt}/${config.maxAttempts} for ${context} in ${delay}ms`)

                    // Show retry notification
                    notifySystem('info', 'Retrying...',
                        `Attempt ${attempt}/${config.maxAttempts} - Retrying in ${Math.round(delay / 1000)} seconds`,
                        false
                    )

                    await new Promise(resolve => setTimeout(resolve, delay))
                }
            }

            // All retries failed
            throw lastError
        } finally {
            retryInProgress.value = false
        }
    }

    /**
     * Handle network state changes
     */
    const updateNetworkState = (isOnline: boolean) => {
        const wasOffline = networkState.isOffline
        networkState.isOffline = !isOnline

        if (isOnline) {
            networkState.lastOnline = new Date()
            networkState.reconnectAttempts = 0

            if (wasOffline) {
                notifySystem('success', 'Connection Restored',
                    'Your internet connection has been restored.', false
                )
            }
        } else {
            networkState.reconnectAttempts++

            if (!wasOffline) {
                notifySystem('warning', 'Connection Lost',
                    'Your internet connection has been lost. Retrying automatically...', true
                )
            }
        }
    }

    /**
     * Add error to history (keep last 50)
     */
    const addToErrorHistory = (errorDetails: ErrorDetails) => {
        errorHistory.value.unshift(errorDetails)
        if (errorHistory.value.length > 50) {
            errorHistory.value = errorHistory.value.slice(0, 50)
        }
    }

    /**
     * Get user-friendly error message for specific job operations
     */
    const getJobOperationErrorMessage = (operation: string, error: any): string => {
        const errorDetails = analyzeError(error, operation)

        switch (operation) {
            case 'fetch_jobs':
                return networkState.isOffline
                    ? 'Unable to load jobs while offline. Please check your connection.'
                    : 'Failed to load jobs. Please refresh the page.'

            case 'retry_job':
                if (errorDetails.code === 'CONFLICT') {
                    return 'This job cannot be retried in its current state.'
                }
                return 'Failed to retry job. Please try again.'

            case 'download_job':
                return 'Failed to download job content. Please try again.'

            case 'generate_video':
                if (errorDetails.code === 'FORBIDDEN') {
                    return 'You do not have permission to generate videos for this job.'
                }
                return 'Failed to start video generation. Please try again.'

            case 'cancel_job':
                if (errorDetails.code === 'CONFLICT') {
                    return 'This job cannot be cancelled in its current state.'
                }
                return 'Failed to cancel job. Please try again.'

            default:
                return errorDetails.userFriendlyMessage
        }
    }

    /**
     * Clear current error
     */
    const clearError = () => {
        currentError.value = null
        showErrorDialog.value = false
        showRetryDialog.value = false
    }

    /**
     * Clear error history
     */
    const clearErrorHistory = () => {
        errorHistory.value = []
    }

    /**
     * Check if error is recoverable
     */
    const isRecoverableError = (error: any): boolean => {
        const errorDetails = analyzeError(error, 'Check')
        return errorDetails.retryable
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => updateNetworkState(true))
        window.addEventListener('offline', () => updateNetworkState(false))
    }

    return {
        // State
        currentError,
        errorHistory,
        showErrorDialog,
        showRetryDialog,
        networkState,
        retryInProgress,
        retryConfig,

        // Methods
        handleApiError,
        retryOperation,
        getJobOperationErrorMessage,
        clearError,
        clearErrorHistory,
        isRecoverableError,
        updateNetworkState
    }
}