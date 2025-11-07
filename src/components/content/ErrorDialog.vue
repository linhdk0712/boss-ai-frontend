<template>
    <v-dialog v-model="modelValue" max-width="600" persistent :scrim="true">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon :color="getErrorColor(error?.code)" size="large" class="mr-3">
                    {{ getErrorIcon(error?.code) }}
                </v-icon>
                <div>
                    <h3 class="text-h6">{{ getErrorTitle(error?.code) }}</h3>
                    <p class="text-caption text-medium-emphasis mb-0">
                        {{ formatTimestamp(error?.timestamp) }}
                    </p>
                </div>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="handleClose" />
            </v-card-title>

            <v-divider />

            <v-card-text class="py-4">
                <!-- User-friendly message -->
                <div class="mb-4">
                    <p class="text-body-1">
                        {{ error?.userFriendlyMessage || 'An unexpected error occurred.' }}
                    </p>
                </div>

                <!-- Context information -->
                <div v-if="error?.context" class="mb-4">
                    <v-chip :color="getErrorColor(error?.code)" variant="tonal" size="small"
                        prepend-icon="mdi-information-outline">
                        {{ error.context }}
                    </v-chip>
                </div>

                <!-- Validation errors -->
                <div v-if="error?.details?.validationErrors" class="mb-4">
                    <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
                        <template #title>
                            Validation Errors
                        </template>
                        <ul class="mt-2">
                            <li v-for="(validationError, index) in error.details.validationErrors" :key="index"
                                class="text-body-2">
                                {{ validationError }}
                            </li>
                        </ul>
                    </v-alert>
                </div>

                <!-- Network status -->
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
                                {{ networkState.isOffline ? 'Offline' : 'Online' }}
                            </span>
                            <span v-if="networkState.lastOnline && networkState.isOffline"
                                class="text-caption text-medium-emphasis ml-2">
                                (Last online: {{ formatRelativeTime(networkState.lastOnline) }})
                            </span>
                        </div>
                    </v-alert>
                </div>

                <!-- Technical details (expandable) -->
                <v-expansion-panels v-if="showTechnicalDetails" variant="accordion" class="mb-4">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <template #default="{ expanded }">
                                <div class="d-flex align-center">
                                    <v-icon class="mr-2" size="small">
                                        mdi-code-braces
                                    </v-icon>
                                    Technical Details
                                    <v-spacer />
                                    <v-icon :class="expanded ? 'rotate-180' : ''">
                                        mdi-chevron-down
                                    </v-icon>
                                </div>
                            </template>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div class="technical-details">
                                <div class="mb-2">
                                    <strong>Error Code:</strong> {{ error?.code }}
                                </div>
                                <div class="mb-2">
                                    <strong>Message:</strong> {{ error?.message }}
                                </div>
                                <div v-if="error?.details" class="mb-2">
                                    <strong>Details:</strong>
                                    <pre class="text-caption mt-1 pa-2 bg-grey-lighten-4 rounded">{{ JSON.stringify(error.details, null,
                        2) }}</pre>
                                </div>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>

                <!-- Suggested actions -->
                <div v-if="getSuggestedActions(error?.code).length > 0" class="mb-4">
                    <h4 class="text-subtitle-2 mb-2">Suggested Actions:</h4>
                    <v-list density="compact" class="bg-grey-lighten-5 rounded">
                        <v-list-item v-for="(action, index) in getSuggestedActions(error?.code)" :key="index"
                            :prepend-icon="action.icon" class="text-body-2">
                            {{ action.text }}
                        </v-list-item>
                    </v-list>
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-btn v-if="error?.retryable" color="primary" variant="elevated" prepend-icon="mdi-refresh"
                    :loading="retryInProgress" @click="handleRetry">
                    Try Again
                </v-btn>

                <v-btn v-if="error?.code === 'UNAUTHORIZED'" color="primary" variant="elevated" prepend-icon="mdi-login"
                    @click="handleReauth">
                    Log In Again
                </v-btn>

                <v-btn variant="text" @click="handleClose">
                    Close
                </v-btn>

                <v-spacer />

                <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyErrorDetails">
                    Copy Details
                </v-btn>

                <v-btn variant="text" size="small" prepend-icon="mdi-code-braces"
                    @click="showTechnicalDetails = !showTechnicalDetails">
                    {{ showTechnicalDetails ? 'Hide' : 'Show' }} Technical
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ErrorDetails, NetworkErrorState } from '@/composables/useJobQueueErrorHandler'

interface Props {
    modelValue: boolean
    error: ErrorDetails | null
    networkState: NetworkErrorState
    retryInProgress: boolean
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'retry'): void
    (e: 'close'): void
    (e: 'reauth'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showTechnicalDetails = ref(false)

// Computed
const modelValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Methods
const getErrorColor = (code?: string): string => {
    switch (code) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
            return 'warning'
        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
            return 'error'
        case 'NOT_FOUND':
            return 'info'
        case 'SERVER_ERROR':
        case 'SERVICE_UNAVAILABLE':
            return 'error'
        default:
            return 'error'
    }
}

const getErrorIcon = (code?: string): string => {
    switch (code) {
        case 'NETWORK_ERROR':
            return 'mdi-wifi-off'
        case 'TIMEOUT_ERROR':
            return 'mdi-clock-alert'
        case 'UNAUTHORIZED':
            return 'mdi-account-lock'
        case 'FORBIDDEN':
            return 'mdi-shield-lock'
        case 'NOT_FOUND':
            return 'mdi-file-question'
        case 'SERVER_ERROR':
            return 'mdi-server-network-off'
        case 'SERVICE_UNAVAILABLE':
            return 'mdi-server-off'
        case 'VALIDATION_ERROR':
            return 'mdi-form-select'
        case 'RATE_LIMIT':
            return 'mdi-speedometer'
        default:
            return 'mdi-alert-circle'
    }
}

const getErrorTitle = (code?: string): string => {
    switch (code) {
        case 'NETWORK_ERROR':
            return 'Connection Problem'
        case 'TIMEOUT_ERROR':
            return 'Request Timeout'
        case 'UNAUTHORIZED':
            return 'Authentication Required'
        case 'FORBIDDEN':
            return 'Access Denied'
        case 'NOT_FOUND':
            return 'Not Found'
        case 'SERVER_ERROR':
            return 'Server Error'
        case 'SERVICE_UNAVAILABLE':
            return 'Service Unavailable'
        case 'VALIDATION_ERROR':
            return 'Validation Error'
        case 'RATE_LIMIT':
            return 'Rate Limit Exceeded'
        default:
            return 'Error Occurred'
    }
}

const getSuggestedActions = (code?: string) => {
    switch (code) {
        case 'NETWORK_ERROR':
            return [
                { icon: 'mdi-wifi', text: 'Check your internet connection' },
                { icon: 'mdi-refresh', text: 'Try refreshing the page' },
                { icon: 'mdi-router-wireless', text: 'Restart your router if needed' }
            ]
        case 'TIMEOUT_ERROR':
            return [
                { icon: 'mdi-refresh', text: 'Try the operation again' },
                { icon: 'mdi-wifi-strength-2', text: 'Check your connection speed' }
            ]
        case 'UNAUTHORIZED':
            return [
                { icon: 'mdi-login', text: 'Log in with your credentials' },
                { icon: 'mdi-refresh', text: 'Refresh the page after logging in' }
            ]
        case 'FORBIDDEN':
            return [
                { icon: 'mdi-account-supervisor', text: 'Contact your administrator for access' },
                { icon: 'mdi-account-switch', text: 'Try logging in with a different account' }
            ]
        case 'SERVER_ERROR':
            return [
                { icon: 'mdi-clock', text: 'Wait a few minutes and try again' },
                { icon: 'mdi-refresh', text: 'Refresh the page' },
                { icon: 'mdi-email', text: 'Contact support if the problem persists' }
            ]
        case 'RATE_LIMIT':
            return [
                { icon: 'mdi-clock', text: 'Wait a moment before trying again' },
                { icon: 'mdi-speedometer-slow', text: 'Reduce the frequency of your requests' }
            ]
        default:
            return [
                { icon: 'mdi-refresh', text: 'Try refreshing the page' },
                { icon: 'mdi-bug', text: 'Report this issue if it continues' }
            ]
    }
}

const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
}

const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
}

const copyErrorDetails = async () => {
    if (!props.error) return

    const details = {
        code: props.error.code,
        message: props.error.message,
        context: props.error.context,
        timestamp: new Date(props.error.timestamp).toISOString(),
        details: props.error.details
    }

    try {
        await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
        // Could show a toast notification here
    } catch (err) {
        // console.error('Failed to copy error details:', err)
    }
}

const handleRetry = () => {
    emit('retry')
}

const handleClose = () => {
    emit('close')
}

const handleReauth = () => {
    emit('reauth')
}
</script>

<style scoped>
.technical-details pre {
    font-size: 0.75rem;
    line-height: 1.2;
    max-height: 200px;
    overflow-y: auto;
}

.rotate-180 {
    transform: rotate(180deg);
    transition: transform 0.2s ease;
}
</style>