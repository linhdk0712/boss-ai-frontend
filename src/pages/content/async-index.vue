<template>
    <div class="async-content-generation-page">
        <!-- Compact Page Header -->
        <v-container fluid class="pa-6">
            <v-row>
                <v-col cols="12">
                    <div class="d-flex align-center mb-6">
                        <div>
                            <h3 class="text-h4 font-weight-bold">AI Content Generation</h3>
                            <p class="text-subtitle-1 text-medium-emphasis mb-0">
                                Create engaging content with AI-powered assistance
                            </p>
                        </div>
                        <v-spacer />
                        <!-- Quick Actions -->
                        <v-btn color="primary" prepend-icon="mdi-history" :to="{ name: 'content-list' }" class="me-2">
                            My Content
                        </v-btn>
                        <v-btn :color="showQueue ? 'secondary' : 'default'"
                            :prepend-icon="showQueue ? 'mdi-close' : 'mdi-format-list-bulleted'" variant="outlined"
                            @click="toggleQueue">
                            {{ showQueue ? 'Hide Queue' : 'Job Queue' }}
                            <v-badge v-if="hasActiveJobs && !showQueue" :content="activeJobs.length" color="primary"
                                inline />
                        </v-btn>
                    </div>
                </v-col>
            </v-row>

            <v-row>
                <!-- Configuration Panel - Left Side -->
                <v-col cols="12" md="4" lg="3" class="pa-3">
                    <ConfigurationPanel v-model:industry="form.industry" v-model:content-type="form.contentType"
                        v-model:language="form.language" v-model:tone="form.tone"
                        v-model:target-audience="form.targetAudience" :disabled="isAnyOperationRunning" />

                    <!-- Quick Tips Card -->
                    <v-card class="tips-card mt-4" variant="tonal" color="info">
                        <v-card-title class="d-flex align-center py-3">
                            <v-icon class="me-2" size="20">mdi-lightbulb-outline</v-icon>
                            <span class="text-body-1 font-weight-medium">Quick Tips</span>
                        </v-card-title>
                        <v-card-text class="py-3">
                            <ul class="tips-list text-body-2">
                                <li>Be specific about your content goals</li>
                                <li>Include target keywords if needed</li>
                                <li>Specify the desired length or format</li>
                                <li>Mention your brand voice or style</li>
                                <li>Use async mode for better multitasking</li>
                            </ul>
                        </v-card-text>
                    </v-card>
                </v-col>

                <!-- Content Generation Form - Center -->
                <v-col :cols="showQueue ? 6 : 8" :lg="showQueue ? 6 : 9" class="pa-3">
                    <AsyncContentGenerationForm v-model:content="form.content" v-model:title="form.title"
                        :sync-generating="syncGenerating" :async-generating="asyncGenerating" :error="generateError"
                        :disabled="isAnyOperationRunning" :active-jobs="activeJobs" :completed-jobs="completedJobs"
                        :queue-length="queueLength" :processing-jobs="processingJobs" @generate="handleGenerate"
                        @show-queue="showQueue = true" @view-result="handleViewResult" />
                </v-col>

                <!-- Job Queue Panel - Right Side (when visible) -->
                <v-col v-if="showQueue" cols="12" md="3" lg="3" class="pa-3">
                    <JobQueuePanel :active-jobs="activeJobs" :completed-jobs="completedJobs" :queue-length="queueLength"
                        :processing-jobs="processingJobs" :ws-connected="wsConnected" :polling-enabled="pollingEnabled"
                        @cancel-job="handleCancelJob" @retry-job="handleRetryJob"
                        @clear-completed="handleClearCompleted" @reconnect="handleReconnect" />
                </v-col>
            </v-row>
        </v-container>

        <!-- Generated Content Dialog -->
        <GeneratedContentDialog v-model="showContentDialog" :content="generatedContent" :loading="syncGenerating"
            :saving="saving" :creating-video="creatingVideo" :can-save="canSave" :can-create-video="canCreateVideo"
            :persistent="dialogPersistent" @save="handleSave" @create-video="handleCreateVideo"
            @generate-new="handleGenerateNew" @close="handleDialogClose" @toggle-persistent="handleTogglePersistent" />

        <!-- Job Result Dialog -->
        <v-dialog v-model="showJobResultDialog" max-width="800">
            <v-card v-if="selectedJobResult">
                <v-card-title class="d-flex align-center">
                    <v-icon :icon="selectedJobResult.type === 'content_generation' ? 'mdi-text' : 'mdi-video'"
                        class="me-2" />
                    Job Result
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" @click="showJobResultDialog = false" />
                </v-card-title>

                <v-card-text>
                    <div class="mb-4">
                        <div class="text-caption text-medium-emphasis mb-1">Status</div>
                        <v-chip :color="selectedJobResult.status === 'completed' ? 'success' : 'error'" size="small"
                            variant="tonal">
                            {{ selectedJobResult.status }}
                        </v-chip>
                    </div>

                    <div v-if="selectedJobResult.result" class="mb-4">
                        <div class="text-caption text-medium-emphasis mb-2">Generated Content</div>
                        <v-card variant="outlined">
                            <v-card-text>
                                <pre
                                    class="text-body-2">{{ selectedJobResult.result.generatedContent || selectedJobResult.result }}</pre>
                            </v-card-text>
                        </v-card>
                    </div>

                    <div v-if="selectedJobResult.error" class="mb-4">
                        <div class="text-caption text-medium-emphasis mb-2">Error Details</div>
                        <v-alert type="error" variant="tonal">
                            {{ selectedJobResult.error }}
                        </v-alert>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn v-if="selectedJobResult.status === 'failed'" color="primary"
                        @click="handleRetryJob(selectedJobResult.id)">
                        Retry Job
                    </v-btn>
                    <v-btn @click="showJobResultDialog = false">
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Job Notification Toast -->
        <JobNotificationToast v-model:show="showNotificationToast" :notification="currentNotification" :timeout="5000"
            @close="handleNotificationClose" />

        <!-- Global Error Snackbar -->
        <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
            <v-icon start>mdi-alert</v-icon>
            {{ errorMessage }}

            <template #actions>
                <v-btn variant="text" @click="showError = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>

        <!-- Success Snackbar -->
        <v-snackbar v-model="showSuccess" color="success" timeout="3000" location="top">
            <v-icon start>mdi-check</v-icon>
            {{ successMessage }}
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useContentConfig } from '@/composables/useContentConfig'
import { useContentGeneration } from '@/composables/useContentGeneration'
import { useAsyncContentGeneration } from '@/composables/useAsyncContentGeneration'
import { useJobNotifications } from '@/composables/useJobNotifications'
import type { ContentGenerationForm, ContentGenerateRequest } from '@/types/content'

// Components
import ConfigurationPanel from '@/components/content/ConfigurationPanel.vue'
import AsyncContentGenerationForm from '@/components/content/AsyncContentGenerationForm.vue'
import JobQueuePanel from '@/components/content/JobQueuePanel.vue'
import GeneratedContentDialog from '@/components/content/GeneratedContentDialog.vue'
import JobNotificationToast from '@/components/content/JobNotificationToast.vue'

// Composables
const { getDefaultLanguage } = useContentConfig()
const {
    generatedContent,
    generating: syncGenerating,
    saving,
    creatingVideo,
    generateError,
    saveError,
    videoError,
    canSave,
    canCreateVideo,
    generateContent: generateContentSync,
    saveContent,
    triggerWorkflow,
    clearErrors,
    clearContent
} = useContentGeneration()

const {
    activeJobs,
    completedJobs,
    jobHistory,
    isGenerating: asyncGenerating,
    isCreatingVideo: asyncCreatingVideo,
    hasActiveJobs,
    queueLength,
    processingJobs,
    wsConnected,
    pollingEnabled,
    generateContentAsync,
    createVideoAsync,
    cancelJob,
    retryJob,
    getJob,
    clearCompletedJobs
} = useAsyncContentGeneration()

const {
    currentToast: currentNotification,
    showToast: showNotificationToast,
    notifyJobCompletion,
    notifyJobProgress,
    notifySystem,
    markAsRead,
    hideCurrentToast
} = useJobNotifications()

// Form state
const form = ref<ContentGenerationForm>({
    content: '',
    industry: undefined,
    contentType: '',
    language: 'vi',
    tone: undefined,
    targetAudience: undefined,
    title: undefined
})

// UI state
const showQueue = ref(false)
const showError = ref(false)
const showSuccess = ref(false)
const showContentDialog = ref(false)
const showJobResultDialog = ref(false)
const dialogPersistent = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const selectedJobResult = ref<any>(null)

// Computed properties
const isAnyOperationRunning = computed(() =>
    syncGenerating.value || asyncGenerating.value || saving.value || creatingVideo.value || asyncCreatingVideo.value
)

const isFormValid = computed(() => {
    const content = form.value.content || ''
    const contentType = form.value.contentType || ''
    const language = form.value.language || ''

    return content.trim().length > 0 &&
        contentType.length > 0 &&
        language.length > 0
})

// Methods
const handleGenerate = async (useAsync: boolean) => {
    // Validate form
    const content = form.value.content || ''
    const contentType = form.value.contentType || ''
    const language = form.value.language || ''

    if (content.trim().length === 0) {
        errorMessage.value = 'Please enter your content ideas'
        showError.value = true
        return
    }

    if (contentType.length === 0) {
        errorMessage.value = 'Please select a content type from the configuration panel'
        showError.value = true
        return
    }

    if (language.length === 0) {
        errorMessage.value = 'Please select a language from the configuration panel'
        showError.value = true
        return
    }

    clearErrors()

    const request: ContentGenerateRequest = {
        content: form.value.content,
        industry: form.value.industry,
        contentType: form.value.contentType,
        language: form.value.language,
        tone: form.value.tone,
        targetAudience: form.value.targetAudience,
        title: form.value.title
    }

    try {
        if (useAsync) {
            // Generate asynchronously
            const jobId = await generateContentAsync(request)
            successMessage.value = 'Content generation started! Check the job queue for progress.'
            showSuccess.value = true
            showQueue.value = true // Show queue when async job starts
        } else {
            // Generate synchronously
            await generateContentSync(request)

            // Show dialog if content was generated successfully
            if (generatedContent.value && generatedContent.value.status !== 'FAILED') {
                showContentDialog.value = true
            }
        }
    } catch (error: any) {
        errorMessage.value = error.message || 'Failed to generate content'
        showError.value = true
    }
}

const handleSave = async (title: string) => {
    clearErrors()
    const result = await saveContent(title)

    if (result) {
        successMessage.value = 'Content saved successfully!'
        showSuccess.value = true
    }
}

const handleCreateVideo = async (title?: string) => {
    clearErrors()

    if (generatedContent.value) {
        try {
            // Use async video generation
            const jobId = await createVideoAsync({
                content: generatedContent.value.generatedContent,
                title: title || generatedContent.value.title,
                contentType: form.value.contentType,
                industry: form.value.industry,
                language: form.value.language,
                tone: form.value.tone,
                targetAudience: form.value.targetAudience
            })

            successMessage.value = 'Video generation started! Check the job queue for progress.'
            showSuccess.value = true
            showQueue.value = true
        } catch (error: any) {
            errorMessage.value = error.message || 'Failed to start video generation'
            showError.value = true
        }
    } else {
        // Fallback to sync video generation
        const result = await triggerWorkflow(title)

        if (result) {
            successMessage.value = 'Video creation workflow started!'
            showSuccess.value = true
        }
    }
}

const handleGenerateNew = () => {
    clearContent()
    showContentDialog.value = false
    form.value.content = ''
    form.value.title = ''
}

const handleDialogClose = () => {
    showContentDialog.value = false
}

const handleTogglePersistent = () => {
    dialogPersistent.value = !dialogPersistent.value
}

const handleCancelJob = async (jobId: string) => {
    try {
        await cancelJob(jobId)
        successMessage.value = 'Job cancelled successfully'
        showSuccess.value = true
    } catch (error: any) {
        errorMessage.value = error.message || 'Failed to cancel job'
        showError.value = true
    }
}

const handleRetryJob = async (jobId: string) => {
    try {
        const newJobId = await retryJob(jobId)
        successMessage.value = 'Job restarted successfully'
        showSuccess.value = true
        showJobResultDialog.value = false
    } catch (error: any) {
        errorMessage.value = error.message || 'Failed to retry job'
        showError.value = true
    }
}

const handleClearCompleted = () => {
    clearCompletedJobs()
    successMessage.value = 'Completed jobs cleared'
    showSuccess.value = true
}

const handleReconnect = () => {
    // Reconnection will be handled by the async content generation composable
    notifySystem('info', 'Reconnecting...', 'Attempting to reconnect to real-time updates')
}

const handleViewResult = (job: any) => {
    selectedJobResult.value = job
    showJobResultDialog.value = true
}

const handleNotificationClose = () => {
    if (currentNotification.value) {
        markAsRead(currentNotification.value.id)
    }
    hideCurrentToast()
}

const toggleQueue = () => {
    showQueue.value = !showQueue.value
}

// Watch for job completions and show notifications
watch(completedJobs, (newCompleted, oldCompleted) => {
    // Find newly completed jobs
    const newlyCompleted = newCompleted.filter(newJob =>
        !oldCompleted.some(oldJob => oldJob.id === newJob.id)
    )

    // Notify for each newly completed job
    newlyCompleted.forEach(job => {
        notifyJobCompletion(job)
    })
}, { deep: true })

// Watch for errors
watch([generateError, saveError, videoError], ([genErr, saveErr, vidErr]) => {
    const error = genErr || saveErr || vidErr
    if (error) {
        errorMessage.value = error
        showError.value = true
    }
})

// Initialize form with default language
onMounted(() => {
    const defaultLang = getDefaultLanguage()
    if (defaultLang) {
        form.value.language = defaultLang.value
    }
})

// Page metadata
definePage({
    name: 'content-async-index',
    meta: {
        title: 'Async AI Content Generation',
        requiresAuth: true,
        action: 'create',
        subject: 'Content'
    }
})
</script>

<style scoped>
.async-content-generation-page {
    min-height: 100vh;
    background-color: rgb(var(--v-theme-background));
}

.tips-list {
    padding-left: 1.2rem;
    margin: 0;
}

.tips-list li {
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

.tips-list li:last-child {
    margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 959px) {
    .async-content-generation-page .v-container {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}

/* Job result dialog content */
pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    margin: 0;
}
</style>