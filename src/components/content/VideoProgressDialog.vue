<template>
    <v-dialog :model-value="modelValue" max-width="500" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2" color="primary">mdi-video-plus</v-icon>
                Video Generation in Progress
                <v-spacer />
                <v-chip v-if="isTracking" color="success" size="small" variant="tonal">
                    <v-icon start size="small">mdi-pulse</v-icon>
                    Live
                </v-chip>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <!-- Progress Information -->
                <div class="text-center mb-4">
                    <v-progress-circular :model-value="progress" :size="80" :width="8" color="primary" class="mb-4">
                        {{ Math.round(progress) }}%
                    </v-progress-circular>

                    <h4 class="text-h6 mb-2">{{ getProgressMessage() }}</h4>
                    <p class="text-body-2 text-medium-emphasis">
                        {{ getProgressDescription() }}
                    </p>
                </div>

                <!-- Job Information -->
                <v-card variant="outlined" class="pa-3 mb-4">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-body-2 font-weight-medium">Job ID:</span>
                        <span class="text-body-2">{{ jobId || 'Initializing...' }}</span>
                    </div>
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-body-2 font-weight-medium">Status:</span>
                        <v-chip :color="getStatusColor()" size="small" variant="tonal">
                            {{ status || 'STARTING' }}
                        </v-chip>
                    </div>
                    <div v-if="estimatedTimeRemaining" class="d-flex align-center justify-space-between mb-2">
                        <span class="text-body-2 font-weight-medium">Est. Time Remaining:</span>
                        <span class="text-body-2">{{ formatTime(estimatedTimeRemaining) }}</span>
                    </div>
                    <div class="d-flex align-center justify-space-between">
                        <span class="text-body-2 font-weight-medium">Real-time Updates:</span>
                        <v-chip :color="isTracking ? 'success' : 'warning'" size="x-small" variant="tonal">
                            <v-icon start size="x-small">
                                {{ isTracking ? 'mdi-broadcast' : 'mdi-broadcast-off' }}
                            </v-icon>
                            {{ isTracking ? 'Connected' : 'Polling' }}
                        </v-chip>
                    </div>
                </v-card>

                <!-- Progress Steps -->
                <div class="mb-4">
                    <h5 class="text-subtitle-2 mb-3">Processing Steps</h5>
                    <v-timeline density="compact" side="end">
                        <v-timeline-item v-for="(step, index) in progressSteps" :key="index"
                            :dot-color="getStepColor(step.status)" size="small">
                            <template #icon>
                                <v-icon v-if="step.status === 'completed'" size="16">mdi-check</v-icon>
                                <v-icon v-else-if="step.status === 'processing'" size="16">mdi-loading</v-icon>
                                <v-icon v-else size="16">mdi-circle-outline</v-icon>
                            </template>

                            <div class="d-flex align-center justify-space-between">
                                <span class="text-body-2">{{ step.name }}</span>
                                <v-chip v-if="step.status !== 'pending'" :color="getStepColor(step.status)"
                                    size="x-small" variant="tonal">
                                    {{ step.status }}
                                </v-chip>
                            </div>
                        </v-timeline-item>
                    </v-timeline>
                </div>

                <!-- Error Message -->
                <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
                    <v-alert-title>Generation Failed</v-alert-title>
                    {{ error }}
                </v-alert>

                <!-- Success Message -->
                <v-alert v-if="isCompleted && !error" type="success" variant="tonal" class="mb-4">
                    <v-alert-title>Video Generated Successfully!</v-alert-title>
                    Your video has been generated and is ready for download.
                </v-alert>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />

                <v-btn v-if="!isCompleted && !error" variant="text" @click="$emit('cancel')">
                    Cancel
                </v-btn>

                <v-btn v-if="isCompleted || error" variant="text" @click="$emit('close')">
                    Close
                </v-btn>

                <v-btn v-if="isCompleted && !error" color="primary" variant="tonal" prepend-icon="mdi-download"
                    @click="$emit('download')">
                    Download Video
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
    modelValue: boolean
    progress: number
    status?: string
    jobId?: string
    error?: string
    estimatedTimeRemaining?: number
    currentStage?: string
    isTracking?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    progress: 0,
    status: 'STARTING',
    jobId: '',
    error: '',
    estimatedTimeRemaining: 0,
    currentStage: '',
    isTracking: false
})

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'close': []
    'cancel': []
    'download': []
}>()

// Computed properties
const isCompleted = computed(() => {
    return props.progress >= 100 || props.status === 'COMPLETED'
})

const progressSteps = computed(() => {
    const steps = [
        { name: 'Content Analysis', status: 'pending' },
        { name: 'Script Generation', status: 'pending' },
        { name: 'Voice Synthesis', status: 'pending' },
        { name: 'Video Rendering', status: 'pending' },
        { name: 'Final Processing', status: 'pending' }
    ]

    // Update step status based on progress
    const progressPerStep = 100 / steps.length

    steps.forEach((step, index) => {
        const stepProgress = (index + 1) * progressPerStep

        if (props.progress >= stepProgress) {
            step.status = 'completed'
        } else if (props.progress > index * progressPerStep) {
            step.status = 'processing'
        }
    })

    return steps
})

// Methods
const getProgressMessage = () => {
    if (props.error) return 'Generation Failed'
    if (isCompleted.value) return 'Video Ready!'

    // Use current stage from WebSocket if available
    if (props.currentStage) {
        return `Processing: ${props.currentStage}`
    }

    const currentStep = progressSteps.value.find(step => step.status === 'processing')
    return currentStep ? `Processing: ${currentStep.name}` : 'Initializing...'
}

const getProgressDescription = () => {
    if (props.error) return 'An error occurred during video generation.'
    if (isCompleted.value) return 'Your video has been successfully generated.'

    if (props.isTracking) {
        return 'Receiving real-time updates from the video generation pipeline.'
    }

    return 'Please wait while we generate your video. This may take a few minutes.'
}

const getStatusColor = () => {
    switch (props.status?.toLowerCase()) {
        case 'completed':
            return 'success'
        case 'processing':
        case 'starting':
            return 'primary'
        case 'failed':
        case 'error':
            return 'error'
        case 'cancelled':
            return 'warning'
        default:
            return 'info'
    }
}

const getStepColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'success'
        case 'processing':
            return 'primary'
        case 'failed':
            return 'error'
        default:
            return 'surface-variant'
    }
}

const formatTime = (seconds: number) => {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.round(seconds % 60)
        return `${minutes}m ${remainingSeconds}s`
    } else {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }
}
</script>

<style scoped>
/* Progress circular styling */
:deep(.v-progress-circular) {
    font-weight: 600;
}

/* Timeline styling */
:deep(.v-timeline-item__body) {
    padding-bottom: 8px;
}

/* Alert styling */
:deep(.v-alert) {
    border-radius: 8px;
}

/* Card styling */
:deep(.v-card--variant-outlined) {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>