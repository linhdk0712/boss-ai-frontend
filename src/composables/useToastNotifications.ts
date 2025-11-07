import { ref, reactive, computed } from 'vue'

export interface ToastNotification {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    persistent?: boolean
    showProgress?: boolean
    actions?: ToastAction[]
    icon?: string
    timestamp: number
}

export interface ToastAction {
    label: string
    color?: string
    variant?: 'text' | 'outlined' | 'elevated'
    icon?: string
    action: () => void
}

export interface ToastOptions {
    duration?: number
    persistent?: boolean
    showProgress?: boolean
    actions?: ToastAction[]
    icon?: string
    position?: 'top' | 'bottom' | 'center'
    location?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

/**
 * Enhanced toast notification system
 * Provides comprehensive toast notifications with actions, progress, and queuing
 */
export function useToastNotifications() {
    // State
    const toasts = ref<Map<string, ToastNotification>>(new Map())
    const activeToast = ref<ToastNotification | null>(null)
    const toastQueue = ref<ToastNotification[]>([])
    const showToast = ref(false)

    // Settings
    const defaultDuration = ref(5000)
    const maxToasts = ref(5)
    const enableSounds = ref(true)
    const enableAnimations = ref(true)
    const position = ref<'top' | 'bottom' | 'center'>('top')

    // Progress tracking for current toast
    const toastProgress = ref(0)
    const progressInterval = ref<NodeJS.Timeout | null>(null)

    // Computed
    const toastList = computed(() => Array.from(toasts.value.values()))
    const hasActiveToast = computed(() => activeToast.value !== null)
    const queueLength = computed(() => toastQueue.value.length)

    /**
     * Show success toast
     */
    const showSuccess = (
        title: string,
        message?: string,
        options?: ToastOptions
    ): string => {
        return addToast('success', title, message, options)
    }

    /**
     * Show error toast
     */
    const showError = (
        title: string,
        message?: string,
        options?: ToastOptions
    ): string => {
        return addToast('error', title, message, {
            ...options,
            duration: options?.duration || 8000, // Longer duration for errors
            persistent: options?.persistent ?? true
        })
    }

    /**
     * Show warning toast
     */
    const showWarning = (
        title: string,
        message?: string,
        options?: ToastOptions
    ): string => {
        return addToast('warning', title, message, {
            ...options,
            duration: options?.duration || 6000
        })
    }

    /**
     * Show info toast
     */
    const showInfo = (
        title: string,
        message?: string,
        options?: ToastOptions
    ): string => {
        return addToast('info', title, message, options)
    }

    /**
     * Show job operation success
     */
    const showJobSuccess = (operation: string, jobId?: number | string): string => {
        const messages = {
            retry: 'Job retried successfully',
            download: 'Content downloaded successfully',
            cancel: 'Job cancelled successfully',
            generate_video: 'Video generation started',
            delete: 'Job deleted successfully'
        }

        const title = messages[operation as keyof typeof messages] || 'Operation completed'
        const message = jobId ? `Job ID: ${jobId}` : undefined

        return showSuccess(title, message, {
            icon: 'mdi-check-circle',
            duration: 4000
        })
    }

    /**
     * Show job operation error
     */
    const showJobError = (operation: string, error: string, jobId?: number | string): string => {
        const titles = {
            retry: 'Failed to retry job',
            download: 'Download failed',
            cancel: 'Failed to cancel job',
            generate_video: 'Video generation failed',
            delete: 'Failed to delete job',
            fetch: 'Failed to load jobs'
        }

        const title = titles[operation as keyof typeof titles] || 'Operation failed'
        const message = jobId ? `Job ID: ${jobId} - ${error}` : error

        return showError(title, message, {
            icon: 'mdi-alert-circle',
            actions: [{
                label: 'Retry',
                color: 'primary',
                icon: 'mdi-refresh',
                action: () => {
                    // This would be handled by the parent component
                    // console.log('Retry action triggered')
                }
            }]
        })
    }

    /**
     * Show network status toast
     */
    const showNetworkStatus = (isOnline: boolean): string => {
        if (isOnline) {
            return showSuccess('Connection Restored', 'Your internet connection has been restored.', {
                icon: 'mdi-wifi',
                duration: 3000
            })
        } else {
            return showWarning('Connection Lost', 'Please check your internet connection.', {
                icon: 'mdi-wifi-off',
                persistent: true,
                actions: [{
                    label: 'Retry',
                    color: 'primary',
                    icon: 'mdi-refresh',
                    action: () => {
                        // Trigger connection retry
                        window.location.reload()
                    }
                }]
            })
        }
    }

    /**
     * Show bulk operation result
     */
    const showBulkOperationResult = (
        operation: string,
        successCount: number,
        errorCount: number,
        totalCount: number
    ): string => {
        const isSuccess = errorCount === 0
        const title = isSuccess
            ? `${operation} completed successfully`
            : `${operation} completed with errors`

        const message = `${successCount}/${totalCount} items processed successfully`

        if (isSuccess) {
            return showSuccess(title, message, {
                icon: 'mdi-check-all',
                duration: 5000
            })
        } else {
            return showWarning(title, message, {
                icon: 'mdi-alert-circle',
                duration: 8000,
                actions: [{
                    label: 'View Details',
                    color: 'primary',
                    icon: 'mdi-information',
                    action: () => {
                        // Show detailed results
                        // console.log('Show bulk operation details')
                    }
                }]
            })
        }
    }

    /**
     * Add toast to system
     */
    const addToast = (
        type: ToastNotification['type'],
        title: string,
        message?: string,
        options?: ToastOptions
    ): string => {
        const id = generateToastId()
        const toast: ToastNotification = {
            id,
            type,
            title,
            message,
            duration: options?.duration || defaultDuration.value,
            persistent: options?.persistent || false,
            showProgress: options?.showProgress ?? true,
            actions: options?.actions || [],
            icon: options?.icon || getDefaultIcon(type),
            timestamp: Date.now()
        }

        toasts.value.set(id, toast)

        // Add to queue if no active toast or queue
        if (!activeToast.value) {
            showNextToast()
        } else {
            toastQueue.value.push(toast)
        }

        // Play sound
        if (enableSounds.value) {
            playNotificationSound(type)
        }

        // Clean up old toasts
        cleanupOldToasts()

        return id
    }

    /**
     * Show next toast in queue
     */
    const showNextToast = () => {
        if (activeToast.value || toastQueue.value.length === 0) return

        const nextToast = toastQueue.value.shift()
        if (!nextToast) return

        activeToast.value = nextToast
        showToast.value = true
        toastProgress.value = 0

        // Start progress tracking
        if (nextToast.showProgress && !nextToast.persistent) {
            startProgressTracking(nextToast.duration || defaultDuration.value)
        }

        // Auto-hide after duration (if not persistent)
        if (!nextToast.persistent) {
            setTimeout(() => {
                hideCurrentToast()
            }, nextToast.duration || defaultDuration.value)
        }
    }

    /**
     * Hide current toast
     */
    const hideCurrentToast = () => {
        if (!activeToast.value) return

        showToast.value = false
        stopProgressTracking()

        // Wait for animation to complete
        setTimeout(() => {
            activeToast.value = null
            toastProgress.value = 0

            // Show next toast
            showNextToast()
        }, 300)
    }

    /**
     * Remove specific toast
     */
    const removeToast = (id: string) => {
        toasts.value.delete(id)

        // Remove from queue
        const queueIndex = toastQueue.value.findIndex(toast => toast.id === id)
        if (queueIndex > -1) {
            toastQueue.value.splice(queueIndex, 1)
        }

        // Hide if it's the active toast
        if (activeToast.value?.id === id) {
            hideCurrentToast()
        }
    }

    /**
     * Clear all toasts
     */
    const clearAllToasts = () => {
        toasts.value.clear()
        toastQueue.value = []
        hideCurrentToast()
    }

    /**
     * Start progress tracking for current toast
     */
    const startProgressTracking = (duration: number) => {
        stopProgressTracking()

        const startTime = Date.now()
        const updateInterval = 50 // Update every 50ms for smooth progress

        progressInterval.value = setInterval(() => {
            const elapsed = Date.now() - startTime
            const progress = Math.min((elapsed / duration) * 100, 100)
            toastProgress.value = progress

            if (progress >= 100) {
                stopProgressTracking()
            }
        }, updateInterval)
    }

    /**
     * Stop progress tracking
     */
    const stopProgressTracking = () => {
        if (progressInterval.value) {
            clearInterval(progressInterval.value)
            progressInterval.value = null
        }
    }

    /**
     * Get default icon for toast type
     */
    const getDefaultIcon = (type: ToastNotification['type']): string => {
        switch (type) {
            case 'success':
                return 'mdi-check-circle'
            case 'error':
                return 'mdi-alert-circle'
            case 'warning':
                return 'mdi-alert'
            case 'info':
                return 'mdi-information'
            default:
                return 'mdi-information'
        }
    }

    /**
     * Play notification sound
     */
    const playNotificationSound = (type: ToastNotification['type']) => {
        try {
            const audio = new Audio()

            switch (type) {
                case 'success':
                    audio.src = '/sounds/success.mp3'
                    break
                case 'error':
                    audio.src = '/sounds/error.mp3'
                    break
                case 'warning':
                    audio.src = '/sounds/warning.mp3'
                    break
                default:
                    audio.src = '/sounds/info.mp3'
            }

            audio.volume = 0.3
            audio.play().catch(() => {
                // Ignore audio play errors (user interaction required)
            })
        } catch (error) {
            // Ignore audio errors
        }
    }

    /**
     * Generate unique toast ID
     */
    const generateToastId = (): string => {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Clean up old toasts (keep last 20)
     */
    const cleanupOldToasts = () => {
        if (toasts.value.size <= 20) return

        const sortedToasts = Array.from(toasts.value.entries())
            .sort(([, a], [, b]) => b.timestamp - a.timestamp)

        toasts.value.clear()
        sortedToasts.slice(0, 20).forEach(([id, toast]) => {
            toasts.value.set(id, toast)
        })
    }

    /**
     * Pause current toast (stop auto-hide)
     */
    const pauseCurrentToast = () => {
        stopProgressTracking()
    }

    /**
     * Resume current toast
     */
    const resumeCurrentToast = () => {
        if (activeToast.value && !activeToast.value.persistent && activeToast.value.showProgress) {
            const remainingTime = activeToast.value.duration || defaultDuration.value
            startProgressTracking(remainingTime)
        }
    }

    return {
        // State
        toasts: toastList,
        activeToast,
        showToast,
        toastProgress,
        queueLength,

        // Settings
        defaultDuration,
        maxToasts,
        enableSounds,
        enableAnimations,
        position,

        // Computed
        hasActiveToast,

        // Methods
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showJobSuccess,
        showJobError,
        showNetworkStatus,
        showBulkOperationResult,
        removeToast,
        clearAllToasts,
        hideCurrentToast,
        pauseCurrentToast,
        resumeCurrentToast
    }
}