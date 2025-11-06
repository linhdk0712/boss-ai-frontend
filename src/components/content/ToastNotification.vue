<template>
    <v-snackbar v-model="showToast" :color="getToastColor()" :location="location" :timeout="-1"
        :multi-line="isMultiLine" :vertical="hasActions" :max-width="maxWidth" class="toast-notification"
        @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div class="toast-content">
            <!-- Icon and content -->
            <div class="d-flex align-start">
                <v-icon v-if="toast?.icon" :color="getIconColor()" size="small" class="mr-3 mt-1 flex-shrink-0">
                    {{ toast.icon }}
                </v-icon>

                <div class="flex-grow-1">
                    <!-- Title -->
                    <div class="toast-title text-body-1 font-weight-medium">
                        {{ toast?.title }}
                    </div>

                    <!-- Message -->
                    <div v-if="toast?.message" class="toast-message text-body-2 mt-1">
                        {{ toast.message }}
                    </div>

                    <!-- Actions -->
                    <div v-if="hasActions" class="toast-actions mt-3">
                        <v-btn v-for="(action, index) in toast?.actions" :key="index" :color="action.color || 'white'"
                            :variant="action.variant || 'text'" :prepend-icon="action.icon" size="small" class="mr-2"
                            @click="handleActionClick(action)">
                            {{ action.label }}
                        </v-btn>
                    </div>
                </div>

                <!-- Close button -->
                <v-btn icon="mdi-close" variant="text" size="small" color="white" class="ml-2 flex-shrink-0"
                    @click="handleClose" />
            </div>

            <!-- Progress bar -->
            <div v-if="showProgress && !toast?.persistent" class="toast-progress mt-3">
                <v-progress-linear :model-value="progress" color="white" bg-color="rgba(255, 255, 255, 0.3)" height="2"
                    rounded />
            </div>
        </div>

        <!-- Queue indicator -->
        <div v-if="queueLength > 0" class="queue-indicator">
            <v-chip size="x-small" color="white" variant="outlined" class="queue-chip">
                +{{ queueLength }}
            </v-chip>
        </div>
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ToastNotification, ToastAction } from '@/composables/useToastNotifications'

interface Props {
    modelValue: boolean
    toast: ToastNotification | null
    progress?: number
    queueLength?: number
    location?: string
    maxWidth?: string | number
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
    (e: 'action', action: ToastAction): void
    (e: 'pause'): void
    (e: 'resume'): void
}

const props = withDefaults(defineProps<Props>(), {
    progress: 0,
    queueLength: 0,
    location: 'top',
    maxWidth: 400
})

const emit = defineEmits<Emits>()

// Computed
const showToast = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const hasActions = computed(() => {
    return props.toast?.actions && props.toast.actions.length > 0
})

const isMultiLine = computed(() => {
    const messageLength = (props.toast?.message || '').length
    const titleLength = (props.toast?.title || '').length
    return messageLength > 50 || titleLength > 30 || hasActions.value
})

const showProgress = computed(() => {
    return props.toast?.showProgress && !props.toast?.persistent
})

// Methods
const getToastColor = (): string => {
    switch (props.toast?.type) {
        case 'success':
            return 'success'
        case 'error':
            return 'error'
        case 'warning':
            return 'warning'
        case 'info':
            return 'info'
        default:
            return 'primary'
    }
}

const getIconColor = (): string => {
    // Icons are always white on colored backgrounds
    return 'white'
}

const handleClose = () => {
    emit('close')
}

const handleActionClick = (action: ToastAction) => {
    action.action()
    emit('action', action)
}

const handleMouseEnter = () => {
    if (!props.toast?.persistent) {
        emit('pause')
    }
}

const handleMouseLeave = () => {
    if (!props.toast?.persistent) {
        emit('resume')
    }
}
</script>

<style scoped>
.toast-notification {
    position: relative;
}

.toast-content {
    width: 100%;
}

.toast-title {
    line-height: 1.2;
}

.toast-message {
    line-height: 1.3;
    opacity: 0.9;
}

.toast-actions {
    margin-left: -8px;
    /* Align with text */
}

.toast-progress {
    margin-left: -16px;
    margin-right: -16px;
    margin-bottom: -8px;
}

.queue-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 1;
}

.queue-chip {
    font-size: 0.6rem;
    height: 16px;
    min-width: 24px;
}

/* Custom snackbar styling */
:deep(.v-snackbar__wrapper) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
}

:deep(.v-snackbar__content) {
    padding: 16px;
}

/* Animation improvements */
.toast-notification {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-notification:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Responsive adjustments */
@media (max-width: 600px) {
    :deep(.v-snackbar__wrapper) {
        margin: 8px;
        max-width: calc(100vw - 16px);
    }
}
</style>