<template>
  <div class="content-list-page">
    <!-- Page Header -->
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <div>
              <h3 class="text-h4 font-weight-bold">My Content Library</h3>
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

      <!-- Data Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              Content Library
            </v-card-title>

            <!-- Table View -->
            <v-data-table v-if="viewMode === 'table'" :headers="tableHeaders" :items="filteredContent"
              :loading="loading" :items-per-page="pagination.size" :page="currentPageModel"
              :items-length="pagination.total" :no-data-text="getNoDataText()" class="elevation-0" item-key="id"
              @update:page="goToPage" @update:items-per-page="changePageSize" @click:row="handleRowClick">
              <!-- Title Column -->
              <template #item.title="{ item }">
                <div class="d-flex align-center">
                  <div>
                    <div class="text-subtitle-2 font-weight-medium">
                      {{ truncateText(item.title, 50) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      ID: {{ item.id }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Content Type Column -->
              <template #item.contentType="{ item }">
                <v-chip :color="getContentTypeColor(item.contentType)" size="small" variant="tonal">
                  {{ getContentTypeLabel(item.contentType) }}
                </v-chip>
              </template>

              <!-- Language Column -->
              <template #item.language="{ item }">
                <v-chip :color="getLanguageColor(item.language)" size="small" variant="tonal">
                  {{ getLanguageLabel(item.language) }}
                </v-chip>
              </template>

              <!-- Status Column -->
              <template #item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  <v-icon start size="small">{{ getStatusIcon(item.status) }}</v-icon>
                  {{ item.status }}
                </v-chip>
              </template>

              <!-- Generated Content Preview -->
              <template #item.generatedContent="{ item }">
                <div class="content-preview-wrapper">
                  <div class="content-preview">
                    {{ truncateText(item.generatedContent, 120) }}
                  </div>
                </div>
              </template>

              <!-- Statistics Column -->
              <template #item.stats="{ item }">
                <div class="text-center">
                  <div class="text-caption">
                    <strong>{{ item.wordCount }}</strong> words
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.characterCount }} chars
                  </div>
                </div>
              </template>

              <!-- Created Date Column -->
              <template #item.createdAt="{ item }">
                <div class="text-caption">
                  {{ formatDate(item.createdAt) }}
                </div>
              </template>

              <!-- Actions Column -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center justify-center action-buttons">
                  <v-btn size="small" variant="text" class="action-btn" @click.stop="viewContent(item)">
                    <v-icon size="18">tabler-eye</v-icon>
                  </v-btn>

                  <v-btn size="small" variant="text" class="action-btn" @click.stop="editContent(item)">
                    <v-icon size="18">tabler-pencil</v-icon>
                  </v-btn>

                  <v-btn size="small" variant="text" color="primary" class="action-btn"
                    @click.stop="regenerateFromContent(item)">
                    <v-icon size="18">tabler-refresh</v-icon>
                  </v-btn>

                  <v-menu>
                    <template #activator="{ props }">
                      <v-btn size="small" variant="text" class="action-btn" v-bind="props" @click.stop>
                        <v-icon size="18">tabler-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item prepend-icon="tabler-history" title="Version History" @click="viewVersions(item)" />
                      <v-list-item prepend-icon="tabler-copy" title="Copy Content" @click="copyContent(item)" />
                      <v-list-item prepend-icon="tabler-video-plus" title="Create Video" @click="createVideo(item)" />
                      <v-divider />
                      <v-list-item prepend-icon="tabler-trash" title="Delete" class="text-error"
                        @click="confirmDelete(item)" />
                    </v-list>
                  </v-menu>
                </div>
              </template>

              <!-- Loading slot -->
              <template #loading>
                <v-skeleton-loader type="table-row@10" />
              </template>

              <!-- No data slot -->
              <template #no-data>
                <div class="text-center pa-8">
                  <v-icon size="80" color="grey-lighten-1" class="mb-4">
                    mdi-folder-open-outline
                  </v-icon>
                  <h3 class="text-h6 mb-2">{{ getNoDataText() }}</h3>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    {{ getNoDataDescription() }}
                  </p>
                  <v-btn v-if="!hasActiveFilters" color="primary" prepend-icon="mdi-plus" to="/content">
                    Create Your First Content
                  </v-btn>
                  <v-btn v-else variant="outlined" prepend-icon="mdi-filter-off" @click="clearAllFilters">
                    Clear Filters
                  </v-btn>
                </div>
              </template>
            </v-data-table>

            <!-- Grid View (Original Cards) -->
            <div v-else-if="viewMode === 'grid'">
              <!-- Content Grid -->
              <v-row v-if="!loading && hasContent" class="pa-4">
                <v-col v-for="content in filteredContent" :key="content.id" cols="12" md="6" lg="4">
                  <ContentCard :content="content" @view="viewContent" @edit="editContent" @delete="confirmDelete"
                    @regenerate="regenerateFromContent" @create-video="createVideo" />
                </v-col>
              </v-row>

              <!-- Empty State for Grid -->
              <div v-else-if="!loading && !hasContent" class="pa-8">
                <div class="text-center">
                  <v-icon size="80" color="grey-lighten-1" class="mb-4">
                    mdi-folder-open-outline
                  </v-icon>
                  <h3 class="text-h5 mb-2">{{ getNoDataText() }}</h3>
                  <p class="text-body-1 text-medium-emphasis mb-4">
                    {{ getNoDataDescription() }}
                  </p>
                  <v-btn v-if="!hasActiveFilters" color="primary" prepend-icon="mdi-plus" to="/content">
                    Create Your First Content
                  </v-btn>
                  <v-btn v-else variant="outlined" prepend-icon="mdi-filter-off" @click="clearAllFilters">
                    Clear Filters
                  </v-btn>
                </div>
              </div>

              <!-- Loading State for Grid -->
              <v-row v-if="loading" class="pa-4">
                <v-col v-for="i in 6" :key="i" cols="12" md="6" lg="4">
                  <v-skeleton-loader type="card" class="mb-4" />
                </v-col>
              </v-row>

              <!-- Pagination for Grid View -->
              <div v-if="hasContent && totalPages > 1" class="d-flex justify-center pa-4">
                <v-pagination v-model="currentPageModel" :length="totalPages" :total-visible="7"
                  @update:model-value="goToPage" />
              </div>
            </div>
          </v-card>
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
          <v-icon class="me-2">tabler-alert-triangle</v-icon>
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

    <!-- View Content Dialog -->
    <v-dialog v-model="viewDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">tabler-eye</v-icon>
          <span>View Content</span>
          <v-spacer />
          <v-btn icon="tabler-x" variant="text" @click="viewDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text v-if="contentToView" class="pa-6">
          <!-- Content Header -->
          <div class="mb-6">
            <h2 class="text-h5 mb-2">{{ contentToView.title }}</h2>
            <div class="d-flex gap-2 mb-4">
              <v-chip :color="getContentTypeColor(contentToView.contentType)" variant="tonal" size="small">
                {{ getContentTypeLabel(contentToView.contentType) }}
              </v-chip>
              <v-chip :color="getLanguageColor(contentToView.language)" variant="tonal" size="small">
                {{ getLanguageLabel(contentToView.language) }}
              </v-chip>
              <v-chip :color="getStatusColor(contentToView.status)" variant="tonal" size="small">
                <v-icon start size="small">{{ getStatusIcon(contentToView.status) }}</v-icon>
                {{ contentToView.status }}
              </v-chip>
            </div>
          </div>

          <!-- Generated Content -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3 d-flex align-center">
              <v-icon class="me-2" color="success">tabler-sparkles</v-icon>
              Generated Content
            </h3>
            <v-card variant="outlined" class="pa-4">
              <div class="generated-content-display" v-html="formattedGeneratedContent" />
            </v-card>
          </div>

          <!-- Statistics -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">Statistics</h3>
            <v-row>
              <v-col cols="3">
                <v-card variant="outlined" class="text-center pa-3">
                  <div class="text-h6 text-primary">{{ contentToView.wordCount }}</div>
                  <div class="text-caption">Words</div>
                </v-card>
              </v-col>
              <v-col cols="3">
                <v-card variant="outlined" class="text-center pa-3">
                  <div class="text-h6 text-secondary">{{ contentToView.characterCount }}</div>
                  <div class="text-caption">Characters</div>
                </v-card>
              </v-col>
              <v-col cols="3">
                <v-card variant="outlined" class="text-center pa-3">
                  <div class="text-h6 text-info">{{ contentToView.tokensUsed || 'N/A' }}</div>
                  <div class="text-caption">Tokens</div>
                </v-card>
              </v-col>
              <v-col cols="3">
                <v-card variant="outlined" class="text-center pa-3">
                  <div class="text-h6 text-warning">{{ contentToView.generationCost ?
                    `$${contentToView.generationCost.toFixed(4)}` : 'N/A' }}</div>
                  <div class="text-caption">Cost</div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Metadata -->
          <div>
            <h3 class="text-h6 mb-3">Details</h3>
            <v-list density="compact">
              <v-row>
                <v-col cols="3">
                  <v-list-item v-if="contentToView.industry">
                    <v-list-item-title>Industry</v-list-item-title>
                    <v-list-item-subtitle>{{ contentToView.industry }}</v-list-item-subtitle>
                  </v-list-item>
                </v-col>
                <v-col cols="3">
                  <v-list-item v-if="contentToView.tone">
                    <v-list-item-title>Tone</v-list-item-title>
                    <v-list-item-subtitle>{{ contentToView.tone }}</v-list-item-subtitle>
                  </v-list-item>
                </v-col>
                <v-col cols="3">
                  <v-list-item v-if="contentToView.targetAudience">
                    <v-list-item-title>Target Audience</v-list-item-title>
                    <v-list-item-subtitle>{{ contentToView.targetAudience }}</v-list-item-subtitle>
                  </v-list-item>
                </v-col>
                <v-col cols="3">
                  <v-list-item>
                    <v-list-item-title>Created</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(contentToView.createdAt) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-col>
              </v-row>




              <!-- <v-list-item v-if="contentToView.updatedAt !== contentToView.createdAt">
                <v-list-item-title>Updated</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(contentToView.updatedAt) }}</v-list-item-subtitle>
              </v-list-item> -->
            </v-list>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-btn prepend-icon="tabler-copy" variant="text" @click="copyContent(contentToView!)">
            Copy Content
          </v-btn>
          <v-btn prepend-icon="tabler-pencil" variant="text" color="primary"
            @click="editContent(contentToView!); viewDialog = false">
            Edit
          </v-btn>
          <v-btn prepend-icon="tabler-video-plus" variant="text" color="secondary" @click="createVideo(contentToView!)">
            Create Video
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Content Dialog -->
    <v-dialog v-model="editDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">tabler-pencil</v-icon>
          Edit Content
          <v-spacer />
          <v-btn icon="tabler-x" variant="text" @click="cancelEdit" />
        </v-card-title>

        <v-divider />

        <v-card-text v-if="contentToEdit" class="pa-6">
          <v-form v-model="editFormValid">
            <v-row>
              <!-- Title -->
              <v-col cols="12">
                <v-text-field v-model="editForm.title" label="Title" :rules="[v => !!v || 'Title is required']"
                  required />
              </v-col>

              <!-- Content Type -->
              <v-col cols="12" md="4">
                <v-select v-model="editForm.contentType" :items="contentTypeOptions" label="Content Type"
                  :rules="[v => !!v || 'Content type is required']" required />
              </v-col>

              <!-- Language -->
              <v-col cols="12" md="4">
                <v-select v-model="editForm.language" :items="languageOptions" label="Language"
                  :rules="[v => !!v || 'Language is required']" required />
              </v-col>

              <!-- Tone -->
              <v-col cols="12" md="4">
                <v-text-field v-model="editForm.tone" label="Tone" />
              </v-col>

              <!-- Industry -->
              <v-col cols="12" md="6">
                <v-text-field v-model="editForm.industry" label="Industry" />
              </v-col>

              <!-- Target Audience -->
              <v-col cols="12" md="6">
                <v-text-field v-model="editForm.targetAudience" label="Target Audience" />
              </v-col>

              <!-- Generated Content -->
              <v-col cols="12">
                <v-textarea v-model="editForm.generatedContent" label="Generated Content" rows="12"
                  :rules="[v => !!v || 'Content is required']" required />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-btn variant="text" @click="cancelEdit">
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="updating" :disabled="!editFormValid" @click="saveEdit">
            Save Changes
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
import { useVideoProgress } from '@/composables/useVideoProgress'
import { contentService } from '@/services/contentService'
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
  pagination,
  loadContentList,
  deleteContent,
  goToPage,
  changePageSize,
  applyFilters,
  clearFilters
} = useContentManagement()

const {
  activeContentTypeOptions,
  activeLanguageOptions
} = useContentConfig()

const { addVideoJob } = useVideoProgress()

// UI state
const deleteDialog = ref(false)
const viewDialog = ref(false)
const editDialog = ref(false)
const contentToDelete = ref<ContentGenerationDto | null>(null)
const contentToView = ref<ContentGenerationDto | null>(null)
const contentToEdit = ref<ContentGenerationDto | null>(null)
const showError = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const viewMode = ref<'table' | 'grid'>('table')

// Edit form state
const editForm = ref<Partial<ContentGenerationDto>>({})
const editFormValid = ref(false)

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

// Table configuration
const tableHeaders = computed(() => [
  { title: 'Title', key: 'title', sortable: true },
  { title: 'Type', key: 'contentType', sortable: true },
  { title: 'Language', key: 'language', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Content Preview', key: 'generatedContent', sortable: false },
  { title: 'Statistics', key: 'stats', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
])

// Filter state
const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedContentType.value || selectedLanguage.value)
})

const formattedGeneratedContent = computed(() => {
  if (!contentToView.value?.generatedContent) return ''

  return contentToView.value.generatedContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

// Methods
const viewContent = (content: ContentGenerationDto) => {
  contentToView.value = content
  viewDialog.value = true
}

const viewVersions = (content: ContentGenerationDto) => {
  router.push({ name: 'content-versions-id', params: { id: content.id } })
}

const editContent = (content: ContentGenerationDto) => {
  contentToEdit.value = content
  editForm.value = {
    id: content.id,
    title: content.title,
    generatedContent: content.generatedContent,
    contentType: content.contentType,
    language: content.language,
    tone: content.tone,
    targetAudience: content.targetAudience,
    industry: content.industry
  }
  editDialog.value = true
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
  const queryParams = new URLSearchParams()

  if (content.content) queryParams.append('content', content.content)
  if (content.title) queryParams.append('title', content.title)
  if (content.industry) queryParams.append('industry', content.industry)
  if (content.contentType) queryParams.append('contentType', content.contentType)
  if (content.language) queryParams.append('language', content.language)
  if (content.tone) queryParams.append('tone', content.tone)
  if (content.targetAudience) queryParams.append('targetAudience', content.targetAudience)

  const queryString = queryParams.toString()
  router.push(queryString ? `/content?${queryString}` : '/content')
}

const clearAllFilters = () => {
  clearFilters()
  applyFilters()
}

// Table helper methods
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getContentTypeColor = (contentType: string): string => {
  const colorMap: Record<string, string> = {
    'blog_post': 'primary',
    'social_media': 'secondary',
    'email': 'success',
    'article': 'info',
    'marketing': 'warning',
    'default': 'grey'
  }
  return colorMap[contentType] || colorMap.default
}

const getContentTypeLabel = (contentType: string): string => {
  const labelMap: Record<string, string> = {
    'blog_post': 'Blog Post',
    'social_media': 'Social Media',
    'email': 'Email',
    'article': 'Article',
    'marketing': 'Marketing',
    'default': contentType
  }
  return labelMap[contentType] || contentType
}

const getLanguageColor = (language: string): string => {
  const colorMap: Record<string, string> = {
    'en': 'blue',
    'vi': 'green',
    'es': 'orange',
    'fr': 'purple',
    'default': 'grey'
  }
  return colorMap[language] || colorMap.default
}

const getLanguageLabel = (language: string): string => {
  const labelMap: Record<string, string> = {
    'en': 'English',
    'vi': 'Vietnamese',
    'es': 'Spanish',
    'fr': 'French',
    'default': language
  }
  return labelMap[language] || language
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'COMPLETED': 'success',
    'FAILED': 'error',
    'PROCESSING': 'warning',
    'DRAFT': 'info',
    'default': 'grey'
  }
  return colorMap[status] || colorMap.default
}

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    'COMPLETED': 'mdi-check-circle',
    'FAILED': 'mdi-alert-circle',
    'PROCESSING': 'mdi-clock-outline',
    'DRAFT': 'mdi-file-document-outline',
    'default': 'mdi-help-circle'
  }
  return iconMap[status] || iconMap.default
}

const getNoDataText = (): string => {
  if (hasActiveFilters.value) {
    return 'No Content Matches Filters'
  }
  return 'No Content Found'
}

const getNoDataDescription = (): string => {
  if (hasActiveFilters.value) {
    return 'Try adjusting your search criteria or clearing the filters to see more content.'
  }
  return 'You haven\'t created any content yet. Start by generating your first piece of content.'
}

// Table event handlers
const handleRowClick = (event: Event, { item }: { item: ContentGenerationDto }) => {
  viewContent(item)
}

// Additional action methods
const copyContent = async (content: ContentGenerationDto) => {
  try {
    const textToCopy = content.title
      ? `${content.title}\n\n${content.generatedContent || content.content}`
      : content.generatedContent || content.content || ''

    await navigator.clipboard.writeText(textToCopy)
    successMessage.value = 'Content copied to clipboard!'
    showSuccess.value = true
  } catch (error) {
    errorMessage.value = 'Failed to copy content to clipboard'
    showError.value = true
  }
}

const createVideo = async (content: ContentGenerationDto) => {
  try {
    // Show loading state
    const loadingMessage = 'Đang khởi tạo video từ nội dung...'
    successMessage.value = loadingMessage
    showSuccess.value = true

    // Prepare workflow request
    const workflowRequest = {
      generatedContent: content.generatedContent || content.content,
      title: content.title,
      contentType: content.contentType || 'general',
      industry: content.industry,
      language: content.language || 'vi',
      tone: content.tone,
      targetAudience: content.targetAudience
    }

    // Call the workflow API
    const response = await contentService.triggerWorkflow(workflowRequest)

    if (response.errorCode === 'SUCCESS') {
      // Add to video progress tracking
      const videoContent: ContentGenerationDto = {
        ...content,
        status: 'WORKFLOW_TRIGGERED',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      addVideoJob(videoContent)

      successMessage.value = 'Đã bắt đầu tạo video! Bạn sẽ được thông báo khi hoàn thành.'
      showSuccess.value = true
    } else {
      errorMessage.value = response.errorMessage || 'Không thể khởi tạo quy trình tạo video'
      showError.value = true
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.errorMessage || error.message || 'Không thể tạo video'
    showError.value = true
  }
}

const saveEdit = async () => {
  if (!contentToEdit.value || !editFormValid.value) return

  const success = await updateContent(contentToEdit.value.id, editForm.value)

  if (success) {
    successMessage.value = 'Content updated successfully!'
    showSuccess.value = true
    editDialog.value = false
    contentToEdit.value = null
    editForm.value = {}
  }
}

const cancelEdit = () => {
  editDialog.value = false
  contentToEdit.value = null
  editForm.value = {}
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

/* Table Styling */
.v-data-table {
  border-radius: 0 0 8px 8px;
}

.v-data-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
  cursor: pointer;
}

.content-preview-wrapper {
  max-width: 100%;
  padding: 4px 0;
}

.content-preview {
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 0.875rem;
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 4px solid rgb(var(--v-theme-primary));
  font-weight: 400;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-height: 80px;
  overflow: hidden;
  position: relative;
}

.content-preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 20px;
  background: linear-gradient(to right, transparent, rgba(var(--v-theme-surface-variant), 0.5));
}

/* Dark theme adjustments */
.v-theme--dark .content-preview {
  background-color: rgba(var(--v-theme-surface-bright), 0.1);
  color: rgb(var(--v-theme-on-surface)) !important;
  border-left-color: rgb(var(--v-theme-primary-lighten-1));
}

.v-theme--dark .content-preview::after {
  background: linear-gradient(to right, transparent, rgba(var(--v-theme-surface-bright), 0.1));
}

.v-chip {
  font-size: 0.75rem;
  font-weight: 500;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}

/* View Toggle */
.v-btn-toggle {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 4px;
}

/* Action buttons */
.action-buttons {
  gap: 4px;
}

.action-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
}

.action-btn .v-icon {
  font-size: 18px !important;
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

.action-btn:hover .v-icon {
  color: rgba(var(--v-theme-on-surface), 1) !important;
}

.action-btn.v-btn--variant-text {
  background: transparent !important;
}

.action-btn.v-btn--variant-text:hover {
  background: rgba(var(--v-theme-on-surface), 0.08) !important;
}

/* Actions column styling */
.v-data-table :deep(td:last-child) {
  padding: 8px 16px !important;
  width: 140px !important;
}

.v-data-table :deep(.action-buttons) {
  justify-content: center !important;
}

/* Primary color for regenerate button */
.action-btn.v-btn--color-primary .v-icon {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Ensure icons are always visible */
.v-icon {
  opacity: 1 !important;
  display: inline-flex !important;
}

/* Fix for Material Design Icons */
.mdi::before {
  display: inline-block !important;
}

/* Dialog Styling */
.v-dialog .v-card {
  border-radius: 12px;
}

.v-dialog .v-card-title {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 16px 24px;
}

.generated-content-display {
  line-height: 1.6;
  font-size: 1rem;
}

.generated-content-display :deep(p) {
  margin-bottom: 1rem;
}

.generated-content-display :deep(p:last-child) {
  margin-bottom: 0;
}

/* Form styling in edit dialog */
.v-form .v-text-field,
.v-form .v-select,
.v-form .v-textarea {
  margin-bottom: 8px;
}

.v-card-title {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.875rem;
  font-weight: 500;
  flex-shrink: 0;
}
</style>