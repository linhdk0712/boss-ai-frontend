<template>
    <div class="job-actions">
        <v-menu location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" :loading="loading"
                    :disabled="loading" />
            </template>

            <v-card min-width="200">
                <v-list density="compact">
                    <!-- View Details Action -->
                    <v-list-item prepend-icon="mdi-eye" title="View Details" subtitle="See job information"
                        @click="handleViewDetails" />

                    <v-divider />

                    <!-- Retry Action -->
                    <v-list-item v-if="job.canRetry" prepend-icon="mdi-refresh" title="Retry Job"
                        subtitle="Create new job with same parameters" :disabled="!job.canRetry || loading"
                        @click="showRetryDialog = true" />

                    <!-- Generate Video Action -->
                    <v-list-item v-if="job.canGenerateVideo" prepend-icon="mdi-video-plus" title="Generate Video"
                        subtitle="Create video from content" :disabled="!job.canGenerateVideo || loading"
                        @click="showVideoDialog = true" />

                    <!-- Download Action -->
                    <v-list-item v-if="job.status === 'COMPLETED' && job.result" prepend-icon="mdi-download"
                        title="Download Content" subtitle="Save content to file" @click="handleDownload" />

                    <!-- Disabled Actions Info -->
                    <template v-if="!job.canRetry && !job.canGenerateVideo">
                        <v-divider />
                        <v-list-item disabled>
                            <template #prepend>
                                <v-icon color="medium-emphasis">mdi-information</v-icon>
                            </template>
                            <v-list-item-title class="text-caption text-medium-emphasis">
                                {{ getDisabledReason() }}
                            </v-list-item-title>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card>
        </v-menu>

        <!-- Retry Confirmation Dialog -->
        <v-dialog v-model="showRetryDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon class="me-2" color="warning">mdi-refresh</v-icon>
                    Retry Job
                </v-card-title>

                <v-card-text>
                    <v-alert type="info" variant="tonal" class="mb-4">
                        <v-alert-title>Job Retry Information</v-alert-title>
                        This will create a new job with the same parameters as the original job.
                    </v-alert>

                    <div class="mb-4">
                        <h4 class="text-subtitle-1 mb-2">Job Details:</h4>
                        <div class="text-body-2">
                            <div><strong>Job ID:</strong> #{{ job.id }}</div>
                            <div><strong>Content Type:</strong> {{ formatContentType(job.contentType) }}</div>
                            <div><strong>Current Status:</strong>
                                <v-chip :color="getStatusColor(job.status)" size="small" variant="tonal" class="ml-1">
                                    {{ job.status }}
                                </v-chip>
                            </div>
                            <div v-if="job.retryCount > 0">
                                <strong>Previous Retries:</strong> {{ job.retryCount }}
                            </div>
                        </div>
                    </div>

                    <v-alert v-if="job.retryCount >= 3" type="warning" variant="tonal" class="mb-4">
                        <v-alert-title>Multiple Retries Detected</v-alert-title>
                        This job has been retried {{ job.retryCount }} times. Consider reviewing the job parameters or
                        contacting support if the issue persists.
                    </v-alert>

                    <p class="text-body-2 text-medium-emphasis">
                        Are you sure you want to retry this job? A new job will be created and added to the queue.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showRetryDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="warning" variant="tonal" :loading="retryLoading" @click="handleRetry">
                        <v-icon start>mdi-refresh</v-icon>
                        Retry Job
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Video Generation Confirmation Dialog -->
        <v-dialog v-model="showVideoDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="d-flex align-center">
                    <v-icon class="me-2" color="primary">mdi-video-plus</v-icon>
                    Generate Video
                </v-card-title>

                <v-card-text>
                    <v-alert type="info" variant="tonal" class="mb-4">
                        <v-alert-title>Video Generation</v-alert-title>
                        This will create a video from the generated content using AI video processing.
                    </v-alert>

                    <div class="mb-4">
                        <h4 class="text-subtitle-1 mb-2">Content Preview:</h4>
                        <v-card variant="outlined" class="pa-3" max-height="200" style="overflow-y: auto;">
                            <div class="text-body-2">
                                {{ getContentPreview() }}
                            </div>
                        </v-card>
                    </div>

                    <v-alert type="warning" variant="tonal" class="mb-4">
                        <v-alert-title>Processing Time</v-alert-title>
                        Video generation may take several minutes to complete. You'll be notified when it's ready.
                    </v-alert>

                    <p class="text-body-2 text-medium-emphasis">
                        Are you sure you want to generate a video from this content?
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showVideoDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="primary" variant="tonal" :loading="videoLoading" @click="handleGenerateVideo">
                        <v-icon start>mdi-video-plus</v-icon>
                        Generate Video
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Job } from '@/types/content'

// Props
interface Props {
    job: Job
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
const emit = defineEmits<{
    'retry': [job: Job]
    'generate-video': [job: Job]
    'view-details': [job: Job]
    'download': [job: Job]
}>()

// Local state
const showRetryDialog = ref(false)
const showVideoDialog = ref(false)
const retryLoading = ref(false)
const videoLoading = ref(false)

// Methods
const handleViewDetails = () => {
    emit('view-details', props.job)
}

const handleRetry = async () => {
    try {
        retryLoading.value = true
        emit('retry', props.job)
        showRetryDialog.value = false
    } finally {
        retryLoading.value = false
    }
}

const handleGenerateVideo = async () => {
    try {
        videoLoading.value = true
        emit('generate-video', props.job)
        showVideoDialog.value = false
    } finally {
        videoLoading.value = false
    }
}

const handleDownload = () => {
    emit('download', props.job)
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

const formatContentType = (contentType: string) => {
    return contentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

const getContentPreview = () => {
    if (!props.job.result) {
        return 'No content available for preview.'
    }

    const content = typeof props.job.result === 'string'
        ? props.job.result
        : props.job.result.generatedContent || props.job.result.content || 'No content available'

    // Truncate content for preview
    return content.length > 300
        ? content.substring(0, 300) + '...'
        : content
}

const getDisabledReason = () => {
    if (props.job.status === 'PROCESSING') {
        return 'Job is currently processing'
    } else if (props.job.status === 'PENDING') {
        return 'Job is pending execution'
    } else if (props.job.status === 'CANCELLED') {
        return 'Cancelled jobs cannot be retried'
    } else if (!props.job.result) {
        return 'No content available for video generation'
    }
    return 'No actions available for this job'
}
</script>

<style scoped>
.job-actions {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Dialog content styling */
:deep(.v-card-text) {
    padding-bottom: 16px;
}

:deep(.v-alert-title) {
    font-weight: 600;
    margin-bottom: 4px;
}

/* Content preview card styling */
:deep(.v-card--variant-outlined) {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* List item styling */
:deep(.v-list-item) {
    padding-inline: 16px;
}

:deep(.v-list-item__prepend) {
    margin-inline-end: 12px;
}

:deep(.v-list-item-subtitle) {
    opacity: 0.7;
    font-size: 0.75rem;
}

/* Menu card styling */
:deep(.v-menu > .v-overlay__content) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>