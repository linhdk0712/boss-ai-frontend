<template>
    <v-snackbar v-model="show" :color="notificationColor" :timeout="timeout" location="top right" variant="elevated"
        class="job-notification-toast" @click:outside="handleClose">
        <div class="notification-content">
            <div class="d-flex align-center">
                <v-icon :icon="notificationIcon" :color="iconColor" size="20" class="me-3" />

                <div class="flex-grow-1">
                    <div class="notification-title text-body-2 font-weight-medium">
                        {{ notification?.title }}
                    </div>
                    <div class="notification-message text-caption">
                        {{ notification?.message }}
                    </div>
                </div>

                <v-btn icon="mdi-close" size="small" variant="text" @click="handleClose" />
            </div>

            <!-- Actions -->
            <div v-if="notification?.actions && notification.actions.length > 0" class="notification-actions mt-2">
                <v-btn v-for="action in notification.actions" :key="action.label" :color="action.color || 'primary'"
                    size="small" variant="text" @click="handleAction(action)">
                    {{ action.label }}
                </v-btn>
            </div>
        </div>

        <!-- Progress indicator for persistent notifications -->
        <div v-if="showProgress" class="notification-progress">
            <v-progress-linear :model-value="progressValue" color="white" height="2" class="mt-2" />
        </div>
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed, watch, ref, onUnmounted } from 'vue'
import type { JobNotification, NotificationAction } from '@/composables/useJobNotifications'

interface Props {
    notification: JobNotification | null
    show: boolean
    timeout?: number
}

const props = withDefaults(defineProps<Props>(), {
    timeout: 5000
})

const emit = defineEmits<{
    'update:show': [value: boolean]
    close: []
}>()

// Local state
const progressValue = ref(0)
const progressInterval = ref<NodeJS.Timeout | null>(null)

// Computed properties
const notificationColor = computed(() => {
    if (!props.notification) return 'info'

    switch (props.notification.type) {
        case 'success': return 'success'
        case 'error': return 'error'
        case 'warning': return 'warning'
        case 'info': return 'info'
        default: return 'info'
    }
})

const notificationIcon = computed(() => {
    if (!props.notification) return 'mdi-information'

    switch (props.notification.type) {
        case 'success': return 'mdi-check-circle'
        case 'error': return 'mdi-alert-circle'
        case 'warning': return 'mdi-alert'
        case 'info': return 'mdi-information'
        default: return 'mdi-information'
    }
})

const iconColor = computed(() => {
    return 'white'
})

const showProgress = computed(() => {
    return props.timeout > 0 && !props.notification?.persistent
})

// Methods
const handleClose = (): void => {
    emit('update:show', false)
    emit('close')
    clearProgress()
}

const handleAction = (action: NotificationAction): void => {
    action.action()
    handleClose()
}

const startProgress = (): void => {
    if (!showProgress.value) return

    progressValue.value = 0
    const interval = 50 // Update every 50ms
    const increment = (interval / props.timeout) * 100

    progressInterval.value = setInterval(() => {
        progressValue.value += increment

        if (progressValue.value >= 100) {
            clearProgress()
        }
    }, interval)
}

const clearProgress = (): void => {
    if (progressInterval.value) {
        clearInterval(progressInterval.value)
        progressInterval.value = null
    }
    progressValue.value = 0
}

// Watch for show changes to start/stop progress
watch(() => props.show, (newShow) => {
    if (newShow) {
        startProgress()
    } else {
        clearProgress()
    }
})

// Cleanup on unmount
onUnmounted(() => {
    clearProgress()
})
</script>

<style scoped>
.job-notification-toast {
    z-index: 9999;
}

:deep(.v-snackbar__wrapper) {
    min-width: 350px;
    max-width: 500px;
}

:deep(.v-snackbar__content) {
    padding: 16px;
}

.notification-content {
    width: 100%;
}

.notification-title {
    line-height: 1.2;
    margin-bottom: 2px;
}

.notification-message {
    line-height: 1.3;
    opacity: 0.9;
}

.notification-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.notification-progress {
    margin: 0 -16px -16px -16px;
}

/* Animation for toast appearance */
:deep(.v-snackbar--active) {
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Different colors for notification types */
:deep(.v-snackbar--variant-elevated.bg-success) {
    background-color: rgb(var(--v-theme-success)) !important;
    color: rgb(var(--v-theme-on-success)) !important;
}

:deep(.v-snackbar--variant-elevated.bg-error) {
    background-color: rgb(var(--v-theme-error)) !important;
    color: rgb(var(--v-theme-on-error)) !important;
}

:deep(.v-snackbar--variant-elevated.bg-warning) {
    background-color: rgb(var(--v-theme-warning)) !important;
    color: rgb(var(--v-theme-on-warning)) !important;
}

:deep(.v-snackbar--variant-elevated.bg-info) {
    background-color: rgb(var(--v-theme-info)) !important;
    color: rgb(var(--v-theme-on-info)) !important;
}
</style>