<template>
  <div class="content-generation-page">
    <!-- Compact Page Header -->
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <div>
              <h3 class="text-h4 font-weight-bold">AI Content Generation</h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                Create engaging content with asynchronous AI processing
              </p>
            </div>
            <v-spacer />
            <!-- Quick Actions -->
            <v-btn color="primary" prepend-icon="mdi-history" :to="{ name: 'content-list' }" class="me-2">
              My Content
            </v-btn>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <!-- Configuration Panel - Left Side -->
        <v-col cols="12" :md="showQueue ? 3 : 4" :lg="showQueue ? 3 : 3" class="pa-3">
          <ConfigurationPanel v-model:industry="form.industry" v-model:content-type="form.contentType"
            v-model:language="form.language" v-model:tone="form.tone" v-model:target-audience="form.targetAudience"
            :disabled="isGenerating || isCreatingVideo" />

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
                <li>Jobs are processed asynchronously for better performance</li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Content Generation Form - Center -->
        <v-col :cols="showQueue ? 6 : 8" :lg="showQueue ? 6 : 9" class="pa-3">
          <AsyncContentGenerationForm v-model:content="form.content" v-model:title="form.title" :sync-generating="false"
            :async-generating="isGenerating" :error="errorMessage" :disabled="isGenerating || isCreatingVideo"
            :active-jobs="activeJobs" :completed-jobs="completedJobs" @generate="handleGenerate" />

          <!-- Success/Error Notifications -->
          <v-alert v-if="showSuccess" type="success" variant="tonal" class="mt-4" closable
            @click:close="showSuccess = false">
            {{ successMessage }}
          </v-alert>

          <v-alert v-if="showError" type="error" variant="tonal" class="mt-4" closable @click:close="showError = false">
            {{ errorMessage }}
          </v-alert>
        </v-col>

        <!-- Job Queue Panel - Right Side -->
        <v-col v-if="showQueue" cols="12" md="3" lg="3" class="pa-3">
          <JobQueuePanel :active-jobs="activeJobs" :completed-jobs="completedJobs" :queue-length="queueLength"
            :processing-jobs="processingJobs" :ws-connected="wsConnected" :polling-enabled="pollingEnabled"
            @cancel-job="handleCancelJob" @retry-job="handleRetryJob" @clear-completed="clearCompletedJobs"
            @reconnect="handleReconnect" />
        </v-col>
      </v-row>
    </v-container>


    <!-- Help Dialog -->
    <v-dialog v-model="showHelp" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-help-circle</v-icon>
          How to Use AI Content Generation
        </v-card-title>

        <v-card-text>
          <v-stepper v-model="helpStep" alt-labels class="elevation-0">
            <v-stepper-header>
              <v-stepper-item :complete="helpStep > 1" :value="1" title="Configure" />
              <v-divider />
              <v-stepper-item :complete="helpStep > 2" :value="2" title="Input" />
              <v-divider />
              <v-stepper-item :complete="helpStep > 3" :value="3" title="Generate" />
              <v-divider />
              <v-stepper-item :value="4" title="Save" />
            </v-stepper-header>

            <v-stepper-window>
              <v-stepper-window-item :value="1">
                <div class="pa-4">
                  <h3>Step 1: Configure Settings</h3>
                  <p>Select your industry, content type, language, tone, and target audience to customize the AI
                    generation.</p>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <div class="pa-4">
                  <h3>Step 2: Input Your Ideas</h3>
                  <p>Describe what content you want to generate. Be specific about your goals, keywords, and desired
                    format.</p>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <div class="pa-4">
                  <h3>Step 3: Generate Content</h3>
                  <p>Click "Generate Content" to create AI-powered content based on your configuration and input.</p>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="4">
                <div class="pa-4">
                  <h3>Step 4: Save and Use</h3>
                  <p>Save your generated content to your library or create videos from your content.</p>
                </div>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>

        <v-card-actions>
          <v-btn v-if="helpStep > 1" variant="text" @click="helpStep--">
            Previous
          </v-btn>

          <v-spacer />

          <v-btn v-if="helpStep < 4" color="primary" @click="helpStep++">
            Next
          </v-btn>

          <v-btn v-else color="primary" @click="showHelp = false">
            Got it!
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <!-- Generated Content Dialog -->
    <GeneratedContentDialog v-if="selectedJobResult" v-model="showContentDialog" :content="selectedJobResult"
      :loading="false" :saving="false" :creating-video="isCreatingVideo" :can-save="true" :can-create-video="true"
      :persistent="dialogPersistent" @create-video="handleCreateVideo" @generate-new="handleGenerateNew"
      @close="handleDialogClose" @toggle-persistent="handleTogglePersistent" />
  </div>
</template>

<script setup lang="ts">
import { useContentConfig } from '@/composables/useContentConfig'
import { useAsyncContentGeneration } from '@/composables/useAsyncContentGeneration'
import { useJobNotifications } from '@/composables/useJobNotifications'
import type { ContentGenerationForm, ContentGenerateRequest } from '@/types/content'
import ConfigurationPanel from '@/components/content/ConfigurationPanel.vue'
import AsyncContentGenerationForm from '@/components/content/AsyncContentGenerationForm.vue'
import JobQueuePanel from '@/components/content/JobQueuePanel.vue'
import GeneratedContentDialog from '@/components/content/GeneratedContentDialog.vue'

// Composables
const { getDefaultLanguage } = useContentConfig()

// Async content generation
const {
  activeJobs,
  completedJobs,
  isGenerating,
  isCreatingVideo,
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

// Job notifications
const {
  notifications,
  notifyJobComplete,
  notifyJobFailed,
  notifySystem,
  clearNotifications
} = useJobNotifications()

// Local error/success state
const showError = ref(false)
const errorMessage = ref('')
const showSuccess = ref(false)
const successMessage = ref('')

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
const showHelp = ref(false)
const helpStep = ref(1)
const showQueue = ref(true) // Show job queue panel
const showContentDialog = ref(false)
const dialogPersistent = ref(true) // Control dialog persistent behavior
const selectedJobResult = ref<any>(null)

// Computed properties
const persistentTooltipText = computed(() => {
  return dialogPersistent.value
    ? 'Dialog Persistent (Click outside won\'t close)'
    : 'Dialog Non-Persistent (Click outside to close)'
})

const isFormValid = computed(() => {
  const content = form.value.content || ''
  const contentType = form.value.contentType || ''
  const language = form.value.language || ''

  return content.trim().length > 0 &&
    contentType.length > 0 &&
    language.length > 0
})



// Methods
const clearErrors = () => {
  showError.value = false
  errorMessage.value = ''
  showSuccess.value = false
  successMessage.value = ''
}

const handleGenerate = async () => {

  // Check individual requirements and provide specific error messages
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
    // Generate content asynchronously
    const jobId = await generateContentAsync(request)

    // Show success notification
    successMessage.value = 'Content generation started! You can monitor progress in the job queue.'
    showSuccess.value = true

    // Clear form after successful submission
    form.value.content = ''

  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to start content generation'
    showError.value = true
  }
}

// Job management handlers
const handleCancelJob = async (jobId: string) => {
  try {
    await cancelJob(jobId)
    notifySystem('info', 'Job Cancelled', `Job ${jobId} has been cancelled`)
  } catch (error: any) {
    notifySystem('error', 'Cancel Failed', error.message || 'Failed to cancel job')
  }
}

const handleRetryJob = async (jobId: string) => {
  try {
    const newJobId = await retryJob(jobId)
    notifySystem('success', 'Job Retried', `Job retried with new ID: ${newJobId}`)
  } catch (error: any) {
    notifySystem('error', 'Retry Failed', error.message || 'Failed to retry job')
  }
}

const handleJobComplete = (job: any) => {
  if (job.result) {
    selectedJobResult.value = job.result
    showContentDialog.value = true
  }
}

const handleReconnect = () => {
  // Reconnection will be handled by the async content generation composable
  notifySystem('info', 'Reconnecting...', 'Attempting to reconnect to real-time updates')
}



const handleCreateVideo = async (content: any) => {
  try {
    if (content && content.generatedContent) {
      // Use async video generation
      const jobId = await createVideoAsync({
        content: content.generatedContent,
        title: content.title || 'Generated Video',
        contentType: 'video'
      })

      notifySystem('success', 'Video Generation Started', 'Video creation job has been queued')
    }
  } catch (error: any) {
    notifySystem('error', 'Video Generation Failed', error.message || 'Failed to start video generation')
  }
}

const handleGenerateNew = () => {
  // Reset form for new generation
  form.value.content = ''
  form.value.title = ''
  showContentDialog.value = false
}

const handleDialogClose = () => {
  showContentDialog.value = false
  selectedJobResult.value = null
}

const handleTogglePersistent = () => {
  dialogPersistent.value = !dialogPersistent.value
}

// Watch for job failures to show errors
watch(activeJobs, (jobs) => {
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'failed' && job.error) {
      errorMessage.value = job.error
      showError.value = true
      break
    }
  }
}, { deep: true })

// Watch for completed jobs to show results
watch(completedJobs, (newJobs) => {
  // Check for newly completed content generation jobs
  for (const [jobId, job] of newJobs.entries()) {
    if (job.type === 'content_generation' && job.status === 'completed' && job.result) {
      // Auto-show dialog for completed content generation
      selectedJobResult.value = job.result
      showContentDialog.value = true

      // Notify user
      notifyJobComplete(job)
      break // Only show one at a time
    }
  }
}, { deep: true })

// Initialize form with default language
onMounted(() => {
  const defaultLang = getDefaultLanguage()
  if (defaultLang) {
    form.value.language = defaultLang.value
  }
})

// Page metadata
definePage({
  name: 'content-index',
  meta: {
    title: 'AI Content Generation (Async)',
    requiresAuth: true,
    action: 'create',
    subject: 'Content'
  }
})
</script>

<style scoped>
.content-generation-page {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-background));
}

.page-header {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
}

.main-container {
  flex: 1;
  max-width: 1400px;
  height: calc(100vh - 80px);
  padding: 0 !important;
}

.configuration-sidebar {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

.content-main {
  height: 100%;
  overflow-y: auto;
  padding-left: 8px;
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

.v-stepper {
  background: transparent !important;
  box-shadow: none !important;
}

.v-stepper-header {
  box-shadow: none !important;
}

/* Responsive adjustments */
@media (max-width: 959px) {
  .main-container {
    height: auto;
    min-height: calc(100vh - 80px);
  }

  .configuration-sidebar,
  .content-main {
    height: auto;
    overflow-y: visible;
    padding-right: 0;
    padding-left: 0;
  }

  .page-header .v-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Scrollbar styling */
.configuration-sidebar::-webkit-scrollbar,
.content-main::-webkit-scrollbar {
  width: 6px;
}

.configuration-sidebar::-webkit-scrollbar-track,
.content-main::-webkit-scrollbar-track {
  background: transparent;
}

.configuration-sidebar::-webkit-scrollbar-thumb,
.content-main::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}

.configuration-sidebar::-webkit-scrollbar-thumb:hover,
.content-main::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>