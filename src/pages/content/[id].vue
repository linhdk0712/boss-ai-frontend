<template>
  <div class="content-detail-page">
    <!-- Loading State -->
    <v-container v-if="loadingDetail" fluid class="pa-6">
      <v-skeleton-loader type="article, actions" class="mx-auto" max-width="800" />
    </v-container>

    <!-- Content Detail -->
    <v-container v-else-if="currentContent" fluid class="pa-6">
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack" class="me-4">
              Back
            </v-btn>

            <div class="flex-grow-1">
              <h1 class="text-h4 font-weight-bold">{{ currentContent.title }}</h1>
              <div class="d-flex align-center mt-2">
                <v-chip :color="getContentTypeColor(currentContent.contentType)" variant="tonal" class="me-2">
                  {{ getContentTypeLabel(currentContent.contentType) }}
                </v-chip>

                <v-chip :color="getLanguageColor(currentContent.language)" variant="tonal" class="me-2">
                  {{ getLanguageLabel(currentContent.language) }}
                </v-chip>

                <v-chip :color="getStatusColor(currentContent.status)" variant="tonal">
                  <v-icon start size="small">{{ getStatusIcon(currentContent.status) }}</v-icon>
                  {{ currentContent.status }}
                </v-chip>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <v-btn variant="outlined" prepend-icon="mdi-pencil" @click="toggleEditMode">
                {{ isEditMode ? 'Cancel' : 'Edit' }}
              </v-btn>

              <v-btn color="primary" prepend-icon="mdi-refresh" @click="regenerateContent">
                Regenerate
              </v-btn>

              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
                </template>

                <v-list>
                  <v-list-item prepend-icon="mdi-content-copy" title="Copy Content" @click="copyContent" />
                  <v-list-item prepend-icon="mdi-video-plus" title="Create Video" @click="createVideo" />
                  <v-divider />
                  <v-list-item prepend-icon="mdi-delete" title="Delete" class="text-error" @click="confirmDelete" />
                </v-list>
              </v-menu>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <!-- Main Content -->
        <v-col cols="12" lg="8">
          <!-- Edit Form -->
          <v-card v-if="isEditMode" class="mb-4">
            <v-card-title>Edit Content</v-card-title>
            <v-card-text>
              <v-form ref="editForm">
                <v-text-field v-model="editForm.title" label="Title" :rules="[rules.required]" class="mb-4" />

                <v-textarea v-model="editForm.content" label="Original Content" rows="4" :rules="[rules.required]"
                  class="mb-4" />

                <v-textarea v-model="editForm.generatedContent" label="Generated Content" rows="8"
                  :rules="[rules.required]" />
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="cancelEdit">
                Cancel
              </v-btn>
              <v-btn color="primary" :loading="updating" @click="saveChanges">
                Save Changes
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- View Mode -->
          <div v-else>
            <!-- Original Content -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-text-box</v-icon>
                Original Input
              </v-card-title>
              <v-card-text>
                <div class="content-text">{{ currentContent.content }}</div>
              </v-card-text>
            </v-card>

            <!-- Generated Content -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2" color="success">mdi-auto-fix</v-icon>
                Generated Content

                <v-spacer />

                <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyContent">
                  Copy
                </v-btn>
              </v-card-title>
              <v-card-text>
                <div class="generated-content-text" v-html="formattedGeneratedContent" />
              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <!-- Sidebar -->
        <v-col cols="12" lg="4">
          <!-- Statistics -->
          <v-card class="mb-4">
            <v-card-title>Statistics</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-primary">{{ currentContent.wordCount }}</div>
                    <div class="text-caption">Words</div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-secondary">{{ currentContent.characterCount }}</div>
                    <div class="text-caption">Characters</div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-info">{{ currentContent.tokensUsed }}</div>
                    <div class="text-caption">Tokens</div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h5 text-warning">${{ currentContent.generationCost.toFixed(4) }}</div>
                    <div class="text-caption">Cost</div>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div class="text-center">
                <div class="text-h6">{{ formatProcessingTime(currentContent.processingTimeMs) }}</div>
                <div class="text-caption">Processing Time</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Metadata -->
          <v-card class="mb-4">
            <v-card-title>Details</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-if="currentContent.industry">
                  <v-list-item-title>Industry</v-list-item-title>
                  <v-list-item-subtitle>{{ getIndustryLabel(currentContent.industry) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="currentContent.tone">
                  <v-list-item-title>Tone</v-list-item-title>
                  <v-list-item-subtitle>{{ getToneLabel(currentContent.tone) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="currentContent.targetAudience">
                  <v-list-item-title>Target Audience</v-list-item-title>
                  <v-list-item-subtitle>{{ getTargetAudienceLabel(currentContent.targetAudience)
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Created</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(currentContent.createdAt) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="currentContent.updatedAt !== currentContent.createdAt">
                  <v-list-item-title>Updated</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(currentContent.updatedAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Error State -->
    <v-container v-else fluid class="pa-6">
      <v-card class="text-center pa-8" variant="outlined">
        <v-icon size="80" color="error" class="mb-4">
          mdi-alert-circle-outline
        </v-icon>
        <h3 class="text-h5 mb-2">Content Not Found</h3>
        <p class="text-body-1 text-medium-emphasis mb-4">
          The requested content could not be found or you don't have permission to view it.
        </p>
        <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="goBack">
          Go Back
        </v-btn>
      </v-card>
    </v-container>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="me-2">mdi-delete-alert</v-icon>
          Delete Content
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete "{{ currentContent?.title }}"? This action cannot be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbars -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000" location="top">
      <v-icon start>mdi-check</v-icon>
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      <v-icon start>mdi-alert</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useContentManagement } from '@/composables/useContentManagement'
import { useContentConfig } from '@/composables/useContentConfig'
import type { ContentSaveRequest } from '@/types/content'

// Router
const route = useRoute()
const router = useRouter()

// Composables
const {
  currentContent,
  loadingDetail,
  updating,
  deleting,
  error,
  updateError,
  deleteError,
  loadContentById,
  updateContent,
  deleteContent
} = useContentManagement()

const { findOptionByValue } = useContentConfig()

// UI State
const isEditMode = ref(false)
const deleteDialog = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Edit form
const editForm = ref<Partial<ContentSaveRequest>>({})
const editFormRef = ref()

// Computed properties
const contentId = computed(() => {
  const params = route.params as { id?: string }
  return params.id ? parseInt(params.id) : 0
})

const formattedGeneratedContent = computed(() => {
  if (!currentContent.value) return ''

  return currentContent.value.generatedContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'This field is required'
}

// Methods
const goBack = () => {
  router.push('/content/list')
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    cancelEdit()
  } else {
    startEdit()
  }
}

const startEdit = () => {
  if (!currentContent.value) return

  editForm.value = {
    title: currentContent.value.title,
    content: currentContent.value.content,
    generatedContent: currentContent.value.generatedContent,
    industry: currentContent.value.industry,
    contentType: currentContent.value.contentType,
    language: currentContent.value.language,
    tone: currentContent.value.tone,
    targetAudience: currentContent.value.targetAudience
  }

  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
  editForm.value = {}
}

const saveChanges = async () => {
  if (!currentContent.value || !editFormRef.value) return

  const { valid } = await editFormRef.value.validate()
  if (!valid) return

  const result = await updateContent(currentContent.value.id, editForm.value)

  if (result) {
    successMessage.value = 'Content updated successfully!'
    showSuccess.value = true
    isEditMode.value = false
  }
}

const regenerateContent = () => {
  if (!currentContent.value) return

  const queryParams = new URLSearchParams({
    content: currentContent.value.content,
    title: currentContent.value.title || '',
    industry: currentContent.value.industry || '',
    contentType: currentContent.value.contentType,
    language: currentContent.value.language,
    tone: currentContent.value.tone || '',
    targetAudience: currentContent.value.targetAudience || ''
  })
  router.push(`/content?${queryParams.toString()}`)
}

const copyContent = async () => {
  if (!currentContent.value) return

  try {
    const textToCopy = `${currentContent.value.title}\n\n${currentContent.value.generatedContent}`
    await navigator.clipboard.writeText(textToCopy)

    successMessage.value = 'Content copied to clipboard!'
    showSuccess.value = true
  } catch (error) {
    errorMessage.value = 'Failed to copy content'
    showError.value = true
  }
}

const createVideo = () => {
  // TODO: Implement video creation
  successMessage.value = 'Video creation feature coming soon!'
  showSuccess.value = true
}

const confirmDelete = () => {
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!currentContent.value) return

  const success = await deleteContent(currentContent.value.id)

  if (success) {
    successMessage.value = 'Content deleted successfully!'
    showSuccess.value = true
    deleteDialog.value = false

    // Navigate back to list after a short delay
    setTimeout(() => {
      router.push('/content/list')
    }, 1000)
  }
}

// Helper methods
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

const getContentTypeLabel = (value: string): string => {
  const option = findOptionByValue('contentType', value)
  return option?.displayLabel || value
}

const getLanguageLabel = (value: string): string => {
  const option = findOptionByValue('language', value)
  return option?.displayLabel || value
}

const getIndustryLabel = (value: string): string => {
  const option = findOptionByValue('industry', value)
  return option?.displayLabel || value
}

const getToneLabel = (value: string): string => {
  const option = findOptionByValue('tone', value)
  return option?.displayLabel || value
}

const getTargetAudienceLabel = (value: string): string => {
  const option = findOptionByValue('targetAudience', value)
  return option?.displayLabel || value
}

const getContentTypeColor = (contentType: string): string => {
  const colorMap: Record<string, string> = {
    'blog-post': 'primary',
    'social-media': 'secondary',
    'email': 'info',
    'product-description': 'success',
    'ad-copy': 'warning',
    'press-release': 'error',
    default: 'grey'
  }
  return colorMap[contentType] || colorMap.default
}

const getLanguageColor = (language: string): string => {
  const colorMap: Record<string, string> = {
    'vi': 'success',
    'en': 'primary',
    'zh': 'warning',
    'ja': 'info',
    'ko': 'secondary',
    default: 'grey'
  }
  return colorMap[language] || colorMap.default
}

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'success'
    case 'processing':
    case 'generating':
      return 'warning'
    case 'error':
    case 'failed':
      return 'error'
    default:
      return 'info'
  }
}

const getStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'mdi-check-circle'
    case 'processing':
    case 'generating':
      return 'mdi-loading'
    case 'error':
    case 'failed':
      return 'mdi-alert-circle'
    default:
      return 'mdi-information'
  }
}

// Watch for errors
watch([error, updateError, deleteError], ([err, updateErr, deleteErr]) => {
  const errorMsg = err || updateErr || deleteErr
  if (errorMsg) {
    errorMessage.value = errorMsg
    showError.value = true
  }
})

// Load content on mount
onMounted(() => {
  if (contentId.value) {
    loadContentById(contentId.value)
  }
})

// Page metadata
definePage({
  name: 'content-detail',
  meta: {
    title: 'Content Detail',
    requiresAuth: true
  }
})
</script>

<style scoped>
.content-detail-page {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-background));
}

.v-container {
  max-width: 1200px;
}

.content-text {
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-wrap;
}

.generated-content-text {
  line-height: 1.6;
  font-size: 1rem;
}

.generated-content-text :deep(p) {
  margin-bottom: 1rem;
}

.generated-content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.text-h4 {
  color: rgb(var(--v-theme-on-background));
}

.text-h5 {
  font-weight: 600;
}

.text-caption {
  opacity: 0.7;
  font-size: 0.75rem;
}

.v-chip {
  font-size: 0.8rem;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>