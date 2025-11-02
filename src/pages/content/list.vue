<template>
  <div class="content-list-page">
    <!-- Page Header -->
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <v-icon size="40" class="me-3" color="primary">mdi-folder-multiple</v-icon>
            <div>
              <h1 class="text-h4 font-weight-bold">My Content Library</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                Manage and organize your AI-generated content
              </p>
            </div>

            <v-spacer />

            <!-- Quick Actions -->
            <v-btn color="primary" prepend-icon="mdi-plus" to="/content" class="me-2">
              Generate New
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Filters and Search -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="Search content..." clearable
            @input="debouncedSearch" />
        </v-col>

        <v-col cols="12" md="3">
          <v-select v-model="selectedContentType" :items="contentTypeOptions" label="Content Type" clearable
            @update:model-value="applyFilters" />
        </v-col>

        <v-col cols="12" md="3">
          <v-select v-model="selectedLanguage" :items="languageOptions" label="Language" clearable
            @update:model-value="applyFilters" />
        </v-col>

        <v-col cols="12" md="2">
          <v-btn variant="outlined" prepend-icon="mdi-filter-off" @click="clearAllFilters" block>
            Clear
          </v-btn>
        </v-col>
      </v-row>

      <!-- Content Grid -->
      <v-row v-if="!loading && hasContent">
        <v-col v-for="content in filteredContent" :key="content.id" cols="12" md="6" lg="4">
          <ContentCard :content="content" @view="viewContent" @edit="editContent" @delete="confirmDelete"
            @regenerate="regenerateFromContent" />
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-else-if="!loading && !hasContent">
        <v-col cols="12">
          <v-card class="text-center pa-8" variant="outlined">
            <v-icon size="80" color="grey-lighten-1" class="mb-4">
              mdi-folder-open-outline
            </v-icon>
            <h3 class="text-h5 mb-2">No Content Found</h3>
            <p class="text-body-1 text-medium-emphasis mb-4">
              {{ searchQuery || selectedContentType || selectedLanguage
                ? 'No content matches your current filters.'
                : 'You haven\'t created any content yet.' }}
            </p>
            <v-btn v-if="!searchQuery && !selectedContentType && !selectedLanguage" color="primary"
              prepend-icon="mdi-plus" to="/content">
              Create Your First Content
            </v-btn>
            <v-btn v-else variant="outlined" prepend-icon="mdi-filter-off" @click="clearAllFilters">
              Clear Filters
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col v-for="i in 6" :key="i" cols="12" md="6" lg="4">
          <v-skeleton-loader type="card" class="mb-4" />
        </v-col>
      </v-row>

      <!-- Pagination -->
      <v-row v-if="hasContent && totalPages > 1" class="mt-4">
        <v-col cols="12">
          <div class="d-flex justify-center">
            <v-pagination v-model="currentPageModel" :length="totalPages" :total-visible="7"
              @update:model-value="goToPage" />
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="me-2">mdi-delete-alert</v-icon>
          Delete Content
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete "{{ contentToDelete?.title }}"? This action cannot be undone.
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

    <!-- Error Snackbar -->
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
import { useDebounceFn } from '@vueuse/core'
import { useContentManagement } from '@/composables/useContentManagement'
import { useContentConfig } from '@/composables/useContentConfig'
import type { ContentGenerationDto } from '@/types/content'
import ContentCard from '@/components/content/ContentCard.vue'

// Router
const router = useRouter()

// Composables
const {
  loading,
  deleting,
  error,
  hasContent,
  totalPages,
  currentPage,
  filteredContent,
  searchQuery,
  selectedContentType,
  selectedLanguage,
  loadContentList,
  deleteContent,
  goToPage,
  applyFilters,
  clearFilters
} = useContentManagement()

const {
  activeContentTypeOptions,
  activeLanguageOptions
} = useContentConfig()

// UI state
const deleteDialog = ref(false)
const contentToDelete = ref<ContentGenerationDto | null>(null)
const showError = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed properties
const currentPageModel = computed({
  get: () => currentPage.value + 1, // Convert 0-based to 1-based
  set: (value) => goToPage(value - 1) // Convert 1-based to 0-based
})

const contentTypeOptions = computed(() =>
  activeContentTypeOptions.value.map(option => ({
    title: option.displayLabel,
    value: option.value
  }))
)

const languageOptions = computed(() =>
  activeLanguageOptions.value.map(option => ({
    title: option.displayLabel,
    value: option.value
  }))
)

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

// Methods
const viewContent = (content: ContentGenerationDto) => {
  router.push(`/content/${content.id}`)
}

const editContent = (content: ContentGenerationDto) => {
  router.push(`/content/${content.id}`)
}

const confirmDelete = (content: ContentGenerationDto) => {
  contentToDelete.value = content
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!contentToDelete.value) return

  const success = await deleteContent(contentToDelete.value.id)

  if (success) {
    successMessage.value = 'Content deleted successfully!'
    showSuccess.value = true
    deleteDialog.value = false
    contentToDelete.value = null
  }
}

const regenerateFromContent = (content: ContentGenerationDto) => {
  // Navigate to generation page with pre-filled data
  const queryParams = new URLSearchParams({
    content: content.content,
    title: content.title || '',
    industry: content.industry || '',
    contentType: content.contentType,
    language: content.language,
    tone: content.tone || '',
    targetAudience: content.targetAudience || ''
  })
  router.push(`/content?${queryParams.toString()}`)
}

const clearAllFilters = () => {
  clearFilters()
  applyFilters()
}

// Watch for errors
watch(error, (err) => {
  if (err) {
    errorMessage.value = err
    showError.value = true
  }
})

// Load content on mount
onMounted(() => {
  loadContentList()
})

// Page metadata
definePage({
  name: 'content-list',
  meta: {
    title: 'My Content Library',
    requiresAuth: true
  }
})
</script>

<style scoped>
.content-list-page {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-background));
}

.v-container {
  max-width: 1400px;
}

.text-h4 {
  color: rgb(var(--v-theme-on-background));
}

.text-subtitle-1 {
  color: rgb(var(--v-theme-on-background-variant));
}

.v-skeleton-loader {
  height: 300px;
}
</style>