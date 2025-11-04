<template>
    <div class="job-queue-item pa-3 border-b">
        <div class="d-flex align-center mb-2">
            <!-- Job Type Icon -->
            <v-icon :color="jobTypeColor" :icon="jobTypeIcon" size="16" class="me-2" />

            <!-- Job Title -->
            <span class="text-body-2 font-weight-medium flex-grow-1">
                {{ jobTitle }}
            </span>

            <!-- Status Badge -->
            <v-chip :color="statusColor" :icon="statusIcon" size="x-small" variant="tonal">
                {{ statusText }}
            </v-chip>
        </div>

        <!-- Progress Bar (for active jobs) -->
        <div v-if="isActive" class="mb-2">
            <v-progress-linear :model-value="job.progress" :color="progressColor" height="4" rounded
                :indeterminate="job.status === 'queued'" />
            <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                <span>{{ job.message }}</span>
                <span v-if="job.status === 'processing'">{{ job.progress }}%</span>
            </div>
        </div>

        <!-- Job Details -->
        <div class="job-details text-caption text-medium-emphasis">
            <div class="d-flex align-center mb-1">
                <v-icon icon="mdi-clock-outline" size="12" class="me-1" />
                <span>{{ formatTime(job.startedAt) }}</span>
                <span v-if="job.completedAt" class="mx-1">•</span>
                <span v-if="job.completedAt">
                    Duration: {{ formatDuration(job.startedAt, job.completedAt) }}
                </span>
                <span v-else-if="job.estimatedDuration && job.status === 'processing'" class="mx-1">
                    • ETA: {{ formatETA(job.startedAt, job.estimatedDuration, job.progress) }}
                </span>
            </div>

            <!-- Request Details -->
            <div class="request-details">
                <span v-if="contentRequest">
                    {{ contentRequest.contentType }}
                    <span v-if="contentRequest.language" class="mx-1">• {{ contentRequest.language }}</span>
                    <span v-if="contentRequest.industry" class="mx-1">• {{ contentRequest.industry }}</span>
                </span>
                <span v-else-if="workflowRequest">
                    Video: {{ workflowRequest.contentType }}
                    <span v-if="workflowRequest.language" class="mx-1">• {{ workflowRequest.language }}</span>
                </span>
            </div>
        </div>

        <!-- Error Message -->
        <div v-if="job.status === 'failed' && job.error" class="error-message mt-2">
            <v-alert type="error" variant="tonal" density="compact" class="text-caption">
                {{ job.error }}
            </v-alert>
        </div>

        <!-- Action Buttons -->
        <div v-if="showActions" class="actions mt-2 d-flex gap-2">
            <v-btn v-if="job.status === 'processing' || job.status === 'queued'" size="x-small" variant="text"
                color="error" @click="$emit('cancel')">
                Cancel
            </v-btn>

            <v-btn v-if="job.status === 'failed'" size="x-small" variant="text" color="primary" @click="$emit('retry')">
                Retry
            </v-btn>

            <v-btn v-if="job.status === 'completed' && job.result" size="x-small" variant="text" color="success"
                @click="viewResult">
                View
            </v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AsyncJob } from '@/composables/useAsyncContentGeneration'
import type { ContentGenerateRequest, ContentWorkflowRequest } from '@/types/content'

interface Props {
    job: AsyncJob
}

const props = defineProps<Props>()

const emit = defineEmits<{
    cancel: []
    retry: []
    'view-result': [result: any]
}>()

// Computed properties
const isActive = computed(() =>
    props.job.status === 'queued' || props.job.status === 'processing'
)

const showActions = computed(() =>
    props.job.status !== 'completed' || props.job.result
)

const jobTitle = computed(() => {
    if (props.job.type === 'content_generation') {
        const request = props.job.request as ContentGenerateRequest
        return request.title || 'Content Generation'
    } else if (props.job.type === 'video_generation') {
        const request = props.job.request as ContentWorkflowRequest
        return request.title || 'Video Generation'
    }
    return 'Unknown Job'
})

const jobTypeColor = computed(() => {
    return props.job.type === 'content_generation' ? 'primary' : 'secondary'
})

const jobTypeIcon = computed(() => {
    return props.job.type === 'content_generation' ? 'mdi-text' : 'mdi-video'
})

const statusColor = computed(() => {
    switch (props.job.status) {
        case 'queued': return 'info'
        case 'processing': return 'warning'
        case 'completed': return 'success'
        case 'failed': return 'error'
        default: return 'default'
    }
})

const statusIcon = computed(() => {
    switch (props.job.status) {
        case 'queued': return 'mdi-clock-outline'
        case 'processing': return 'mdi-cog'
        case 'completed': return 'mdi-check'
        case 'failed': return 'mdi-alert'
        default: return 'mdi-help'
    }
})

const statusText = computed(() => {
    switch (props.job.status) {
        case 'queued': return 'Queued'
        case 'processing': return 'Processing'
        case 'completed': return 'Completed'
        case 'failed': return 'Failed'
        default: return 'Unknown'
    }
})

const progressColor = computed(() => {
    switch (props.job.status) {
        case 'queued': return 'info'
        case 'processing': return 'primary'
        default: return 'primary'
    }
})

const contentRequest = computed(() => {
    return props.job.type === 'content_generation'
        ? props.job.request as ContentGenerateRequest
        : null
})

const workflowRequest = computed(() => {
    return props.job.type === 'video_generation'
        ? props.job.request as ContentWorkflowRequest
        : null
})

// Methods
const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp

    if (diff < 60000) { // Less than 1 minute
        return 'Just now'
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000)
        return `${minutes}m ago`
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000)
        return `${hours}h ago`
    } else {
        return date.toLocaleDateString()
    }
}

const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime
    const seconds = Math.floor(duration / 1000)

    if (seconds < 60) {
        return `${seconds}s`
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    } else {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
}

const formatETA = (startTime: number, estimatedDuration: number, progress: number): string => {
    if (progress <= 0) return 'Calculating...'

    const elapsed = Date.now() - startTime
    const totalEstimated = (elapsed / progress) * 100
    const remaining = Math.max(0, totalEstimated - elapsed)

    const seconds = Math.floor(remaining / 1000)

    if (seconds < 60) {
        return `${seconds}s`
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        return `${minutes}m`
    } else {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
}

const viewResult = (): void => {
    if (props.job.result) {
        emit('view-result', props.job.result)
    }
}
</script>

<style scoped>
.job-queue-item {
    transition: background-color 0.2s ease;
}

.job-queue-item:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.border-b {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-b:last-child {
    border-bottom: none;
}

.job-details {
    line-height: 1.3;
}

.request-details {
    opacity: 0.8;
}

.actions {
    margin-top: 8px;
}

.error-message :deep(.v-alert) {
    font-size: 0.75rem;
}

/* Progress bar animation */
.v-progress-linear {
    transition: all 0.3s ease;
}
</style>