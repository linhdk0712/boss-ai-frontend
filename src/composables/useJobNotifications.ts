import { ref, computed } from 'vue'
import type { AsyncJob } from '@/composables/useAsyncContentGeneration'

export interface JobNotification {
    id: string
    jobId: string
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message: string
    timestamp: number
    read: boolean
    persistent?: boolean
    actions?: NotificationAction[]
}

export interface NotificationAction {
    label: string
    color?: string
    action: () => void
}

/**
 * Composable for managing job completion notifications
 * Provides toast notifications, persistent notifications, and notification history
 */
export function useJobNotifications() {
    // Notification state
    const notifications = ref<Map<string, JobNotification>>(new Map())
    const toastQueue = ref<JobNotification[]>([])
    const currentToast = ref<JobNotification | null>(null)
    const showToast = ref(false)

    // Settings
    const enableToasts = ref(true)
    const enableSounds = ref(true)
    const enableBrowserNotifications = ref(false)
    const toastDuration = ref(5000)

    // Computed properties
    const unreadCount = computed(() => {
        return Array.from(notifications.value.values()).filter(n => !n.read).length
    })

    const recentNotifications = computed(() => {
        return Array.from(notifications.value.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10)
    })

    const hasUnread = computed(() => unreadCount.value > 0)

    /**
     * Create notification for job completion
     */
    const notifyJobCompletion = (job: AsyncJob): void => {
        const isSuccess = job.status === 'completed'
        const notification: JobNotification = {
            id: generateNotificationId(),
            jobId: job.id,
            type: isSuccess ? 'success' : 'error',
            title: isSuccess ? 'Generation Complete!' : 'Generation Failed',
            message: isSuccess
                ? `${getJobTypeLabel(job.type)} has been generated successfully`
                : `${getJobTypeLabel(job.type)} failed: ${job.error || 'Unknown error'}`,
            timestamp: Date.now(),
            read: false,
            persistent: !isSuccess, // Keep error notifications persistent
            actions: isSuccess ? [
                {
                    label: 'View',
                    color: 'primary',
                    action: () => viewJobResult(job)
                }
            ] : [
                {
                    label: 'Retry',
                    color: 'primary',
                    action: () => retryJob(job)
                }
            ]
        }

        addNotification(notification)
    }

    /**
     * Create notification for job progress
     */
    const notifyJobProgress = (job: AsyncJob, message: string): void => {
        const notification: JobNotification = {
            id: generateNotificationId(),
            jobId: job.id,
            type: 'info',
            title: `${getJobTypeLabel(job.type)} Progress`,
            message,
            timestamp: Date.now(),
            read: false,
            persistent: false
        }

        addNotification(notification)
    }

    /**
     * Create system notification
     */
    const notifySystem = (
        type: JobNotification['type'],
        title: string,
        message: string,
        persistent = false,
        actions?: NotificationAction[]
    ): void => {
        const notification: JobNotification = {
            id: generateNotificationId(),
            jobId: '',
            type,
            title,
            message,
            timestamp: Date.now(),
            read: false,
            persistent,
            actions
        }

        addNotification(notification)
    }

    /**
     * Add notification to system
     */
    const addNotification = (notification: JobNotification): void => {
        notifications.value.set(notification.id, notification)

        // Add to toast queue if toasts are enabled
        if (enableToasts.value) {
            toastQueue.value.push(notification)
            processToastQueue()
        }

        // Play notification sound
        if (enableSounds.value) {
            playNotificationSound(notification.type)
        }

        // Show browser notification
        if (enableBrowserNotifications.value) {
            showBrowserNotification(notification)
        }

        // Clean up old notifications (keep last 50)
        if (notifications.value.size > 50) {
            const sorted = Array.from(notifications.value.entries())
                .sort(([, a], [, b]) => b.timestamp - a.timestamp)

            notifications.value.clear()
            sorted.slice(0, 50).forEach(([id, notification]) => {
                notifications.value.set(id, notification)
            })
        }
    }

    /**
     * Process toast notification queue
     */
    const processToastQueue = (): void => {
        if (currentToast.value || toastQueue.value.length === 0) return

        const notification = toastQueue.value.shift()
        if (!notification) return

        currentToast.value = notification
        showToast.value = true

        // Auto-hide toast after duration
        setTimeout(() => {
            hideCurrentToast()
        }, toastDuration.value)
    }

    /**
     * Hide current toast and process next in queue
     */
    const hideCurrentToast = (): void => {
        showToast.value = false
        currentToast.value = null

        // Process next toast after animation
        setTimeout(() => {
            processToastQueue()
        }, 300)
    }

    /**
     * Mark notification as read
     */
    const markAsRead = (notificationId: string): void => {
        const notification = notifications.value.get(notificationId)
        if (notification) {
            notification.read = true
            notifications.value.set(notificationId, notification)
        }
    }

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = (): void => {
        for (const [id, notification] of notifications.value.entries()) {
            notification.read = true
            notifications.value.set(id, notification)
        }
    }

    /**
     * Remove notification
     */
    const removeNotification = (notificationId: string): void => {
        notifications.value.delete(notificationId)
    }

    /**
     * Clear all notifications
     */
    const clearAllNotifications = (): void => {
        notifications.value.clear()
        toastQueue.value = []
        currentToast.value = null
        showToast.value = false
    }

    /**
     * Clear read notifications
     */
    const clearReadNotifications = (): void => {
        for (const [id, notification] of notifications.value.entries()) {
            if (notification.read) {
                notifications.value.delete(id)
            }
        }
    }

    /**
     * Request browser notification permission
     */
    const requestNotificationPermission = async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn('Browser notifications not supported')
            return false
        }

        if (Notification.permission === 'granted') {
            enableBrowserNotifications.value = true
            return true
        }

        if (Notification.permission === 'denied') {
            return false
        }

        const permission = await Notification.requestPermission()
        const granted = permission === 'granted'
        enableBrowserNotifications.value = granted
        return granted
    }

    /**
     * Show browser notification
     */
    const showBrowserNotification = (notification: JobNotification): void => {
        if (!enableBrowserNotifications.value || Notification.permission !== 'granted') {
            return
        }

        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.jobId || 'system',
            requireInteraction: notification.persistent
        })

        browserNotification.onclick = () => {
            window.focus()
            markAsRead(notification.id)
            browserNotification.close()
        }

        // Auto-close after duration
        if (!notification.persistent) {
            setTimeout(() => {
                browserNotification.close()
            }, toastDuration.value)
        }
    }

    /**
     * Play notification sound
     */
    const playNotificationSound = (type: JobNotification['type']): void => {
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
     * Generate unique notification ID
     */
    const generateNotificationId = (): string => {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Get job type label
     */
    const getJobTypeLabel = (type: AsyncJob['type']): string => {
        switch (type) {
            case 'content_generation': return 'Content'
            case 'video_generation': return 'Video'
            default: return 'Job'
        }
    }

    /**
     * View job result (to be implemented by parent)
     */
    const viewJobResult = (job: AsyncJob): void => {
        // This will be handled by the parent component
        console.log('View job result:', job)
    }

    /**
     * Retry job (to be implemented by parent)
     */
    const retryJob = (job: AsyncJob): void => {
        // This will be handled by the parent component
        console.log('Retry job:', job)
    }

    return {
        // State
        notifications: computed(() => Array.from(notifications.value.values())),
        currentToast: computed(() => currentToast.value),
        showToast: computed(() => showToast.value),

        // Settings
        enableToasts,
        enableSounds,
        enableBrowserNotifications,
        toastDuration,

        // Computed properties
        unreadCount,
        recentNotifications,
        hasUnread,

        // Methods
        notifyJobCompletion,
        notifyJobProgress,
        notifySystem,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        clearReadNotifications,
        hideCurrentToast,
        requestNotificationPermission
    }
}