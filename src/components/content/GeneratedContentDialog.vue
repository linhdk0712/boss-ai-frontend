<template>
    <v-dialog v-model="isOpen" max-width="900" :persistent="persistent" scrollable class="generated-content-dialog"
        @click:outside="handleClickOutside" @keydown.esc="handleEscapeKey">
        <v-card class="dialog-card">
            <!-- Dialog Header -->
            <v-card-title class="dialog-header d-flex align-center justify-space-between py-4 px-6">
                <div class="d-flex align-center">
                    <v-icon class="me-3" size="28" color="success">mdi-check-circle</v-icon>
                    <div>
                        <h2 class="text-h6 font-weight-bold mb-1">Content Generated Successfully!</h2>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            Your AI-generated content is ready to use
                        </p>
                    </div>
                </div>

                <div class="d-flex align-center ga-2">
                    <!-- Persistent Status Indicator -->
                    <v-tooltip location="bottom">
                        <template #activator="{ props: tooltipProps }">
                            <v-chip v-bind="tooltipProps" :color="persistent ? 'warning' : 'success'" variant="tonal"
                                size="small" :prepend-icon="persistent ? 'mdi-lock' : 'mdi-lock-open'">
                                {{ persistent ? 'Persistent' : 'Closable' }}
                            </v-chip>
                        </template>
                        <span>{{ persistentStatusTooltip }}</span>
                    </v-tooltip>

                    <v-btn icon="mdi-close" variant="text" size="small" @click="handleClose" />
                </div>
            </v-card-title>

            <v-divider />

            <!-- Dialog Content -->
            <v-card-text class="dialog-content pa-0">
                <v-container fluid class="py-6">
                    <!-- Content Title -->
                    <div v-if="content?.title" class="mb-4">
                        <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-format-title"
                            class="mb-2">
                            Title
                        </v-chip>
                        <h3 class="text-h6 font-weight-medium">{{ content.title }}</h3>
                    </div>

                    <!-- Status Indicators -->
                    <div class="mb-4">
                        <v-chip :color="getStatusColor()" variant="flat" size="small" :prepend-icon="getStatusIcon()"
                            class="me-2">
                            {{ content?.status || 'UNKNOWN' }}
                        </v-chip>

                        <!-- Incomplete indicator if applicable -->
                        <v-chip v-if="content?.isIncomplete" color="warning" variant="tonal" size="small"
                            prepend-icon="mdi-alert" class="me-2">
                            Incomplete ({{ content.incompleteDetails?.reason || 'Unknown reason' }})
                        </v-chip>
                    </div>

                    <!-- Generated Content Display -->
                    <v-card class="content-display-card mb-6" elevation="2">
                        <v-card-title class="d-flex align-center justify-space-between py-3">
                            <span class="text-body-1 font-weight-medium">Generated Content</span>
                            <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyToClipboard">
                                Copy
                            </v-btn>
                        </v-card-title>

                        <v-card-text class="pa-0">
                            <div class="generated-text-container">
                                <div class="content-text" v-html="formattedContent" />
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Statistics Grid -->
                    <div class="mb-6">
                        <h4 class="text-subtitle-1 font-weight-medium mb-3">Generation Statistics</h4>
                        <v-row>
                            <v-col cols="6" md="3">
                                <v-card variant="tonal" color="primary" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-format-text</v-icon>
                                        <div class="text-h6 font-weight-bold">{{ content?.wordCount || 0 }}</div>
                                        <div class="text-caption">Words</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="6" md="3">
                                <v-card variant="tonal" color="secondary" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-alphabetical</v-icon>
                                        <div class="text-h6 font-weight-bold">{{ content?.characterCount || 0 }}</div>
                                        <div class="text-caption">Characters</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="6" md="3">
                                <v-card variant="tonal" color="info" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-cpu-64-bit</v-icon>
                                        <div class="text-h6 font-weight-bold">{{ content?.tokensUsed || 0 }}</div>
                                        <div class="text-caption">Tokens</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col cols="6" md="3">
                                <v-card variant="tonal" color="success" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-timer</v-icon>
                                        <div class="text-h6 font-weight-bold">{{
                                            formatProcessingTime(content?.processingTimeMs ||
                                            0) }}</div>
                                        <div class="text-caption">Processing Time</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- Additional stats row -->
                        <v-row v-if="content?.estimatedCost !== undefined || content?.qualityScore !== undefined"
                            class="mt-2">
                            <v-col v-if="content?.estimatedCost !== undefined" cols="6">
                                <v-card variant="tonal" color="warning" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-currency-usd</v-icon>
                                        <div class="text-h6 font-weight-bold">${{ formatCost(content.estimatedCost) }}
                                        </div>
                                        <div class="text-caption">Estimated Cost</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>

                            <v-col v-if="content?.qualityScore !== undefined" cols="6">
                                <v-card variant="tonal" color="purple" class="stat-card">
                                    <v-card-text class="text-center pa-4">
                                        <v-icon size="24" class="mb-2">mdi-star</v-icon>
                                        <div class="text-h6 font-weight-bold">{{ content.qualityScore.toFixed(1) }}/10
                                        </div>
                                        <div class="text-caption">Quality Score</div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                    <!-- Action Buttons -->
                    <div>
                        <h4 class="text-subtitle-1 font-weight-medium mb-3">Actions</h4>
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-btn color="success" variant="flat" size="large" :loading="saving"
                                    :disabled="!canSave || loading" @click="handleSave" block>
                                    <v-icon start>mdi-content-save</v-icon>
                                    Save to Library
                                </v-btn>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-btn color="secondary" variant="flat" size="large" :loading="creatingVideo"
                                    :disabled="!canCreateVideo || loading" @click="handleCreateVideo" block>
                                    <v-icon start>mdi-video-plus</v-icon>
                                    Create Video
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!-- Action descriptions -->
                        <div class="text-caption text-medium-emphasis mt-3 text-center">
                            <strong>Save:</strong> Add this content to your personal library for future use •
                            <strong>Video:</strong> Generate a video presentation from this content
                        </div>
                    </div>
                </v-container>
            </v-card-text>

            <!-- Dialog Footer -->
            <v-divider />
            <v-card-actions class="pa-4">
                <!-- Persistent Toggle Button -->
                <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                        <v-btn v-bind="tooltipProps" variant="text"
                            :prepend-icon="persistent ? 'mdi-lock' : 'mdi-lock-open'"
                            :color="persistent ? 'warning' : 'success'" @click="emit('toggle-persistent')">
                            {{ persistent ? 'Make Closable' : 'Make Persistent' }}
                        </v-btn>
                    </template>
                    <span>{{ persistentToggleTooltip }}</span>
                </v-tooltip>

                <v-spacer />

                <v-btn variant="text" @click="handleClose">
                    Close
                </v-btn>
                <v-btn color="primary" variant="flat" @click="handleGenerateNew">
                    Generate New Content
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Copy Success Snackbar -->
        <v-snackbar v-model="copySuccess" color="success" timeout="2000" location="top">
            <v-icon start>mdi-check</v-icon>
            Content copied to clipboard!
        </v-snackbar>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContentGenerateResponse } from '@/types/content'

// Props
interface Props {
    modelValue: boolean
    content?: ContentGenerateResponse | null
    loading?: boolean
    saving?: boolean
    creatingVideo?: boolean
    canSave?: boolean
    canCreateVideo?: boolean
    persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    saving: false,
    creatingVideo: false,
    canSave: false,
    canCreateVideo: false,
    persistent: true
})

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    save: [title: string]
    'create-video': [title?: string]
    'generate-new': []
    close: []
    'toggle-persistent': []
}>()

// Reactive state
const copySuccess = ref(false)

// Computed properties
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const persistentStatusTooltip = computed(() => {
    return props.persistent
        ? 'Dialog won\'t close when clicking outside or pressing Escape'
        : 'Dialog can be closed by clicking outside or pressing Escape'
})

const persistentToggleTooltip = computed(() => {
    return props.persistent
        ? 'Allow closing by clicking outside or pressing Escape'
        : 'Prevent closing by clicking outside or pressing Escape'
})

const formattedContent = computed(() => {
    if (!props.content?.generatedContent) return ''

    // Convert line breaks to HTML and preserve formatting
    return props.content.generatedContent
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
})

// Methods
const getStatusColor = () => {
    if (!props.content) return 'grey'

    switch (props.content.status) {
        case 'COMPLETED':
            return props.content.isIncomplete ? 'warning' : 'success'
        case 'FAILED':
            return 'error'
        default:
            return 'grey'
    }
}

const getStatusIcon = () => {
    if (!props.content) return 'mdi-help'

    switch (props.content.status) {
        case 'COMPLETED':
            return props.content.isIncomplete ? 'mdi-check-circle-outline' : 'mdi-check-circle'
        case 'FAILED':
            return 'mdi-alert-circle'
        default:
            return 'mdi-help-circle'
    }
}

const copyToClipboard = async () => {
    if (!props.content?.generatedContent) return

    try {
        const textToCopy = props.content.title
            ? `${props.content.title}\n\n${props.content.generatedContent}`
            : props.content.generatedContent

        await navigator.clipboard.writeText(textToCopy)
        copySuccess.value = true
    } catch (error) {
        // console.error('Failed to copy to clipboard:', error)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = props.content.generatedContent
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            if (successful) {
                copySuccess.value = true
            }
        } catch (err) {
            // console.error('Fallback copy failed:', err)
        }

        document.body.removeChild(textArea)
    }
}

const formatCost = (cost: number | null | undefined): string => {
    if (cost === null || cost === undefined) {
        return 'N/A'
    }
    return cost.toFixed(6)
}

const formatProcessingTime = (timeMs: number): string => {
    if (timeMs < 1000) {
        return `${timeMs}ms`
    } else if (timeMs < 60000) {
        return `${(timeMs / 1000).toFixed(1)}s`
    } else {
        const minutes = Math.floor(timeMs / 60000)
        const seconds = ((timeMs % 60000) / 1000).toFixed(0)
        return `${minutes}m ${seconds}s`
    }
}

const handleSave = () => {
    const saveTitle = props.content?.title || `Generated Content ${new Date().toLocaleDateString()}`
    emit('save', saveTitle)
}

const handleCreateVideo = () => {
    const videoTitle = props.content?.title
    emit('create-video', videoTitle)
}

const handleClose = () => {
    emit('close')
    isOpen.value = false
}

const handleGenerateNew = () => {
    emit('generate-new')
    isOpen.value = false
}

const handleClickOutside = () => {
    // Only close if not persistent or if user explicitly allows
    if (!props.persistent) {
        handleClose()
    }
}

const handleEscapeKey = (event: KeyboardEvent) => {
    // Only close if not persistent or if user explicitly allows
    if (!props.persistent) {
        handleClose()
    } else {
        // Prevent default escape behavior when persistent
        event.preventDefault()
        event.stopPropagation()
    }
}
</script>

<style scoped>
.generated-content-dialog :deep(.v-overlay__content) {
    margin: 24px;
    max-height: calc(100vh - 48px);
}

.dialog-card {
    border-radius: 12px;
    overflow: hidden;
}

.dialog-header {
    background: linear-gradient(135deg, rgb(var(--v-theme-success)) 0%, rgb(var(--v-theme-primary)) 100%);
    color: rgb(var(--v-theme-on-primary));
}

.dialog-content {
    max-height: 70vh;
    overflow-y: auto;
}

.content-display-card {
    border-radius: 8px;
    overflow: hidden;
}

.generated-text-container {
    background-color: #2d2d2d;
    color: #ffffff;
    padding: 24px;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.7;
}

.content-text {
    font-size: 0.95rem;
    color: #ffffff;
}

.content-text :deep(p) {
    margin-bottom: 1.2rem;
    color: #ffffff;
}

.content-text :deep(p:last-child) {
    margin-bottom: 0;
}

.stat-card {
    border-radius: 8px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card .v-icon {
    opacity: 0.8;
}

/* Ensure proper text color in dark container */
.generated-text-container * {
    color: #ffffff !important;
}

/* Custom scrollbar for dialog content */
.dialog-content::-webkit-scrollbar {
    width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
    background: transparent;
}

.dialog-content::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-surface), 0.3);
}

/* Button styling */
.v-btn {
    font-weight: 500;
    text-transform: none;
    border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
    .generated-content-dialog :deep(.v-overlay__content) {
        margin: 12px;
        max-height: calc(100vh - 24px);
    }

    .dialog-content {
        max-height: 60vh;
    }

    .generated-text-container {
        padding: 16px;
    }

    .stat-card .v-card-text {
        padding: 12px !important;
    }
}
</style>