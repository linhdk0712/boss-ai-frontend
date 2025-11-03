<template>
    <!-- Floating Video Progress Indicator -->
    <v-fab v-if="hasActiveJobs" location="bottom end" size="large" color="primary" icon="mdi-video-plus"
        class="video-progress-fab" @click="showProgressDialog = true">
        <!-- Progress Ring -->
        <v-progress-circular v-if="overallProgress > 0" :model-value="overallProgress" :size="60" :width="4"
            color="white" class="progress-ring" />

        <!-- Job Count Badge -->
        <v-badge :content="activeJobCount" color="error" location="top start" offset-x="8" offset-y="8">
            <v-icon size="28">mdi-video-plus</v-icon>
        </v-badge>
    </v-fab>

    <!-- Mini Progress Cards (Alternative Display) -->
    <v-slide-y-reverse-transition group>
        <v-card v-for="job in recentActiveJobs" :key="`notification-${job.id}`" class="video-notification-card"
            elevation="8" color="surface">
            <v-card-text class="pa-3">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="flex-grow-1">
                        <div class="text-body-2 font-weight-medium">
                            {{ truncateText(job.title || 'Untitled Content', 30) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ getStatusText(job.status) }}
                        </div>
                    </div>

                    <v-btn icon="mdi-close" variant="text" size="x-small" @click="dismissNotification(job.id)" />
                </div>

                <v-progress-linear :model-value="getJobProgress(job)" :color="getStatusColor(job.status)" height="4"
                    rounded />
            </v-card-text>
        </v-card>
    </v-slide-y-reverse-transition>

    <!-- Success Notifications -->
    <v-snackbar v-for="notification in successNotifications" :key="`success-${notification.id}`"
        v-model="notification.show" color="success" timeout="5000" location="top right" class="success-notification">
        <div class="d-flex align-center">
            <v-icon start>mdi-check-circle</v-icon>
            <div>
                <div class="font-weight-medium">Video đã tạo xong!</div>
                <div class="text-caption">{{ notification.title }}</div>
            </div>
        </div>

        <template #actions>
            <v-btn variant="text" @click="viewCompletedVideo(notification)">
                Xem
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="notification.show = false" />
        </template>
    </v-snackbar>

    <!-- Error Notifications -->
    <v-snackbar v-for="notification in errorNotifications" :key="`error-${notification.id}`" v-model="notification.show"
        color="error" timeout="8000" location="top right" class="error-notification">
        <div class="d-flex align-center">
            <v-icon start>mdi-alert-circle</v-icon>
            <div>
                <div class="font-weight-medium">Tạo video thất bại</div>
                <div class="text-caption">{{ notification.title }}</div>
                <div v-if="notification.error" class="text-caption mt-1">
                    {{ notification.error }}
                </div>
            </div>
        </div>

        <template #actions>
            <v-btn variant="text" @click="retryVideo(notification)">
                Thử lại
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="notification.show = false" />
        </template>
    </v-snackbar>

    <!-- Progress Dialog -->
    <VideoProgressDialog v-model="showProgressDialog" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVideoProgress } from '@/composables/useVideoProgress'
import VideoProgressDialog from './VideoProgressDialog.vue'
import type { ContentGenerationDto } from '@/types/content'

// State
const showProgressDialog = ref(false)
const dismissedNotifications = ref<Set<number>>(new Set())
const successNotifications = ref<Array<{
    id: number
    title: string
    show: boolean
    job: ContentGenerationDto
}>>([])
const errorNotifications = ref<Array<{
    id: number
    title: string
    error?: string
    show: boolean
    job: ContentGenerationDto
}>>([])

// Composables
const {
    activeVideoJobs,
    completedVideoJobs,
    failedVideoJobs,
    hasActiveJobs,
    getJobProgress,
    getStatusColor,
    getStatusText,
    cleanup
} = useVideoProgress()

// Computed
const activeJobCount = computed(() => activeVideoJobs.value.length)

const overallProgress = computed(() => {
    if (activeVideoJobs.value.length === 0) return 0

    const totalProgress = activeVideoJobs.value.reduce((sum, job) => {
        return sum + getJobProgress(job)
    }, 0)

    return Math.round(totalProgress / activeVideoJobs.value.length)
})

const recentActiveJobs = computed(() => {
    return activeVideoJobs.value
        .filter(job => !dismissedNotifications.value.has(job.id))
        .slice(0, 3) // Show max 3 notifications
})

// Methods
const dismissNotification = (jobId: number) => {
    dismissedNotifications.value.add(jobId)
}

const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const viewCompletedVideo = (notification: any) => {
    notification.show = false
    // TODO: Navigate to video view or open video player
    console.log('View completed video:', notification.job)
}

const retryVideo = (notification: any) => {
    notification.show = false
    // TODO: Implement retry functionality
    console.log('Retry video:', notification.job)
}

// Watch for completed jobs to show success notifications
watch(completedVideoJobs, (newCompleted, oldCompleted) => {
    const newlyCompleted = newCompleted.filter(job =>
        !oldCompleted?.some(old => old.id === job.id)
    )

    newlyCompleted.forEach(job => {
        successNotifications.value.push({
            id: job.id,
            title: job.title || 'Untitled Content',
            show: true,
            job
        })
    })
}, { deep: true })

// Watch for failed jobs to show error notifications
watch(failedVideoJobs, (newFailed, oldFailed) => {
    const newlyFailed = newFailed.filter(job =>
        !oldFailed?.some(old => old.id === job.id)
    )

    newlyFailed.forEach(job => {
        errorNotifications.value.push({
            id: job.id,
            title: job.title || 'Untitled Content',
            error: job.errorMessage,
            show: true,
            job
        })
    })
}, { deep: true })

// Cleanup notifications periodically
const cleanupNotifications = () => {
    // Remove old success notifications
    successNotifications.value = successNotifications.value.filter(n => n.show)

    // Remove old error notifications
    errorNotifications.value = errorNotifications.value.filter(n => n.show)

    // Clear dismissed notifications for completed/failed jobs
    const activeIds = new Set(activeVideoJobs.value.map(job => job.id))
    dismissedNotifications.value = new Set(
        Array.from(dismissedNotifications.value).filter(id => activeIds.has(id))
    )
}

// Cleanup interval
let cleanupInterval: NodeJS.Timeout

onMounted(() => {
    cleanupInterval = setInterval(cleanupNotifications, 30000) // Cleanup every 30 seconds
})

onUnmounted(() => {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
    }
    cleanup()
})
</script>

<style scoped>
.video-progress-fab {
    position: fixed !important;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
}

.progress-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.video-notification-card {
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 280px;
    z-index: 999;
    margin-bottom: 8px;
    border-radius: 12px;
}

.success-notification,
.error-notification {
    margin-bottom: 8px;
}

.v-snackbar {
    border-radius: 12px;
}

/* Animation for notification cards */
.video-notification-card {
    transition: all 0.3s ease;
}

.video-notification-card:hover {
    transform: translateX(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
    .video-progress-fab {
        bottom: 16px;
        right: 16px;
    }

    .video-notification-card {
        right: 16px;
        width: calc(100vw - 32px);
        max-width: 280px;
    }
}
</style>