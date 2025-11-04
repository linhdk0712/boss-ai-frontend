<template>
  <v-dialog v-model="dialogModel" max-width="1200" scrollable persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">tabler-git-compare</v-icon>
        Version Comparison
        <v-spacer />
        <v-btn icon="tabler-x" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Loading State -->
        <div v-if="isLoadingComparison" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-4">Comparing versions...</p>
        </div>

        <!-- Comparison Content -->
        <div v-else-if="comparison" class="comparison-container">
          <!-- Comparison Header -->
          <v-container fluid class="py-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="d-flex align-center bg-red-lighten-5">
                    <v-chip color="error" variant="flat" size="small" class="me-2">
                      Version {{ comparison.versionA.versionNumber }}
                    </v-chip>
                    <span class="text-body-1">{{ comparison.versionA.title || 'Untitled' }}</span>
                  </v-card-title>
                  <v-card-text>
                    <div class="text-body-2 mb-2">
                      <strong>Created:</strong> {{ formatDate(comparison.versionA.createdAt) }}<br>
                      <strong>AI Provider:</strong> {{ comparison.versionA.aiProvider }} ({{ comparison.versionA.aiModel
                      }})<br>
                      <strong>Author:</strong> {{ comparison.versionA.createdByUsername || 'Unknown' }}
                    </div>
                    <div v-if="hasMetrics(comparison.versionA)" class="d-flex flex-wrap gap-1">
                      <v-chip v-if="comparison.versionA.qualityScore"
                        :color="getScoreColor(comparison.versionA.qualityScore)" variant="tonal" size="small">
                        Quality: {{ comparison.versionA.qualityScore.toFixed(1) }}
                      </v-chip>
                      <v-chip v-if="comparison.versionA.readabilityScore"
                        :color="getScoreColor(comparison.versionA.readabilityScore)" variant="tonal" size="small">
                        Readability: {{ comparison.versionA.readabilityScore.toFixed(1) }}
                      </v-chip>
                      <v-chip v-if="comparison.versionA.seoScore" :color="getScoreColor(comparison.versionA.seoScore)"
                        variant="tonal" size="small">
                        SEO: {{ comparison.versionA.seoScore.toFixed(1) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="d-flex align-center bg-green-lighten-5">
                    <v-chip color="success" variant="flat" size="small" class="me-2">
                      Version {{ comparison.versionB.versionNumber }}
                    </v-chip>
                    <span class="text-body-1">{{ comparison.versionB.title || 'Untitled' }}</span>
                  </v-card-title>
                  <v-card-text>
                    <div class="text-body-2 mb-2">
                      <strong>Created:</strong> {{ formatDate(comparison.versionB.createdAt) }}<br>
                      <strong>AI Provider:</strong> {{ comparison.versionB.aiProvider }} ({{ comparison.versionB.aiModel
                      }})<br>
                      <strong>Author:</strong> {{ comparison.versionB.createdByUsername || 'Unknown' }}
                    </div>
                    <div v-if="hasMetrics(comparison.versionB)" class="d-flex flex-wrap gap-1">
                      <v-chip v-if="comparison.versionB.qualityScore"
                        :color="getScoreColor(comparison.versionB.qualityScore)" variant="tonal" size="small">
                        Quality: {{ comparison.versionB.qualityScore.toFixed(1) }}
                      </v-chip>
                      <v-chip v-if="comparison.versionB.readabilityScore"
                        :color="getScoreColor(comparison.versionB.readabilityScore)" variant="tonal" size="small">
                        Readability: {{ comparison.versionB.readabilityScore.toFixed(1) }}
                      </v-chip>
                      <v-chip v-if="comparison.versionB.seoScore" :color="getScoreColor(comparison.versionB.seoScore)"
                        variant="tonal" size="small">
                        SEO: {{ comparison.versionB.seoScore.toFixed(1) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>

          <!-- Comparison Summary -->
          <v-container fluid class="py-0">
            <v-card variant="outlined" class="mb-4">
              <v-card-title>Comparison Summary</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <div class="text-center">
                      <div class="text-h4 text-primary">{{ comparison.comparisonSummary.similarityPercentage.toFixed(1)
                        }}%</div>
                      <div class="text-body-2 text-medium-emphasis">Similarity</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-center">
                      <div class="text-h4 text-warning">{{ comparison.comparisonSummary.totalChanges }}</div>
                      <div class="text-body-2 text-medium-emphasis">Total Changes</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="text-center">
                      <div class="text-h4"
                        :class="getWordCountChangeColor(comparison.comparisonSummary.wordCountDifference)">
                        {{ comparison.comparisonSummary.wordCountDifference > 0 ? '+' : '' }}{{
                          comparison.comparisonSummary.wordCountDifference }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis">Word Difference</div>
                    </div>
                  </v-col>
                </v-row>

                <v-row class="mt-2">
                  <v-col cols="12" md="4">
                    <v-chip color="success" variant="tonal" size="small" class="me-2">
                      +{{ comparison.comparisonSummary.additions }} additions
                    </v-chip>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-chip color="error" variant="tonal" size="small" class="me-2">
                      -{{ comparison.comparisonSummary.deletions }} deletions
                    </v-chip>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-chip color="warning" variant="tonal" size="small">
                      {{ comparison.comparisonSummary.modifications }} modifications
                    </v-chip>
                  </v-col>
                </v-row>

                <!-- Diff Navigation -->
                <v-row v-if="comparison.textDifferences.length > 0" class="mt-4">
                  <v-col cols="12">
                    <div class="d-flex align-center justify-center gap-2">
                      <v-btn size="small" variant="outlined" prepend-icon="tabler-arrow-up"
                        @click="navigateToDiff('previous')" :disabled="currentDiffIndex <= 0">
                        Previous Change
                      </v-btn>

                      <v-chip variant="tonal" size="small">
                        {{ currentDiffIndex + 1 }} of {{ comparison.textDifferences.length }}
                      </v-chip>

                      <v-btn size="small" variant="outlined" append-icon="tabler-arrow-down"
                        @click="navigateToDiff('next')"
                        :disabled="currentDiffIndex >= comparison.textDifferences.length - 1">
                        Next Change
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-container>

          <!-- Tabs for Different Views -->
          <v-tabs v-model="activeTab" class="px-4">
            <v-tab value="side-by-side">Side by Side</v-tab>
            <v-tab value="unified">Unified Diff</v-tab>
            <v-tab value="metrics">Metrics Comparison</v-tab>
            <v-tab value="recommendation">Recommendation</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <!-- Side by Side View -->
            <v-tabs-window-item value="side-by-side">
              <v-container fluid>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="diff-container">
                      <v-card-title class="bg-red-lighten-5 py-2">
                        Version {{ comparison.versionA.versionNumber }}
                      </v-card-title>
                      <v-card-text class="pa-0">
                        <div class="diff-content" v-html="renderSideBySideContent('A')" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="diff-container">
                      <v-card-title class="bg-green-lighten-5 py-2">
                        Version {{ comparison.versionB.versionNumber }}
                      </v-card-title>
                      <v-card-text class="pa-0">
                        <div class="diff-content" v-html="renderSideBySideContent('B')" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-tabs-window-item>

            <!-- Unified Diff View -->
            <v-tabs-window-item value="unified">
              <v-container fluid>
                <v-card variant="outlined" class="diff-container">
                  <v-card-text class="pa-0">
                    <div class="diff-content unified-diff">
                      <div v-for="(diff, index) in getUnifiedDiffLines()" :key="index"
                        :class="getDiffLineClass(diff.type)" class="diff-line">
                        <span class="line-number">{{ diff.lineNumber || '-' }}</span>
                        <span class="diff-marker">{{ getDiffMarker(diff.type) }}</span>
                        <span class="diff-text">{{ diff.text }}</span>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-container>
            </v-tabs-window-item>

            <!-- Metrics Comparison -->
            <v-tabs-window-item value="metrics">
              <v-container fluid>
                <MetricsComparisonPanel :comparison="comparison.metricsComparison" />
              </v-container>
            </v-tabs-window-item>

            <!-- Recommendation -->
            <v-tabs-window-item value="recommendation">
              <v-container fluid>
                <RecommendationPanel :recommendation="comparison.recommendation"
                  :performance-comparison="comparison.performanceComparison" />
              </v-container>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <!-- Error State -->
        <div v-else class="text-center py-8">
          <v-icon size="64" color="error">tabler-alert-circle</v-icon>
          <h3 class="text-h6 mt-4">Comparison Failed</h3>
          <p class="text-body-2 text-medium-emphasis">
            Unable to compare the selected versions. Please try again.
          </p>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">
          Close
        </v-btn>
        <v-btn v-if="comparison?.recommendation" color="primary" @click="acceptRecommendation">
          Use {{ comparison.recommendation.recommendedVersion === 'A' ? 'Version A' : 'Version B' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContentVersioning } from '@/composables/useContentVersioning'
import type { ContentVersion, ContentVersionComparison, TextDifference } from '@/types/content'
import MetricsComparisonPanel from './MetricsComparisonPanel.vue'
import RecommendationPanel from './RecommendationPanel.vue'

interface Props {
  modelValue: boolean
  contentId?: number
  versionA?: ContentVersion
  versionB?: ContentVersion
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  versionSelected: [version: ContentVersion]
}>()

// Composables
const {
  versionComparison: comparison,
  isLoadingComparison,
  compareVersions,
  getSideBySideComparison
} = useContentVersioning(computed(() => props.contentId || 0))

// Local state
const activeTab = ref('side-by-side')
const sideBySideData = ref<Record<string, any> | null>(null)
const leftScrollContainer = ref<HTMLElement | null>(null)
const rightScrollContainer = ref<HTMLElement | null>(null)
const isScrollSyncing = ref(false)
const currentDiffIndex = ref(0)

// Computed
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const hasMetrics = (version: ContentVersion) => {
  return version.qualityScore || version.readabilityScore || version.seoScore
}

const getScoreColor = (score: number) => {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'error'
}

const getWordCountChangeColor = (difference: number) => {
  if (difference > 0) return 'text-success'
  if (difference < 0) return 'text-error'
  return 'text-medium-emphasis'
}

const getDiffLineClass = (type: string) => {
  switch (type) {
    case 'ADDITION':
      return 'diff-addition'
    case 'DELETION':
      return 'diff-deletion'
    case 'MODIFICATION':
      return 'diff-modification'
    default:
      return 'diff-unchanged'
  }
}

const getDiffMarker = (type: string) => {
  switch (type) {
    case 'ADDITION':
      return '+'
    case 'DELETION':
      return '-'
    case 'MODIFICATION':
      return '~'
    default:
      return ' '
  }
}

const getDiffText = (diff: TextDifference) => {
  switch (diff.type) {
    case 'ADDITION':
      return diff.newText || ''
    case 'DELETION':
      return diff.originalText || ''
    case 'MODIFICATION':
      return `${diff.originalText} → ${diff.newText}`
    default:
      return diff.originalText || diff.newText || ''
  }
}

const getUnifiedDiffLines = () => {
  if (!comparison.value) return []

  const contentA = comparison.value.versionA.content.split('\n')
  const contentB = comparison.value.versionB.content.split('\n')
  const diffs = comparison.value.textDifferences

  const unifiedLines: Array<{
    type: string
    lineNumber?: number
    text: string
  }> = []

  // Create a unified diff view showing context and changes
  const maxLines = Math.max(contentA.length, contentB.length)
  const contextLines = 3 // Number of context lines to show around changes

  for (let i = 0; i < maxLines; i++) {
    const lineNumber = i + 1
    const diff = diffs.find(d => d.lineNumber === lineNumber)

    if (diff) {
      // Add the actual diff line(s)
      switch (diff.type) {
        case 'DELETION':
          unifiedLines.push({
            type: 'DELETION',
            lineNumber: lineNumber,
            text: diff.originalText || contentA[i] || ''
          })
          break
        case 'ADDITION':
          unifiedLines.push({
            type: 'ADDITION',
            lineNumber: lineNumber,
            text: diff.newText || contentB[i] || ''
          })
          break
        case 'MODIFICATION':
          // Show both old and new lines for modifications
          unifiedLines.push({
            type: 'DELETION',
            lineNumber: lineNumber,
            text: diff.originalText || contentA[i] || ''
          })
          unifiedLines.push({
            type: 'ADDITION',
            lineNumber: lineNumber,
            text: diff.newText || contentB[i] || ''
          })
          break
        default:
          unifiedLines.push({
            type: 'UNCHANGED',
            lineNumber: lineNumber,
            text: contentA[i] || contentB[i] || ''
          })
      }
    } else {
      // Check if this line is near a change to include as context
      const nearChange = diffs.some(d =>
        Math.abs((d.lineNumber || 0) - lineNumber) <= contextLines
      )

      if (nearChange || unifiedLines.length === 0) {
        unifiedLines.push({
          type: 'UNCHANGED',
          lineNumber: lineNumber,
          text: contentA[i] || contentB[i] || ''
        })
      }
    }
  }

  return unifiedLines
}

const renderSideBySideContent = (version: 'A' | 'B') => {
  if (!comparison.value) return ''

  const content = version === 'A'
    ? comparison.value.versionA.content
    : comparison.value.versionB.content

  const lines = content.split('\n')
  const relevantDiffs = comparison.value.textDifferences.filter(diff => {
    // For version A, show deletions and modifications (original text)
    // For version B, show additions and modifications (new text)
    if (version === 'A') {
      return diff.type === 'DELETION' || diff.type === 'MODIFICATION'
    } else {
      return diff.type === 'ADDITION' || diff.type === 'MODIFICATION'
    }
  })

  return lines
    .map((line, index) => {
      const lineNumber = index + 1
      const diff = relevantDiffs.find(d => d.lineNumber === lineNumber)

      if (diff) {
        const className = getDiffLineClass(diff.type)
        let displayText = line

        // For modifications, show the appropriate text based on version
        if (diff.type === 'MODIFICATION') {
          displayText = version === 'A'
            ? (diff.originalText || line)
            : (diff.newText || line)

          // Add word-level highlighting for modifications
          if (diff.originalText && diff.newText) {
            displayText = highlightWordDifferences(
              diff.originalText,
              diff.newText,
              version === 'A'
            )
          }
        }

        return `<div class="diff-line ${className}" data-line="${lineNumber}" title="${getDiffTooltip(diff, version)}">
          <span class="line-number">${lineNumber}</span>
          <span class="line-content">${displayText}</span>
        </div>`
      }

      return `<div class="diff-line" data-line="${lineNumber}">
        <span class="line-number">${lineNumber}</span>
        <span class="line-content">${escapeHtml(line)}</span>
      </div>`
    })
    .join('')
}

const escapeHtml = (text: string) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const highlightWordDifferences = (originalText: string, newText: string, showOriginal: boolean) => {
  const originalWords = originalText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)

  if (showOriginal) {
    // Highlight words that were changed or removed
    return originalWords
      .map(word => {
        if (word.trim() && !newWords.includes(word)) {
          return `<span class="word-diff-removed">${escapeHtml(word)}</span>`
        }
        return escapeHtml(word)
      })
      .join('')
  } else {
    // Highlight words that were added or changed
    return newWords
      .map(word => {
        if (word.trim() && !originalWords.includes(word)) {
          return `<span class="word-diff-added">${escapeHtml(word)}</span>`
        }
        return escapeHtml(word)
      })
      .join('')
  }
}

const getDiffTooltip = (diff: TextDifference, version: 'A' | 'B') => {
  switch (diff.type) {
    case 'ADDITION':
      return version === 'B' ? 'Added in this version' : 'Not present in this version'
    case 'DELETION':
      return version === 'A' ? 'Removed in newer version' : 'Not present in this version'
    case 'MODIFICATION':
      return version === 'A' ? 'Original text (modified in newer version)' : 'Modified text'
    default:
      return ''
  }
}

const setupScrollSync = () => {
  // This will be called after the component is mounted and content is rendered
  setTimeout(() => {
    const leftContainer = document.querySelector('.diff-container:first-of-type .diff-content') as HTMLElement
    const rightContainer = document.querySelector('.diff-container:last-of-type .diff-content') as HTMLElement

    if (leftContainer && rightContainer) {
      leftScrollContainer.value = leftContainer
      rightScrollContainer.value = rightContainer

      leftContainer.addEventListener('scroll', (e) => syncScroll('left', e))
      rightContainer.addEventListener('scroll', (e) => syncScroll('right', e))
    }
  }, 100)
}

const navigateToDiff = (direction: 'next' | 'previous') => {
  if (!comparison.value) return

  const diffs = comparison.value.textDifferences
  if (diffs.length === 0) return

  if (direction === 'next' && currentDiffIndex.value < diffs.length - 1) {
    currentDiffIndex.value++
  } else if (direction === 'previous' && currentDiffIndex.value > 0) {
    currentDiffIndex.value--
  }

  // Scroll to the current diff
  scrollToDiff(currentDiffIndex.value)
}

const scrollToDiff = (diffIndex: number) => {
  if (!comparison.value) return

  const diff = comparison.value.textDifferences[diffIndex]
  if (!diff) return

  // Find the diff line element and scroll to it
  setTimeout(() => {
    const diffElement = document.querySelector(`[data-line="${diff.lineNumber}"]`) as HTMLElement
    if (diffElement) {
      diffElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // Highlight the current diff temporarily
      diffElement.classList.add('current-diff')
      setTimeout(() => {
        diffElement.classList.remove('current-diff')
      }, 2000)
    }
  }, 100)
}

const syncScroll = (source: 'left' | 'right', event: Event) => {
  if (isScrollSyncing.value) return

  const sourceElement = event.target as HTMLElement
  const targetElement = source === 'left' ? rightScrollContainer.value : leftScrollContainer.value

  if (!targetElement) return

  isScrollSyncing.value = true

  // Calculate scroll percentage
  const scrollPercentage = sourceElement.scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight)

  // Apply to target
  const targetScrollTop = scrollPercentage * (targetElement.scrollHeight - targetElement.clientHeight)
  targetElement.scrollTop = targetScrollTop

  // Reset sync flag after a short delay
  setTimeout(() => {
    isScrollSyncing.value = false
  }, 50)
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const acceptRecommendation = () => {
  if (!comparison.value) return

  const selectedVersion = comparison.value.recommendation.recommendedVersion === 'A'
    ? comparison.value.versionA
    : comparison.value.versionB

  emit('versionSelected', selectedVersion)
  closeDialog()
}

// Load comparison when dialog opens and versions are available
watch([() => props.modelValue, () => props.versionA, () => props.versionB], async ([isOpen, versionA, versionB]) => {
  if (isOpen && versionA && versionB && props.contentId) {
    // Reset diff navigation
    currentDiffIndex.value = 0

    await compareVersions(versionA.versionNumber, versionB.versionNumber)

    // Load side-by-side data for better rendering
    sideBySideData.value = await getSideBySideComparison(versionA.versionNumber, versionB.versionNumber)

    // Setup scroll synchronization for side-by-side view
    if (activeTab.value === 'side-by-side') {
      setupScrollSync()
    }
  }
}, { immediate: true })

// Setup scroll sync when switching to side-by-side tab
watch(activeTab, (newTab) => {
  if (newTab === 'side-by-side' && comparison.value) {
    setupScrollSync()
  }
})
</script>

<style scoped>
.comparison-container {
  max-height: 80vh;
  overflow-y: auto;
}

.diff-container {
  height: 500px;
  overflow-y: auto;
}

.diff-content {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  padding: 16px;
  white-space: pre-wrap;
}

.unified-diff .diff-line {
  display: flex;
  align-items: center;
  padding: 2px 0;
  border-left: 4px solid transparent;
}

.line-number {
  display: inline-block;
  width: 60px;
  text-align: right;
  margin-right: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

.diff-marker {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-weight: bold;
  margin-right: 8px;
}

.diff-text {
  flex: 1;
}

.diff-addition {
  background-color: rgba(var(--v-theme-success), 0.1);
  border-left-color: rgb(var(--v-theme-success)) !important;
}

.diff-addition .diff-marker {
  color: rgb(var(--v-theme-success));
}

.diff-deletion {
  background-color: rgba(var(--v-theme-error), 0.1);
  border-left-color: rgb(var(--v-theme-error)) !important;
}

.diff-deletion .diff-marker {
  color: rgb(var(--v-theme-error));
}

.diff-modification {
  background-color: rgba(var(--v-theme-warning), 0.1);
  border-left-color: rgb(var(--v-theme-warning)) !important;
}

.diff-modification .diff-marker {
  color: rgb(var(--v-theme-warning));
}

.diff-unchanged {
  background-color: transparent;
}

/* Side-by-side diff styling */
.diff-content :deep(.diff-line) {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  min-height: 20px;
  border-left: 4px solid transparent;
  transition: background-color 0.2s ease;
}

.diff-content :deep(.diff-line:hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.diff-content :deep(.line-number) {
  display: inline-block;
  width: 50px;
  text-align: right;
  margin-right: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  flex-shrink: 0;
}

.diff-content :deep(.line-content) {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-content :deep(.diff-addition) {
  background-color: rgba(var(--v-theme-success), 0.15);
  border-left-color: rgb(var(--v-theme-success));
}

.diff-content :deep(.diff-addition .line-content) {
  background-color: rgba(var(--v-theme-success), 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.diff-content :deep(.diff-deletion) {
  background-color: rgba(var(--v-theme-error), 0.15);
  border-left-color: rgb(var(--v-theme-error));
}

.diff-content :deep(.diff-deletion .line-content) {
  background-color: rgba(var(--v-theme-error), 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  text-decoration: line-through;
  opacity: 0.8;
}

.diff-content :deep(.diff-modification) {
  background-color: rgba(var(--v-theme-warning), 0.15);
  border-left-color: rgb(var(--v-theme-warning));
}

.diff-content :deep(.diff-modification .line-content) {
  background-color: rgba(var(--v-theme-warning), 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

/* Word-level diff highlighting */
.diff-content :deep(.word-diff-added) {
  background-color: rgba(var(--v-theme-success), 0.3);
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: 600;
  border: 1px solid rgba(var(--v-theme-success), 0.5);
}

.diff-content :deep(.word-diff-removed) {
  background-color: rgba(var(--v-theme-error), 0.3);
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: 600;
  border: 1px solid rgba(var(--v-theme-error), 0.5);
  text-decoration: line-through;
}

/* Enhanced unified diff styling */
.unified-diff .diff-line {
  position: relative;
  padding: 4px 0;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.unified-diff .diff-line:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.unified-diff .diff-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: width 0.2s ease;
}

.unified-diff .diff-addition::before {
  background-color: rgb(var(--v-theme-success));
}

.unified-diff .diff-deletion::before {
  background-color: rgb(var(--v-theme-error));
}

.unified-diff .diff-modification::before {
  background-color: rgb(var(--v-theme-warning));
}

.unified-diff .diff-line:hover::before {
  width: 6px;
}

/* Current diff highlighting */
.diff-content :deep(.current-diff) {
  animation: highlight-pulse 2s ease-in-out;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  border-radius: 4px;
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.1);
  }

  50% {
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.5);
    background-color: rgba(var(--v-theme-primary), 0.2);
  }

  100% {
    box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
}

/* Improved responsive design */
@media (max-width: 768px) {
  .diff-container {
    height: 300px;
  }

  .diff-content :deep(.line-number) {
    width: 40px;
    font-size: 11px;
  }

  .diff-content {
    font-size: 12px;
    padding: 8px;
  }
}
</style>