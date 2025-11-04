<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">tabler-history</v-icon>
      Version History
      <v-spacer />
      <v-chip v-if="totalVersions > 0" color="primary" variant="tonal" size="small">
        {{ totalVersions }} versions
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoadingVersions" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-body-2 mt-4">Loading version history...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="versions.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">tabler-history-off</v-icon>
        <h3 class="text-h6 mt-4">No Version History</h3>
        <p class="text-body-2 text-medium-emphasis">
          This content doesn't have any version history yet.
        </p>
      </div>

      <!-- Version Timeline -->
      <v-timeline v-else side="end" density="compact">
        <v-timeline-item v-for="(version, index) in versions" :key="version.id" :dot-color="getVersionColor(version)"
          size="small">
          <template #icon>
            <v-icon size="16">
              {{ getVersionIcon(version) }}
            </v-icon>
          </template>

          <v-card :class="[
            'mb-4',
            version.isLatestVersion ? 'border-primary' : ''
          ]" :variant="version.isLatestVersion ? 'outlined' : 'flat'">
            <v-card-title class="d-flex align-center py-2">
              <div class="d-flex align-center">
                <v-chip :color="version.isLatestVersion ? 'primary' : 'default'"
                  :variant="version.isLatestVersion ? 'flat' : 'tonal'" size="small" class="me-2">
                  v{{ version.versionNumber }}
                </v-chip>

                <v-chip v-if="version.versionTag" color="secondary" variant="tonal" size="small" class="me-2">
                  {{ version.versionTag }}
                </v-chip>

                <v-chip v-if="version.isExperimental" color="warning" variant="tonal" size="small" class="me-2">
                  Experimental
                </v-chip>

                <v-chip v-if="version.isLatestVersion" color="success" variant="tonal" size="small">
                  Latest
                </v-chip>
              </div>

              <v-spacer />

              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon="tabler-dots-vertical" variant="text" size="small" v-bind="props" />
                </template>
                <v-list>
                  <v-list-item @click="viewVersion(version)">
                    <template #prepend>
                      <v-icon>tabler-eye</v-icon>
                    </template>
                    <v-list-item-title>View Details</v-list-item-title>
                  </v-list-item>

                  <v-list-item v-if="!version.isLatestVersion" @click="confirmRevert(version)">
                    <template #prepend>
                      <v-icon>tabler-restore</v-icon>
                    </template>
                    <v-list-item-title>Revert to This Version</v-list-item-title>
                  </v-list-item>

                  <v-list-item v-if="canCompareVersions && index < versions.length - 1"
                    @click="compareWithPrevious(version, versions[index + 1])">
                    <template #prepend>
                      <v-icon>tabler-git-compare</v-icon>
                    </template>
                    <v-list-item-title>Compare with Previous</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="tagVersion(version)">
                    <template #prepend>
                      <v-icon>tabler-tag</v-icon>
                    </template>
                    <v-list-item-title>Add Tag</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>

            <v-card-text class="py-2">
              <!-- Version Info -->
              <div class="d-flex align-center mb-2">
                <v-icon size="16" class="me-1">tabler-user</v-icon>
                <span class="text-body-2 me-4">{{ version.createdByUsername || 'Unknown' }}</span>

                <v-icon size="16" class="me-1">tabler-clock</v-icon>
                <span class="text-body-2 me-4">{{ formatDate(version.createdAt) }}</span>

                <v-icon size="16" class="me-1">tabler-robot</v-icon>
                <span class="text-body-2">{{ version.aiProvider }} ({{ version.aiModel }})</span>
              </div>

              <!-- Performance Metrics -->
              <div v-if="hasMetrics(version)" class="d-flex flex-wrap gap-2 mb-2">
                <v-chip v-if="version.qualityScore" :color="getScoreColor(version.qualityScore)" variant="tonal"
                  size="small">
                  Quality: {{ version.qualityScore.toFixed(1) }}
                </v-chip>

                <v-chip v-if="version.readabilityScore" :color="getScoreColor(version.readabilityScore)" variant="tonal"
                  size="small">
                  Readability: {{ version.readabilityScore.toFixed(1) }}
                </v-chip>

                <v-chip v-if="version.seoScore" :color="getScoreColor(version.seoScore)" variant="tonal" size="small">
                  SEO: {{ version.seoScore.toFixed(1) }}
                </v-chip>

                <v-chip v-if="version.overallScore" :color="getScoreColor(version.overallScore)" variant="flat"
                  size="small">
                  Overall: {{ version.overallScore.toFixed(1) }}
                </v-chip>
              </div>

              <!-- Content Statistics -->
              <div class="d-flex align-center text-body-2 text-medium-emphasis">
                <span v-if="version.wordCount" class="me-4">
                  {{ version.wordCount }} words
                </span>
                <span v-if="version.characterCount" class="me-4">
                  {{ version.characterCount }} chars
                </span>
                <span v-if="version.tokensUsed" class="me-4">
                  {{ version.tokensUsed }} tokens
                </span>
                <span v-if="version.generationCost">
                  ${{ version.generationCost.toFixed(4) }}
                </span>
              </div>

              <!-- Annotation -->
              <div v-if="version.annotation" class="mt-2">
                <v-alert type="info" variant="tonal" density="compact" class="text-body-2">
                  {{ version.annotation }}
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
        <v-pagination v-model="currentPageModel" :length="totalPages" :total-visible="5"
          @update:model-value="goToPage" />
      </div>
    </v-card-text>

    <!-- Revert Confirmation Dialog -->
    <v-dialog v-model="showRevertDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2" color="warning">tabler-alert-triangle</v-icon>
          Confirm Version Revert
        </v-card-title>

        <v-card-text>
          <p class="mb-4">
            Are you sure you want to revert to version {{ selectedVersion?.versionNumber }}?
          </p>

          <v-alert type="warning" variant="tonal" class="mb-4">
            This will create a new version based on the selected version's content.
            The current latest version will remain in history.
          </v-alert>

          <div v-if="selectedVersion" class="text-body-2">
            <strong>Version Details:</strong><br>
            Created: {{ formatDate(selectedVersion.createdAt) }}<br>
            AI Provider: {{ selectedVersion.aiProvider }} ({{ selectedVersion.aiModel }})<br>
            <span v-if="selectedVersion.overallScore">
              Overall Score: {{ selectedVersion.overallScore.toFixed(1) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRevertDialog = false">
            Cancel
          </v-btn>
          <v-btn color="warning" :loading="isReverting" @click="performRevert">
            Revert Version
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tag Version Dialog -->
    <v-dialog v-model="showTagDialog" max-width="500">
      <v-card>
        <v-card-title>Add Version Tag</v-card-title>

        <v-card-text>
          <v-form ref="tagForm" @submit.prevent="performTag">
            <v-text-field v-model="tagForm.versionTag" label="Tag Name" placeholder="e.g., stable, release-1.0, draft"
              :rules="[(v: string) => !!v || 'Tag name is required']" required />

            <v-textarea v-model="tagForm.annotation" label="Annotation (Optional)"
              placeholder="Add notes about this version..." rows="3" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTagDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="isTagging" @click="performTag">
            Add Tag
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useContentVersioning } from '@/composables/useContentVersioning'
import { useJobNotifications } from '@/composables/useJobNotifications'
import type { ContentVersion } from '@/types/content'

interface Props {
  contentId: number
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

const emit = defineEmits<{
  versionSelected: [version: ContentVersion]
  compareVersions: [versionA: ContentVersion, versionB: ContentVersion]
  versionReverted: [newVersion: ContentVersion]
}>()

// Composables
const {
  versions,
  isLoadingVersions,
  isReverting,
  isTagging,
  currentPage,
  totalPages,
  totalVersions,
  canCompareVersions,
  loadVersionHistory,
  revertToVersion,
  tagVersion: tagVersionAction,
  goToPage: goToPageAction
} = useContentVersioning(computed(() => props.contentId))

const { notifySystem } = useJobNotifications()

// Local state
const showRevertDialog = ref(false)
const showTagDialog = ref(false)
const selectedVersion = ref<ContentVersion | null>(null)
const tagForm = ref({
  versionTag: '',
  annotation: ''
})

// Computed
const currentPageModel = computed({
  get: () => currentPage.value + 1, // Convert 0-based to 1-based
  set: (value: number) => {
    // Will be handled by goToPage method
  }
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getVersionColor = (version: ContentVersion) => {
  if (version.isLatestVersion) return 'primary'
  if (version.isExperimental) return 'warning'
  if (version.versionTag) return 'secondary'
  return 'default'
}

const getVersionIcon = (version: ContentVersion) => {
  if (version.isLatestVersion) return 'tabler-star'
  if (version.isExperimental) return 'tabler-flask'
  if (version.versionTag) return 'tabler-tag'
  return 'tabler-git-commit'
}

const hasMetrics = (version: ContentVersion) => {
  return version.qualityScore || version.readabilityScore || version.seoScore || version.overallScore
}

const getScoreColor = (score: number) => {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'error'
}

const viewVersion = (version: ContentVersion) => {
  emit('versionSelected', version)
}

const confirmRevert = (version: ContentVersion) => {
  selectedVersion.value = version
  showRevertDialog.value = true
}

const performRevert = async () => {
  if (!selectedVersion.value) return

  const newVersion = await revertToVersion(selectedVersion.value.versionNumber)
  if (newVersion) {
    // Show success notification
    notifySystem(
      'success',
      'Version Reverted Successfully',
      `Content has been reverted to version ${selectedVersion.value.versionNumber}. A new version (v${newVersion.versionNumber}) has been created.`,
      false,
      [
        {
          label: 'View New Version',
          color: 'primary',
          action: () => emit('versionSelected', newVersion)
        }
      ]
    )

    emit('versionReverted', newVersion)
    showRevertDialog.value = false
    selectedVersion.value = null
  } else {
    // Show error notification if revert failed
    notifySystem(
      'error',
      'Version Revert Failed',
      `Failed to revert to version ${selectedVersion.value.versionNumber}. Please try again.`,
      true,
      [
        {
          label: 'Retry',
          color: 'error',
          action: () => performRevert()
        }
      ]
    )
  }
}

const compareWithPrevious = (versionA: ContentVersion, versionB: ContentVersion) => {
  emit('compareVersions', versionA, versionB)
}

const tagVersion = (version: ContentVersion) => {
  selectedVersion.value = version
  tagForm.value = {
    versionTag: '',
    annotation: ''
  }
  showTagDialog.value = true
}

const performTag = async () => {
  if (!selectedVersion.value || !tagForm.value.versionTag) return

  const updatedVersion = await tagVersionAction(selectedVersion.value.versionNumber, {
    versionTag: tagForm.value.versionTag,
    annotation: tagForm.value.annotation || undefined
  })

  if (updatedVersion) {
    // Show success notification
    notifySystem(
      'success',
      'Version Tagged Successfully',
      `Version ${selectedVersion.value.versionNumber} has been tagged as "${tagForm.value.versionTag}".`,
      false
    )

    showTagDialog.value = false
    selectedVersion.value = null
    tagForm.value = {
      versionTag: '',
      annotation: ''
    }
  } else {
    // Show error notification if tagging failed
    notifySystem(
      'error',
      'Version Tagging Failed',
      `Failed to tag version ${selectedVersion.value.versionNumber}. Please try again.`,
      true,
      [
        {
          label: 'Retry',
          color: 'error',
          action: () => performTag()
        }
      ]
    )
  }
}

const goToPage = (page: number) => {
  goToPageAction(page - 1) // Convert 1-based to 0-based
}

// Lifecycle
onMounted(() => {
  if (props.autoLoad) {
    loadVersionHistory()
  }
})

// Watch for contentId changes
watch(() => props.contentId, () => {
  if (props.autoLoad) {
    loadVersionHistory()
  }
})

// Expose methods for parent components
defineExpose({
  loadVersionHistory,
  refresh: () => loadVersionHistory(currentPage.value)
})
</script>

<style scoped>
.v-timeline-item :deep(.v-timeline-item__body) {
  padding-inline-start: 16px;
}

.border-primary {
  border: 1px solid rgb(var(--v-theme-primary)) !important;
}
</style>