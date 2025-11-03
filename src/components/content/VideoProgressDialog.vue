<template>
    <v-dialog v-model="isOpen" max-width="600" persistent scrollable>
        <v-card>
            <!-- Dialog Header -->
            <v-card-title class="d-flex align-center justify-space-between py-4 px-6 bg-primary">
                <div class="d-flex align-center text-white">
                    <v-icon class="me-3" size="28">mdi-video-plus</v-icon>
                    <div>
                        <h2 class="text-h6 font-weight-bold mb-1">Video Generation Progress</h2>
                        <p class="text-body-2 mb-0 text-white" style="opacity: 0.9;">
                            Theo dõi tiến trình tạo video từ nội dung AI
                        </p>
                    </div>
                </div>

                <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="handleClose" />
            </v-card-title>

            <!-- Dialog Content -->
            <v-card-text class="pa-0">
                <v-container fluid class="py-4">
                    <!-- No Jobs Message -->
                    <div v-if="allJobs.length === 0" class="text-center py-8">
                        <v-icon size="80" color="grey-lighten-1" class="mb-4">
                            mdi-video-off-outline
                        </v-icon>
                        <h3 class="text-h6 mb-2">Chưa có video nào đang được tạo</h3>
                        <p class="text-body-2 text-medium-emphasis">
                            Bắt đầu tạo video từ nội dung AI của bạn
                        </p>
                    </div>

                    <!-- Active Jobs -->
                    <div v-if="activeJobs.length > 0" class="mb-6">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                            <v-icon class="me-2" color="warning">mdi-clock-outline</v-icon>
                            Đang xử lý ({{ activeJobs.length }})
                        </h3>

                        <v-card v-for="job in activeJobs" :key="job.id" class="mb-3" variant="outlined">
                            <v-card-text class="pa-4">
                                <div class="d-flex align-center justify-space-between mb-3">
                                    <div class="flex-grow-1">
                                        <h4 class="text-body-1 font-weight-medium mb-1">
                                            {{ job.title || 'Untitled Content' }}
                                        </h4>
                                        <div class="d-flex align-center gap-2">
                                            <v-chip :color="getStatusColor(job.status)" size="small" variant="tonal">
                                                <v-icon start size="small">{{ getStatusIcon(job.status) }}</v-icon>
                                                {{ getStatusText(job.status) }}
                                            </v-chip>
                                            <span class="text-caption text-medium-emphasis">
                                                ID: {{ job.id }}
                                            </span>
                                        </div>
                                    </div>

                                    <v-menu>
                                        <template #activator="{ props }">
                                            <v-btn icon="mdi-dots-vertical" variant="text" size="small"
                                                v-bind="props" />
                                        </template>
                                        <v-list>
                                            <v-list-item prepend-icon="mdi-eye" title="Xem nội dung"
                                                @click="viewContent(job)" />
                                            <v-list-item prepend-icon="mdi-refresh" title="Kiểm tra trạng thái"
                                                @click="checkStatus(job)" />
                                            <v-divider />
                                            <v-list-item prepend-icon="mdi-cancel" title="Hủy theo dõi"
                                                class="text-error" @click="removeJob(job)" />
                                        </v-list>
                                    </v-menu>
                                </div>

                                <!-- Progress Bar -->
                                <v-progress-linear :model-value="getJobProgress(job)"
                                    :color="getStatusColor(job.status)" height="8" rounded class="mb-2" />

                                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                                    <span>{{ getJobProgress(job) }}% hoàn thành</span>
                                    <span v-if="job.startedAt">
                                        Bắt đầu: {{ formatTime(job.startedAt) }}
                                    </span>
                                </div>

                                <!-- Content Preview -->
                                <div class="mt-3">
                                    <div class="text-caption text-medium-emphasis mb-1">Nội dung:</div>
                                    <p class="text-body-2 content-preview">
                                        {{ truncateText(job.generatedContent || job.content || '', 120) }}
                                    </p>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>

                    <!-- Completed Jobs -->
                    <div v-if="completedJobs.length > 0" class="mb-6">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                            <v-icon class="me-2" color="success">mdi-check-circle</v-icon>
                            Hoàn thành ({{ completedJobs.length }})
                        </h3>

                        <v-card v-for="job in completedJobs" :key="job.id" class="mb-3" variant="outlined">
                            <v-card-text class="pa-4">
                                <div class="d-flex align-center justify-space-between mb-2">
                                    <div class="flex-grow-1">
                                        <h4 class="text-body-1 font-weight-medium mb-1">
                                            {{ job.title || 'Untitled Content' }}
                                        </h4>
                                        <div class="d-flex align-center gap-2">
                                            <v-chip color="success" size="small" variant="tonal">
                                                <v-icon start size="small">mdi-check-circle</v-icon>
                                                Hoàn thành
                                            </v-chip>
                                            <span class="text-caption text-medium-emphasis">
                                                {{ formatTime(job.completedAt || job.updatedAt) }}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="d-flex gap-2">
                                        <v-btn variant="text" size="small" prepend-icon="mdi-play" color="primary"
                                            @click="playVideo(job)">
                                            Xem video
                                        </v-btn>
                                        <v-btn variant="text" size="small" prepend-icon="mdi-download" color="secondary"
                                            @click="downloadVideo(job)">
                                            Tải xuống
                                        </v-btn>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>

                    <!-- Failed Jobs -->
                    <div v-if="failedJobs.length > 0" class="mb-6">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                            <v-icon class="me-2" color="error">mdi-alert-circle</v-icon>
                            Thất bại ({{ failedJobs.length }})
                        </h3>

                        <v-card v-for="job in failedJobs" :key="job.id" class="mb-3" variant="outlined" color="error">
                            <v-card-text class="pa-4">
                                <div class="d-flex align-center justify-space-between mb-2">
                                    <div class="flex-grow-1">
                                        <h4 class="text-body-1 font-weight-medium mb-1">
                                            {{ job.title || 'Untitled Content' }}
                                        </h4>
                                        <div class="d-flex align-center gap-2">
                                            <v-chip color="error" size="small" variant="tonal">
                                                <v-icon start size="small">mdi-alert-circle</v-icon>
                                                Thất bại
                                            </v-chip>
                                            <span class="text-caption text-medium-emphasis">
                                                {{ formatTime(job.failedAt || job.updatedAt) }}
                                            </span>
                                        </div>
                                    </div>

                                    <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary"
                                        @click="retryJob(job)">
                                        Thử lại
                                    </v-btn>
                                </div>

                                <!-- Error Message -->
                                <div v-if="job.errorMessage" class="mt-2">
                                    <div class="text-caption text-error mb-1">Lỗi:</div>
                                    <p class="text-body-2 text-error">{{ job.errorMessage }}</p>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-container>
            </v-card-text>

            <!-- Dialog Footer -->
            <v-divider />
            <v-card-actions class="pa-4">
                <v-btn variant="text" prepend-icon="mdi-refresh" @click="refreshAll">
                    Làm mới tất cả
                </v-btn>

                <v-btn v-if="completedJobs.length > 0 || failedJobs.length > 0" variant="text"
                    prepend-icon="mdi-delete-sweep" @click="clearCompleted">
                    Xóa đã hoàn thành
                </v-btn>

                <v-spacer />

                <v-btn variant="text" @click="handleClose">
                    Đóng
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Video Player Dialog -->
        <VideoPlayerDialog v-model="showVideoPlayer" :content="selectedVideoContent" />
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoProgress } from '@/composables/useVideoProgress'
import { contentService } from '@/services/contentService'
import VideoPlayerDialog from './VideoPlayerDialog.vue'
import type { ContentGenerationDto } from '@/types/content'

// Props
interface Props {
    modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

// State
const showVideoPlayer = ref(false)
const selectedVideoContent = ref<ContentGenerationDto | null>(null)

// Composables
const {
    videoJobs,
    activeVideoJobs,
    completedVideoJobs,
    failedVideoJobs,
    removeVideoJob,
    clearCompletedJobs,
    checkVideoJobsStatus,
    getJobProgress,
    getStatusColor,
    getStatusIcon,
    getStatusText
} = useVideoProgress()

// Computed
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const allJobs = computed(() => videoJobs.value)
const activeJobs = computed(() => activeVideoJobs.value)
const completedJobs = computed(() => completedVideoJobs.value)
const failedJobs = computed(() => failedVideoJobs.value)

// Methods
const handleClose = () => {
    isOpen.value = false
}

const viewContent = (job: ContentGenerationDto) => {
    // TODO: Implement content viewing
    console.log('View content:', job)
}

const checkStatus = async (job: ContentGenerationDto) => {
    await checkVideoJobsStatus()
}

const removeJob = (job: ContentGenerationDto) => {
    removeVideoJob(job.id)
}

const retryJob = (job: ContentGenerationDto) => {
    // TODO: Implement retry functionality
    console.log('Retry job:', job)
}

const refreshAll = async () => {
    await checkVideoJobsStatus()
}

const clearCompleted = () => {
    clearCompletedJobs()
}

const playVideo = (job: ContentGenerationDto) => {
    selectedVideoContent.value = job
    showVideoPlayer.value = true
}

const downloadVideo = async (job: ContentGenerationDto) => {
    try {
        const blob = await contentService.downloadVideo(job.id)
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `${job.title || 'video'}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    } catch (err: any) {
        console.error('Failed to download video:', err)
        // Show error message
    }
}

const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const formatTime = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<style scoped>
.content-preview {
    background-color: rgba(var(--v-theme-surface-variant), 0.5);
    padding: 8px 12px;
    border-radius: 6px;
    border-left: 3px solid rgb(var(--v-theme-primary));
    line-height: 1.4;
    font-size: 0.875rem;
}

.v-card {
    border-radius: 12px;
}

.v-progress-linear {
    border-radius: 4px;
}

.text-error {
    color: rgb(var(--v-theme-error)) !important;
}

/* Dark theme adjustments */
.v-theme--dark .content-preview {
    background-color: rgba(var(--v-theme-surface-bright), 0.1);
    border-left-color: rgb(var(--v-theme-primary-lighten-1));
}
</style>