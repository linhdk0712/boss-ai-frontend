<template>
    <v-dialog v-model="modelValue" max-width="500" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon color="warning" size="large" class="mr-3">
                    mdi-refresh-circle
                </v-icon>
                <div>
                    <h3 class="text-h6">Retry Operation</h3>
                    <p class="text-caption text-medium-emphasis mb-0">
                        {{ error?.context || 'Operation failed' }}
                    </p>
                </div>
            </v-card-title>

            <v-divider />

            <v-card-text class="py-4">
                <!-- Error summary -->
                <div class="mb-4">
                    <v-alert :type="getAlertType(error?.code)" variant="tonal" density="compact">
                        <template #title>
                            {{ getErrorTitle(error?.code) }}
                        </template>
                        {{ error?.userFriendlyMessage }}
                    </v-alert>
                </div>

                <!-- Retry configuration -->
                <div class="mb-4">
                    <h4 class="text-subtitle-2 mb-3">Retry Settings</h4>

                    <v-row>
                        <v-col cols="6">
                            <v-text-field v-model.number="localRetryConfig.maxAttempts" label="Max Attempts"
                                type="number" min="1" max="10" density="compact" variant="outlined" hide-details />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model.number="localRetryConfig.baseDelay" label="Initial Delay (ms)"
                                type="number" min="100" max="10000" step="100" density="compact" variant="outlined"
                                hide-details />
                        </v-col>
                    </v-row>

                    <div class="mt-3">
                        <v-switch v-model="useExponentialBackoff" label="Use exponential backoff" color="primary"
                            density="compact" hide-details />
                    </div>
                </div>

                <!-- Retry preview -->
                <div class="mb-4">
                    <h4 class="text-subtitle-2 mb-2">Retry Schedule</h4>
                    <v-list density="compact" class="bg-grey-lighten-5 rounded">
                        <v-list-item v-for="(delay, index) in getRetrySchedule()" :key="index" class="text-body-2">
                            <template #prepend>
                                <v-icon size="small" class="mr-2">
                                    mdi-numeric-{{ index + 1 }}-circle
                                </v-icon>
                            </template>
                            <div>
                                Attempt {{ index + 1 }}
                                <span v-if="index > 0" class="text-caption text-medium-emphasis">
                                    (after {{ formatDelay(delay) }})
                                </span>
                            </div>
                        </v-list-item>
                    </v-list>
                </div>

                <!-- Network status (if relevant) -->
                <div v-if="error?.code === 'NETWORK_ERROR'" class="mb-4">
                    <v-alert :type="networkState.isOffline ? 'error' : 'success'" variant="tonal" density="compact">
                        <template #title>
                            Network Status
                        </template>
                        <div class="d-flex align-center mt-2">
                            <v-icon :color="networkState.isOffline ? 'error' : 'success'" size="small" class="mr-2">
                                {{ networkState.isOffline ? 'mdi-wifi-off' : 'mdi-wifi' }}
                            </v-icon>
                            <span class="text-body-2">
                                {{ networkState.isOffline ? 'Currently offline' : 'Connection restored' }}
                            </span>
                        </div>
                        <div v-if="networkState.isOffline" class="mt-2 text-caption">
                            Retrying will wait for connection to be restored.
                        </div>
                    </v-alert>
                </div>

                <!-- Progress indicator (when retrying) -->
                <div v-if="retryInProgress" class="mb-4">
                    <v-alert type="info" variant="tonal" density="compact">
                        <template #title>
                            Retrying Operation
                        </template>
                        <div class="d-flex align-center mt-2">
                            <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
                            <span class="text-body-2">
                                Attempt {{ currentAttempt }} of {{ localRetryConfig.maxAttempts }}
                            </span>
                        </div>
                        <div v-if="nextRetryIn > 0" class="mt-2 text-caption">
                            Next retry in {{ Math.ceil(nextRetryIn / 1000) }} seconds...
                        </div>
                    </v-alert>
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-btn color="primary" variant="elevated" prepend-icon="mdi-refresh" :loading="retryInProgress"
                    :disabled="networkState.isOffline && error?.code === 'NETWORK_ERROR'" @click="handleRetry">
                    {{ retryInProgress ? 'Retrying...' : 'Retry Now' }}
                </v-btn>

                <v-btn variant="text" :disabled="retryInProgress" @click="handleCancel">
                    Cancel
                </v-btn>

                <v-spacer />

                <v-btn v-if="retryInProgress" variant="text" color="error" prepend-icon="mdi-stop" @click="handleStop">
                    Stop Retry
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { ErrorDetails, NetworkErrorState, RetryConfig } from '@/composables/useJobQueueErrorHandler'

interface Props {
    modelValue: boolean
    error: ErrorDetails | null
    networkState: NetworkErrorState
    retryInProgress: boolean
    retryConfig: RetryConfig
    currentAttempt?: number
    nextRetryIn?: number
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'retry', config: RetryConfig): void
    (e: 'cancel'): void
    (e: 'stop'): void
}

const props = withDefaults(defineProps<Props>(), {
    currentAttempt: 0,
    nextRetryIn: 0
})

const emit = defineEmits<Emits>()

// Local state
const useExponentialBackoff = ref(true)
const localRetryConfig = reactive<RetryConfig>({
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
})

// Computed
const modelValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Watch for prop changes
watch(() => props.retryConfig, (newConfig) => {
    Object.assign(localRetryConfig, newConfig)
}, { immediate: true })

// Methods
const getAlertType = (code?: string): 'error' | 'warning' | 'info' => {
    switch (code) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
            return 'warning'
        case 'SERVER_ERROR':
        case 'SERVICE_UNAVAILABLE':
            return 'error'
        default:
            return 'info'
    }
}

const getErrorTitle = (code?: string): string => {
    switch (code) {
        case 'NETWORK_ERROR':
            return 'Network Connection Lost'
        case 'TIMEOUT_ERROR':
            return 'Request Timed Out'
        case 'SERVER_ERROR':
            return 'Server Error'
        case 'SERVICE_UNAVAILABLE':
            return 'Service Unavailable'
        case 'RATE_LIMIT':
            return 'Rate Limit Exceeded'
        default:
            return 'Operation Failed'
    }
}

const getRetrySchedule = (): number[] => {
    const schedule: number[] = [0] // First attempt has no delay

    for (let i = 1; i < localRetryConfig.maxAttempts; i++) {
        let delay = localRetryConfig.baseDelay

        if (useExponentialBackoff.value) {
            delay = Math.min(
                localRetryConfig.baseDelay * Math.pow(localRetryConfig.backoffMultiplier, i - 1),
                localRetryConfig.maxDelay
            )
        }

        schedule.push(delay)
    }

    return schedule
}

const formatDelay = (delay: number): string => {
    if (delay < 1000) {
        return `${delay}ms`
    }

    const seconds = delay / 1000
    if (seconds < 60) {
        return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`
}

const handleRetry = () => {
    const config = {
        ...localRetryConfig,
        backoffMultiplier: useExponentialBackoff.value ? localRetryConfig.backoffMultiplier : 1
    }
    emit('retry', config)
}

const handleCancel = () => {
    emit('cancel')
}

const handleStop = () => {
    emit('stop')
}
</script>

<style scoped>
.v-list-item {
    min-height: 32px;
}
</style>