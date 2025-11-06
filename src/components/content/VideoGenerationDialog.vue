<template>
    <v-dialog :model-value="modelValue" max-width="600" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card v-if="job">
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2" color="primary">mdi-video-plus</v-icon>
                Generate Video from Content
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" :disabled="loading" @click="$emit('close')" />
            </v-card-title>

            <v-divider />

            <v-card-text>
                <!-- Job Information -->
                <div class="mb-4">
                    <h4 class="text-subtitle-1 mb-2">Source Job Information</h4>
                    <v-card variant="outlined" class="pa-3">
                        <div class="d-flex align-center mb-2">
                            <v-chip size="small" variant="outlined" color="primary" class="me-2">
                                #{{ job.id }}
                            </v-chip>
                            <v-chip :color="getContentTypeColor(job.contentType)" size="small" variant="tonal">
                                <v-icon start size="16">
                                    {{ getContentTypeIcon(job.contentType) }}
                                </v-icon>
                                {{ formatContentType(job.contentType) }}
                            </v-chip>
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                            Created: {{ formatDateTime(job.createdAt) }}
                        </div>
                    </v-card>
                </div>

                <!-- Content Preview -->
                <div class="mb-4">
                    <h4 class="text-subtitle-1 mb-2">Content Preview</h4>
                    <v-card variant="outlined" class="pa-3" max-height="200" style="overflow-y: auto;">
                        <div class="text-body-2" style="white-space: pre-wrap;">
                            {{ getContentPreview() }}
                        </div>
                    </v-card>
                </div>

                <!-- Video Generation Options -->
                <div class="mb-4">
                    <h4 class="text-subtitle-1 mb-2">Video Options</h4>
                    <v-card variant="outlined" class="pa-3">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="videoOptions.title" label="Video Title" variant="outlined"
                                    density="compact" :disabled="loading" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="videoOptions.style" :items="videoStyleOptions" label="Video Style"
                                    variant="outlined" density="compact" :disabled="loading" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="videoOptions.duration" :items="videoDurationOptions"
                                    label="Target Duration" variant="outlined" density="compact" :disabled="loading" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="videoOptions.voiceOver" :items="voiceOverOptions" label="Voice Over"
                                    variant="outlined" density="compact" :disabled="loading" />
                            </v-col>
                        </v-row>
                    </v-card>
                </div>

                <!-- Processing Information -->
                <v-alert type="info" variant="tonal" class="mb-4">
                    <v-alert-title>Video Generation Process</v-alert-title>
                    <ul class="mt-2">
                        <li>Video generation typically takes 3-10 minutes</li>
                        <li>You'll receive a notification when the video is ready</li>
                        <li>The video will be available in your content library</li>
                        <li>You can continue working while the video is being generated</li>
                    </ul>
                </v-alert>

                <!-- Warnings -->
                <v-alert v-if="getContentLength() > 5000" type="warning" variant="tonal" class="mb-4">
                    <v-alert-title>Long Content Detected</v-alert-title>
                    The content is quite long ({{ getContentLength() }} characters).
                    The video generation may take longer than usual or the content may be truncated.
                </v-alert>

                <!-- Cost Information -->
                <v-alert type="warning" variant="tonal" class="mb-4">
                    <v-alert-title>Processing Cost</v-alert-title>
                    Video generation consumes AI processing credits.
                    Please ensure you have sufficient credits before proceeding.
                </v-alert>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn variant="text" :disabled="loading" @click="$emit('close')">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="tonal" :loading="loading" :disabled="!isFormValid"
                    @click="handleGenerateVideo">
                    <v-icon start>mdi-video-plus</v-icon>
                    Generate Video
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Job } from '@/types/content'

// Props
interface Props {
    modelValue: boolean
    job: Job | null
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'close': []
    'video-started': [workflowRequest: any]
}>()

// Video options
const videoOptions = ref({
    title: '',
    style: 'professional',
    duration: 'auto',
    voiceOver: 'ai_generated'
})

// Options data
const videoStyleOptions = [
    { title: 'Professional', value: 'professional' },
    { title: 'Casual', value: 'casual' },
    { title: 'Educational', value: 'educational' },
    { title: 'Marketing', value: 'marketing' },
    { title: 'Storytelling', value: 'storytelling' }
]

const videoDurationOptions = [
    { title: 'Auto (Based on content)', value: 'auto' },
    { title: '30 seconds', value: '30s' },
    { title: '1 minute', value: '1m' },
    { title: '2 minutes', value: '2m' },
    { title: '5 minutes', value: '5m' }
]

const voiceOverOptions = [
    { title: 'AI Generated', value: 'ai_generated' },
    { title: 'Text Only', value: 'text_only' },
    { title: 'No Voice', value: 'none' }
]

// Computed properties
const isFormValid = computed(() => {
    return videoOptions.value.title.trim().length > 0 &&
        videoOptions.value.style &&
        videoOptions.value.duration &&
        videoOptions.value.voiceOver
})

// Methods
const handleGenerateVideo = () => {
    if (props.job && isFormValid.value) {
        // Prepare the content for video generation
        const content = getContentText()

        // Emit the video generation event with workflow request
        emit('video-started', {
            content,
            title: videoOptions.value.title,
            contentType: 'video',
            industry: props.job.contentType,
            language: 'en',
            tone: videoOptions.value.style,
            targetAudience: 'general',
            videoOptions: videoOptions.value
        })
    }
}

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

const getContentPreview = () => {
    if (!props.job?.result) {
        return 'No content available for preview.'
    }

    const content = typeof props.job.result === 'string'
        ? props.job.result
        : props.job.result.generatedContent || props.job.result.content || 'No content available'

    // Truncate content for preview
    return content.length > 500
        ? content.substring(0, 500) + '...'
        : content
}

const getContentLength = () => {
    if (!props.job?.result) return 0

    const content = typeof props.job.result === 'string'
        ? props.job.result
        : props.job.result.generatedContent || props.job.result.content || ''

    return content.length
}

// Utility methods
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

// Watch for job changes to update video title
watch(() => props.job, (newJob) => {
    if (newJob) {
        videoOptions.value.title = `Video from Job #${newJob.id}` || 'Generated Video'
    }
}, { immediate: true })

// Reset form when dialog closes
watch(() => props.modelValue, (isOpen) => {
    if (!isOpen) {
        // Reset form after a delay to avoid visual glitches
        setTimeout(() => {
            videoOptions.value = {
                title: '',
                style: 'professional',
                duration: 'auto',
                voiceOver: 'ai_generated'
            }
        }, 300)
    }
})
</script>

<style scoped>
/* Alert list styling */
:deep(.v-alert ul) {
    margin: 0;
    padding-left: 1.2rem;
}

:deep(.v-alert li) {
    margin-bottom: 0.25rem;
}

:deep(.v-alert li:last-child) {
    margin-bottom: 0;
}

/* Content preview styling */
.content-preview {
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* Form styling */
:deep(.v-text-field .v-field__input) {
    min-height: 40px;
}

:deep(.v-select .v-field__input) {
    min-height: 40px;
}

/* Card styling */
:deep(.v-card--variant-outlined) {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>