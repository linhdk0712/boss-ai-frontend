<template>
  <v-card class="generated-content-card" elevation="2">
    <v-card-title class="d-flex align-center py-3">
      <span class="text-body-1 font-weight-medium">Generated Content</span>

      <v-spacer />

      <!-- Copy Button - only show if content exists -->
      <v-btn v-if="shouldShowContent" variant="text" size="small" prepend-icon="mdi-content-copy"
        @click="copyToClipboard">
        Copy
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-0">
      <!-- Error Display for Failed Generation -->
      <div v-if="isContentFailed" class="px-4 py-4">
        <v-alert type="error" variant="tonal" class="mb-4">
          <v-alert-title class="d-flex align-center">
            <v-icon class="me-2">mdi-alert-circle</v-icon>
            Generation Failed
          </v-alert-title>
          <div class="mt-2">
            {{ content.errorMessage || 'Content generation failed. Please try again.' }}
          </div>
        </v-alert>

        <!-- Status Display for Failed -->
        <v-chip color="error" variant="flat" size="small" class="status-chip">
          FAILED
        </v-chip>
      </div>

      <!-- Success Content Display -->
      <div v-else-if="shouldShowContent">
        <!-- Content Title -->
        <div v-if="content.title" class="px-4 pt-4 pb-2">
          <h3 class="text-h6 mb-2">{{ content.title }}</h3>
        </div>

        <!-- Generated Content with Dark Background -->
        <div class="generated-text-container">
          <div class="content-text" v-html="formattedContent" />
        </div>

        <!-- Generation Statistics -->
        <div class="px-4 pb-4">
          <v-expansion-panels v-if="hasStatistics" variant="accordion" class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="me-2">mdi-chart-line</v-icon>
                Generation Statistics
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="6" md="3">
                    <v-card variant="tonal" color="primary">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ content.wordCount || 0 }}</div>
                        <div class="text-caption">Words</div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="6" md="3">
                    <v-card variant="tonal" color="secondary">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ content.characterCount || 0 }}</div>
                        <div class="text-caption">Characters</div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="6" md="3">
                    <v-card variant="tonal" color="info">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ content.tokensUsed || 0 }}</div>
                        <div class="text-caption">Tokens</div>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="6" md="3">
                    <v-card variant="tonal" color="warning">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ formatCost(content.generationCost) }}</div>
                        <div class="text-caption">Cost</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row class="mt-2">
                  <v-col cols="12">
                    <v-card variant="tonal" color="success">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ formatProcessingTime(content.processingTimeMs || 0) }}</div>
                        <div class="text-caption">Processing Time</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Status Display for Success -->
          <v-chip color="success" variant="flat" size="small" class="mb-2 status-chip">
            COMPLETED
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Copy Success Snackbar -->
  <v-snackbar v-model="copySuccess" color="success" timeout="2000">
    <v-icon start>mdi-check</v-icon>
    Content copied to clipboard!
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContentGenerateResponse } from '@/types/content'

// Props
interface Props {
  content: ContentGenerateResponse
}

const props = defineProps<Props>()

// Reactive state
const copySuccess = ref(false)

// Computed properties
const formattedContent = computed(() => {
  if (!props.content.generatedContent) return ''

  // Convert line breaks to HTML and preserve formatting
  return props.content.generatedContent
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

const hasStatistics = computed(() => {
  return props.content && (
    props.content.wordCount !== undefined ||
    props.content.characterCount !== undefined ||
    props.content.tokensUsed !== undefined ||
    props.content.processingTimeMs !== undefined
  )
})

const isContentFailed = computed(() => {
  return props.content && (
    props.content.status === 'FAILED' ||
    !props.content.generatedContent
  )
})

const shouldShowContent = computed(() => {
  return props.content &&
    props.content.generatedContent &&
    props.content.status !== 'FAILED'
})

// Methods
const copyToClipboard = async () => {
  if (!props.content.generatedContent) return

  try {
    const textToCopy = props.content.title
      ? `${props.content.title}\n\n${props.content.generatedContent}`
      : props.content.generatedContent

    await navigator.clipboard.writeText(textToCopy)
    copySuccess.value = true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
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
      console.error('Fallback copy failed:', err)
    }

    document.body.removeChild(textArea)
  }
}

const formatCost = (cost: number | null | undefined): string => {
  if (cost === null || cost === undefined) {
    return 'N/A'
  }
  return `$${cost.toFixed(4)}`
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
</script>

<style scoped>
.generated-content-card {
  border-radius: 8px;
  overflow: hidden;
}

.v-card-title {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.875rem;
}

.generated-text-container {
  background-color: #2d2d2d;
  color: #ffffff;
  padding: 20px;
  margin: 0;
  font-family: 'Courier New', monospace;
}

.content-text {
  line-height: 1.6;
  font-size: 0.875rem;
  color: #ffffff;
}

.content-text :deep(p) {
  margin-bottom: 1rem;
  color: #ffffff;
}

.content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.v-expansion-panel-title {
  font-weight: 500;
}

.text-h6 {
  font-weight: 600;
}

.text-caption {
  opacity: 0.7;
  font-size: 0.75rem;
}

/* Ensure proper text color in dark container */
.generated-text-container * {
  color: #ffffff !important;
}

/* Status chip styling */
.status-chip {
  font-weight: 500;
  font-size: 0.75rem;
}

/* Success status */
.status-chip.v-chip--color-success {
  background-color: #28a745 !important;
  color: white !important;
}

/* Error status */
.status-chip.v-chip--color-error {
  background-color: #dc3545 !important;
  color: white !important;
}
</style>