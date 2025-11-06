<template>
    <v-dialog :model-value="modelValue" max-width="800" scrollable persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card v-if="job">
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-briefcase-search</v-icon>
                Job Details - #{{ job.id }}
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-0">
                <v-container fluid class="pa-4">
                    <!-- Job Status and Basic Info -->
                    <v-row>
                        <v-col cols="12">
                            <div class="d-flex align-center mb-4">
                                <v-chip :color="getStatusColor(job.status)" variant="tonal" size="large" class="me-3">
                                    <v-icon start>{{ getStatusIcon(job.status) }}</v-icon>
                                    {{ job.status }}
                                </v-chip>

                                <v-chip :color="getContentTypeColor(job.contentType)" variant="outlined" size="large">
                                    <v-icon start>{{ getContentTypeIcon(job.contentType) }}</v-icon>
                                    {{ formatContentType(job.contentType) }}
                                </v-chip>
                            </div>
                        </v-col>
                    </v-row>

                    <!-- Job Information Cards -->
                    <v-row>
                        <!-- Basic Information -->
                        <v-col cols="12" md="6">
                            <v-card variant="outlined">
                                <v-card-title class="text-h6">
                                    <v-icon class="me-2">mdi-information</v-icon>
                                    Basic Information
                                </v-card-title>
                                <v-card-text>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Job ID:</span>
                                            <span class="info-value">#{{ job.id }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Created:</span>
                                            <span class="info-value">{{ formatDateTime(job.createdAt) }}</span>
                                        </div>
                                        <div v-if="job.completedAt" class="info-item">
                                            <span class="info-label">Completed:</span>
                                            <span class="info-value">{{ formatDateTime(job.completedAt) }}</span>
                                        </div>
                                        <div v-if="job.executionTimeMs" class="info-item">
                                            <span class="info-label">Duration:</span>
                                            <span class="info-value">{{ formatExecutionTime(job.executionTimeMs)
                                            }}</span>
                                        </div>
                                        <div v-if="job.retryCount > 0" class="info-item">
                                            <span class="info-label">Retries:</span>
                                            <span class="info-value">{{ job.retryCount }}</span>
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <!-- Job Parameters -->
                        <v-col cols="12" md="6">
                            <v-card variant="outlined">
                                <v-card-title class="text-h6">
                                    <v-icon class="me-2">mdi-cog</v-icon>
                                    Parameters
                                </v-card-title>
                                <v-card-text>
                                    <div v-if="jobParameters" class="info-grid">
                                        <div v-for="(value, key) in jobParameters" :key="key" class="info-item">
                                            <span class="info-label">{{ formatParameterKey(key) }}:</span>
                                            <span class="info-value">{{ value || '—' }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="text-medium-emphasis">
                                        No parameters available
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Error Message (if failed) -->
                    <v-row v-if="job.status === 'FAILED' && job.errorMessage">
                        <v-col cols="12">
                            <v-card variant="outlined" color="error">
                                <v-card-title class="text-h6">
                                    <v-icon class="me-2">mdi-alert-circle</v-icon>
                                    Error Details
                                </v-card-title>
                                <v-card-text>
                                    <v-alert type="error" variant="tonal" class="mb-0">
                                        {{ job.errorMessage }}
                                    </v-alert>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Execution Logs -->
                    <v-row v-if="job.executionLogs && job.executionLogs.length > 0">
                        <v-col cols="12">
                            <v-card variant="outlined">
                                <v-card-title class="text-h6">
                                    <v-icon class="me-2">mdi-text-box</v-icon>
                                    Execution Logs
                                </v-card-title>
                                <v-card-text>
                                    <v-code class="logs-container" style="max-height: 200px; overflow-y: auto;">
                                        <div v-for="(log, index) in job.executionLogs" :key="index" class="log-line">
                                            {{ log }}
                                        </div>
                                    </v-code>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Generated Content -->
                    <v-row v-if="job.result && job.status === 'COMPLETED'">
                        <v-col cols="12">
                            <v-card variant="outlined">
                                <v-card-title class="text-h6 d-flex align-center justify-space-between">
                                    <div>
                                        <v-icon class="me-2">mdi-file-document</v-icon>
                                        Generated Content
                                    </div>
                                    <div class="d-flex ga-2">
                                        <v-btn size="small" variant="outlined" prepend-icon="mdi-content-copy"
                                            @click="copyContent">
                                            Copy
                                        </v-btn>
                                        <v-menu>
                                            <template #activator="{ props: menuProps }">
                                                <v-btn size="small" variant="outlined" prepend-icon="mdi-download"
                                                    append-icon="mdi-chevron-down" v-bind="menuProps">
                                                    Download
                                                </v-btn>
                                            </template>
                                            <v-list>
                                                <v-list-item @click="downloadContent('txt')">
                                                    <v-list-item-title>
                                                        <v-icon class="me-2">mdi-file-document-outline</v-icon>
                                                        Text (.txt)
                                                    </v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click="downloadContent('json')">
                                                    <v-list-item-title>
                                                        <v-icon class="me-2">mdi-code-json</v-icon>
                                                        JSON (.json)
                                                    </v-list-item-title>
                                                </v-list-item>
                                                <v-list-item @click="downloadContent('pdf')" disabled>
                                                    <v-list-item-title>
                                                        <v-icon class="me-2">mdi-file-pdf-box</v-icon>
                                                        PDF (.pdf) - Coming Soon
                                                    </v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </div>
                                </v-card-title>
                                <v-card-text>
                                    <div class="content-display">
                                        <pre v-if="isJsonContent()"
                                            class="json-content"><code>{{ formatJsonContent() }}</code></pre>
                                        <v-textarea v-else :model-value="getContentText()" readonly variant="outlined"
                                            rows="10" class="content-textarea" />
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn variant="text" @click="$emit('close')">
                    Close
                </v-btn>

                <v-btn v-if="job.canRetry" color="warning" variant="tonal" prepend-icon="mdi-refresh"
                    @click="$emit('retry', job)">
                    Retry Job
                </v-btn>

                <v-btn v-if="job.canGenerateVideo" color="primary" variant="tonal" prepend-icon="mdi-video-plus"
                    @click="$emit('generate-video', job)">
                    Generate Video
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Loading State -->
        <v-card v-else-if="loading">
            <v-card-title>Loading Job Details...</v-card-title>
            <v-card-text>
                <v-skeleton-loader type="article" />
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JobDetails } from '@/types/content'

// Props
interface Props {
    modelValue: boolean
    job: JobDetails | null
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'close': []
    'download': [job: JobDetails, format: string]
    'retry': [job: JobDetails]
    'generate-video': [job: JobDetails]
}>()

// Computed properties
const jobParameters = computed(() => {
    if (!props.job?.parameters) return null

    try {
        return typeof props.job.parameters === 'string'
            ? JSON.parse(props.job.parameters)
            : props.job.parameters
    } catch {
        return null
    }
})

// Methods
const getContentText = () => {
    if (!props.job?.result) return ''

    if (typeof props.job.result === 'string') {
        return props.job.result
    }

    // Handle different result formats
    if (props.job.result.generatedContent) {
        return props.job.result.generatedContent
    }

    if (props.job.result.content) {
        return props.job.result.content
    }

    return JSON.stringify(props.job.result, null, 2)
}

const copyContent = async () => {
    const content = getContentText()
    if (content) {
        try {
            await navigator.clipboard.writeText(content)
            // Show success notification
            showSuccessNotification('Content copied to clipboard')
        } catch (error) {
            console.error('Failed to copy content:', error)
            showErrorNotification('Failed to copy content to clipboard')
        }
    }
}

const isJsonContent = () => {
    if (!props.job?.result) return false

    try {
        const content = getContentText()
        JSON.parse(content)
        return true
    } catch {
        return false
    }
}

const formatJsonContent = () => {
    if (!isJsonContent()) return ''

    try {
        const content = getContentText()
        return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
        return getContentText()
    }
}

const showSuccessNotification = (message: string) => {
    // This would typically use a toast/snackbar service
    console.log('Success:', message)
}

const showErrorNotification = (message: string) => {
    // This would typically use a toast/snackbar service
    console.error('Error:', message)
}

const downloadContent = (format: string) => {
    if (props.job) {
        emit('download', props.job, format)
    }
}

// Utility methods
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'success'
        case 'processing':
            return 'warning'
        case 'failed':
            return 'error'
        case 'pending':
            return 'info'
        case 'cancelled':
            return 'secondary'
        default:
            return 'primary'
    }
}

const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'mdi-check-circle'
        case 'processing':
            return 'mdi-loading'
        case 'failed':
            return 'mdi-alert-circle'
        case 'pending':
            return 'mdi-clock-outline'
        case 'cancelled':
            return 'mdi-cancel'
        default:
            return 'mdi-help-circle'
    }
}

const getContentTypeColor = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            return 'primary'
        case 'social_media':
            return 'secondary'
        case 'email':
            return 'info'
        case 'video_script':
            return 'warning'
        case 'product_description':
            return 'success'
        default:
            return 'primary'
    }
}

const getContentTypeIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            return 'mdi-post'
        case 'social_media':
            return 'mdi-share-variant'
        case 'email':
            return 'mdi-email'
        case 'video_script':
            return 'mdi-video'
        case 'product_description':
            return 'mdi-package-variant'
        default:
            return 'mdi-file-document'
    }
}

const formatContentType = (contentType: string) => {
    return contentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const formatDateTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatExecutionTime = (ms: number) => {
    if (!ms) return ''

    if (ms < 1000) {
        return `${ms}ms`
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`
    } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }
}

const formatParameterKey = (key: string | number) => {
    const keyStr = String(key)
    return keyStr.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ')
}
</script>

<style scoped>
.info-grid {
    display: grid;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-weight: 500;
    color: rgb(var(--v-theme-on-surface-variant));
    min-width: 100px;
    flex-shrink: 0;
}

.info-value {
    text-align: right;
    word-break: break-word;
}

.logs-container {
    background-color: rgb(var(--v-theme-surface-variant));
    border-radius: 4px;
    padding: 12px;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.4;
}

.log-line {
    margin-bottom: 4px;
}

.log-line:last-child {
    margin-bottom: 0;
}

.content-textarea :deep(.v-field__input) {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
}

/* Content display styling */
.content-display {
    position: relative;
}

.json-content {
    background-color: rgb(var(--v-theme-surface-variant));
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    padding: 16px;
    font-family: 'Roboto Mono', 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre;
    max-height: 400px;
    overflow-y: auto;
}

.json-content code {
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: rgb(var(--v-theme-on-surface));
}

/* Responsive adjustments */
@media (max-width: 959px) {
    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .info-label {
        min-width: auto;
    }

    .info-value {
        text-align: left;
    }
}
</style>