<template>
    <v-dialog v-model="isOpen" max-width="900" scrollable>
        <v-card>
            <!-- Dialog Header -->
            <v-card-title class="d-flex align-center justify-space-between py-4 px-6">
                <div class="d-flex align-center">
                    <v-icon class="me-3" size="28" color="primary">mdi-play-circle</v-icon>
                    <div>
                        <h2 class="text-h6 font-weight-bold mb-1">{{ content?.title || 'Generated Video' }}</h2>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            Video được tạo từ nội dung AI
                        </p>
                    </div>
                </div>

                <v-btn icon="mdi-close" variant="text" size="small" @click="handleClose" />
            </v-card-title>

            <v-divider />

            <!-- Video Player -->
            <v-card-text class="pa-0">
                <div class="video-container">
                    <!-- Loading State -->
                    <div v-if="loading" class="video-loading d-flex flex-column align-center justify-center">
                        <v-progress-circular size="64" color="primary" indeterminate class="mb-4" />
                        <h3 class="text-h6 mb-2">Đang tải video...</h3>
                        <p class="text-body-2 text-medium-emphasis">Vui lòng đợi trong giây lát</p>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="error" class="video-error d-flex flex-column align-center justify-center">
                        <v-icon size="80" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
                        <h3 class="text-h6 mb-2">Không thể tải video</h3>
                        <p class="text-body-2 text-medium-emphasis mb-4">{{ error }}</p>
                        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadVideo">
                            Thử lại
                        </v-btn>
                    </div>

                    <!-- Video Player -->
                    <div v-else-if="videoUrl" class="video-player">
                        <video ref="videoElement" :src="videoUrl" controls preload="metadata" class="video-element"
                            @loadstart="onVideoLoadStart" @loadeddata="onVideoLoaded" @error="onVideoError">
                            <p>Trình duyệt của bạn không hỗ trợ phát video.</p>
                        </video>

                        <!-- Video Controls Overlay -->
                        <div class="video-controls-overlay">
                            <v-btn icon="mdi-fullscreen" variant="text" color="white" class="fullscreen-btn"
                                @click="toggleFullscreen" />
                        </div>
                    </div>

                    <!-- No Video State -->
                    <div v-else class="video-placeholder d-flex flex-column align-center justify-center">
                        <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-video-off-outline</v-icon>
                        <h3 class="text-h6 mb-2">Video chưa sẵn sàng</h3>
                        <p class="text-body-2 text-medium-emphasis mb-4">
                            Video đang được xử lý hoặc chưa được tạo
                        </p>
                        <v-btn color="primary" prepend-icon="mdi-refresh" @click="checkVideoStatus">
                            Kiểm tra trạng thái
                        </v-btn>
                    </div>
                </div>

                <!-- Video Information -->
                <v-container v-if="content" fluid class="py-4">
                    <v-row>
                        <!-- Content Details -->
                        <v-col cols="12" md="8">
                            <h3 class="text-subtitle-1 font-weight-bold mb-3">Thông tin nội dung</h3>

                            <v-list density="compact">
                                <v-list-item v-if="content.contentType">
                                    <v-list-item-title>Loại nội dung</v-list-item-title>
                                    <v-list-item-subtitle>{{ getContentTypeLabel(content.contentType)
                                        }}</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="content.language">
                                    <v-list-item-title>Ngôn ngữ</v-list-item-title>
                                    <v-list-item-subtitle>{{ getLanguageLabel(content.language)
                                        }}</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="content.tone">
                                    <v-list-item-title>Giọng điệu</v-list-item-title>
                                    <v-list-item-subtitle>{{ content.tone }}</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="content.industry">
                                    <v-list-item-title>Ngành nghề</v-list-item-title>
                                    <v-list-item-subtitle>{{ content.industry }}</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="content.targetAudience">
                                    <v-list-item-title>Đối tượng mục tiêu</v-list-item-title>
                                    <v-list-item-subtitle>{{ content.targetAudience }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-col>

                        <!-- Video Statistics -->
                        <v-col cols="12" md="4">
                            <h3 class="text-subtitle-1 font-weight-bold mb-3">Thống kê</h3>

                            <v-row>
                                <v-col cols="6">
                                    <v-card variant="tonal" color="primary" class="text-center pa-3">
                                        <div class="text-h6 font-weight-bold">{{ content.wordCount || 0 }}</div>
                                        <div class="text-caption">Từ</div>
                                    </v-card>
                                </v-col>
                                <v-col cols="6">
                                    <v-card variant="tonal" color="secondary" class="text-center pa-3">
                                        <div class="text-h6 font-weight-bold">{{ content.characterCount || 0 }}</div>
                                        <div class="text-caption">Ký tự</div>
                                    </v-card>
                                </v-col>
                            </v-row>

                            <div class="mt-3">
                                <div class="text-caption text-medium-emphasis mb-1">Trạng thái:</div>
                                <v-chip :color="getStatusColor(content.status)" variant="tonal" size="small">
                                    <v-icon start size="small">{{ getStatusIcon(content.status) }}</v-icon>
                                    {{ getStatusText(content.status) }}
                                </v-chip>
                            </div>

                            <div class="mt-3">
                                <div class="text-caption text-medium-emphasis mb-1">Tạo lúc:</div>
                                <div class="text-body-2">{{ formatDate(content.createdAt) }}</div>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <!-- Dialog Actions -->
            <v-divider />
            <v-card-actions class="pa-4">
                <v-btn v-if="videoUrl" variant="text" prepend-icon="mdi-download" @click="downloadVideo">
                    Tải xuống
                </v-btn>

                <v-btn v-if="videoUrl" variant="text" prepend-icon="mdi-share" @click="shareVideo">
                    Chia sẻ
                </v-btn>

                <v-btn variant="text" prepend-icon="mdi-content-copy" @click="copyContent">
                    Sao chép nội dung
                </v-btn>

                <v-spacer />

                <v-btn variant="text" @click="handleClose">
                    Đóng
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { contentService } from '@/services/contentService'
import type { ContentGenerationDto } from '@/types/content'

// Props
interface Props {
    modelValue: boolean
    content?: ContentGenerationDto | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const videoUrl = ref<string | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)

// Computed
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Methods
const handleClose = () => {
    isOpen.value = false
    // Clean up video URL to free memory
    if (videoUrl.value && videoUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl.value)
    }
    videoUrl.value = null
    error.value = null
}

const loadVideo = async () => {
    if (!props.content?.id) return

    try {
        loading.value = true
        error.value = null

        // First check if video is ready
        const statusResponse = await contentService.getVideoStatus(props.content.id)

        if (statusResponse.errorCode === 'SUCCESS' && statusResponse.data.videoUrl) {
            videoUrl.value = statusResponse.data.videoUrl
        } else if (statusResponse.data.status === 'WORKFLOW_COMPLETED') {
            // Try to get download URL
            const urlResponse = await contentService.getVideoDownloadUrl(props.content.id)
            if (urlResponse.errorCode === 'SUCCESS') {
                videoUrl.value = urlResponse.data.downloadUrl
            } else {
                error.value = 'Video đã hoàn thành nhưng không thể tải URL'
            }
        } else {
            error.value = 'Video chưa sẵn sàng để phát'
        }
    } catch (err: any) {
        error.value = err.response?.data?.errorMessage || err.message || 'Không thể tải video'
    } finally {
        loading.value = false
    }
}

const checkVideoStatus = async () => {
    await loadVideo()
}

const downloadVideo = async () => {
    if (!props.content?.id) return

    try {
        const blob = await contentService.downloadVideo(props.content.id)
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `${props.content.title || 'video'}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    } catch (err: any) {
        // Show error message
    }
}

const shareVideo = () => {
    if (navigator.share && videoUrl.value) {
        navigator.share({
            title: props.content?.title || 'Generated Video',
            text: 'Check out this AI-generated video!',
            url: videoUrl.value
        })
    } else {
        // Fallback: copy URL to clipboard
        if (videoUrl.value) {
            navigator.clipboard.writeText(videoUrl.value)
        }
    }
}

const copyContent = async () => {
    if (!props.content) return

    const textToCopy = props.content.title
        ? `${props.content.title}\n\n${props.content.generatedContent || props.content.content}`
        : props.content.generatedContent || props.content.content || ''

    try {
        await navigator.clipboard.writeText(textToCopy)
        // Show success message
    } catch (error) {
        // Handle copy error
    }
}

const toggleFullscreen = () => {
    if (!videoElement.value) return

    if (document.fullscreenElement) {
        document.exitFullscreen()
    } else {
        videoElement.value.requestFullscreen()
    }
}

// Video event handlers
const onVideoLoadStart = () => {
    loading.value = true
}

const onVideoLoaded = () => {
    loading.value = false
    error.value = null
}

const onVideoError = (event: Event) => {
    loading.value = false
    error.value = 'Không thể phát video. Vui lòng thử lại.'
}

// Helper methods
const getContentTypeLabel = (value: string): string => {
    const labelMap: Record<string, string> = {
        'blog_post': 'Bài viết blog',
        'social_media': 'Mạng xã hội',
        'email': 'Email',
        'article': 'Bài báo',
        'marketing': 'Marketing',
        'general': 'Tổng quát'
    }
    return labelMap[value] || value
}

const getLanguageLabel = (value: string): string => {
    const labelMap: Record<string, string> = {
        'vi': 'Tiếng Việt',
        'en': 'English',
        'es': 'Español',
        'fr': 'Français'
    }
    return labelMap[value] || value
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'WORKFLOW_COMPLETED':
            return 'success'
        case 'WORKFLOW_FAILED':
            return 'error'
        case 'WORKFLOW_TRIGGERED':
        case 'PROCESSING':
            return 'warning'
        default:
            return 'grey'
    }
}

const getStatusIcon = (status: string): string => {
    switch (status) {
        case 'WORKFLOW_COMPLETED':
            return 'mdi-check-circle'
        case 'WORKFLOW_FAILED':
            return 'mdi-alert-circle'
        case 'WORKFLOW_TRIGGERED':
            return 'mdi-clock-outline'
        case 'PROCESSING':
            return 'mdi-cog'
        default:
            return 'mdi-help-circle'
    }
}

const getStatusText = (status: string): string => {
    switch (status) {
        case 'WORKFLOW_COMPLETED':
            return 'Hoàn thành'
        case 'WORKFLOW_FAILED':
            return 'Thất bại'
        case 'WORKFLOW_TRIGGERED':
            return 'Đang khởi tạo'
        case 'PROCESSING':
            return 'Đang xử lý'
        default:
            return 'Không xác định'
    }
}

const formatDate = (dateString: string): string => {
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

// Watch for content changes
watch(() => props.content, (newContent) => {
    if (newContent && isOpen.value) {
        nextTick(() => {
            loadVideo()
        })
    }
}, { immediate: true })

// Watch for dialog open
watch(isOpen, (newValue) => {
    if (newValue && props.content) {
        loadVideo()
    }
})
</script>

<style scoped>
.video-container {
    position: relative;
    width: 100%;
    height: 400px;
    background-color: #000;
    border-radius: 0;
    overflow: hidden;
}

.video-loading,
.video-error,
.video-placeholder {
    height: 100%;
    background-color: rgba(var(--v-theme-surface), 0.8);
    color: rgb(var(--v-theme-on-surface));
}

.video-player {
    position: relative;
    width: 100%;
    height: 100%;
}

.video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: #000;
}

.video-controls-overlay {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
}

.fullscreen-btn {
    background-color: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px);
}

.fullscreen-btn:hover {
    background-color: rgba(0, 0, 0, 0.7) !important;
}

/* Responsive video container */
@media (max-width: 600px) {
    .video-container {
        height: 250px;
    }
}

/* Dark theme adjustments */
.v-theme--dark .video-loading,
.v-theme--dark .video-error,
.v-theme--dark .video-placeholder {
    background-color: rgba(var(--v-theme-surface-bright), 0.1);
}
</style>