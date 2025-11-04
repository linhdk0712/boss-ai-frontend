<template>
  <div>
    <!-- AI Recommendation -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2" color="primary">tabler-robot</v-icon>
        AI Recommendation
        <v-spacer />
        <v-chip
          :color="getConfidenceColor(recommendation.confidenceScore)"
          variant="flat"
          size="small"
        >
          {{ (recommendation.confidenceScore * 100).toFixed(0) }}% Confidence
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <v-avatar
            :color="getRecommendationColor(recommendation.recommendedVersion)"
            size="48"
            class="me-4"
          >
            <span class="text-h6 text-white">{{ recommendation.recommendedVersion }}</span>
          </v-avatar>
          
          <div>
            <h3 class="text-h6">
              Use Version {{ recommendation.recommendedVersion }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ recommendation.reasoning }}
            </p>
          </div>
        </div>

        <!-- Key Factors -->
        <div v-if="recommendation.keyFactors.length > 0" class="mb-4">
          <h4 class="text-subtitle-1 mb-2">Key Decision Factors</h4>
          <v-chip-group>
            <v-chip
              v-for="factor in recommendation.keyFactors"
              :key="factor"
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ factor }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Considerations -->
        <div v-if="recommendation.considerations.length > 0">
          <h4 class="text-subtitle-1 mb-2">Additional Considerations</h4>
          <v-list density="compact">
            <v-list-item
              v-for="consideration in recommendation.considerations"
              :key="consideration"
              class="px-0"
            >
              <template #prepend>
                <v-icon size="16" color="warning">tabler-info-circle</v-icon>
              </template>
              <v-list-item-title class="text-body-2">
                {{ consideration }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>

    <!-- Performance Analysis -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">tabler-chart-line</v-icon>
        Performance Analysis
        <v-spacer />
        <v-chip
          :color="getWinnerColor(performanceComparison.overallWinner)"
          variant="flat"
          size="small"
        >
          {{ getWinnerText(performanceComparison.overallWinner) }}
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <!-- Performance Gap -->
        <div class="text-center mb-4">
          <div class="text-h4" :class="getPerformanceGapColor(performanceComparison.performanceGap)">
            {{ performanceComparison.performanceGap.toFixed(1) }}%
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Performance Gap
          </div>
        </div>

        <v-row>
          <!-- Version A Strengths -->
          <v-col cols="12" md="6">
            <v-card variant="tonal" color="error" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-thumb-up</v-icon>
                Version A Strengths
              </v-card-title>
              <v-card-text>
                <v-list v-if="performanceComparison.versionAStrengths.length > 0" density="compact">
                  <v-list-item
                    v-for="strength in performanceComparison.versionAStrengths"
                    :key="strength"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="16" color="success">tabler-check</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ strength }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
                <div v-else class="text-body-2 text-medium-emphasis">
                  No significant strengths identified
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Version B Strengths -->
          <v-col cols="12" md="6">
            <v-card variant="tonal" color="success" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-thumb-up</v-icon>
                Version B Strengths
              </v-card-title>
              <v-card-text>
                <v-list v-if="performanceComparison.versionBStrengths.length > 0" density="compact">
                  <v-list-item
                    v-for="strength in performanceComparison.versionBStrengths"
                    :key="strength"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="16" color="success">tabler-check</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ strength }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
                <div v-else class="text-body-2 text-medium-emphasis">
                  No significant strengths identified
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Improvement Areas -->
        <div v-if="performanceComparison.improvementAreas.length > 0" class="mt-4">
          <h4 class="text-subtitle-1 mb-2">Areas for Improvement</h4>
          <v-card variant="tonal" color="warning">
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="area in performanceComparison.improvementAreas"
                  :key="area"
                  class="px-0"
                >
                  <template #prepend>
                    <v-icon size="16" color="warning">tabler-alert-triangle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ area }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </div>

        <!-- Detailed Analysis -->
        <div v-if="hasDetailedAnalysis" class="mt-4">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="me-2">tabler-chart-dots</v-icon>
                Detailed Analysis
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="detailed-analysis">
                  <div
                    v-for="(value, key) in performanceComparison.detailedAnalysis"
                    :key="key"
                    class="mb-2"
                  >
                    <strong>{{ formatAnalysisKey(key) }}:</strong>
                    <span class="ml-2">{{ formatAnalysisValue(value) }}</span>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VersionRecommendation, PerformanceComparison } from '@/types/content'

interface Props {
  recommendation: VersionRecommendation
  performanceComparison: PerformanceComparison
}

const props = defineProps<Props>()

// Computed properties
const hasDetailedAnalysis = computed(() => {
  return Object.keys(props.performanceComparison.detailedAnalysis).length > 0
})

// Methods
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'error'
}

const getRecommendationColor = (version: string) => {
  return version === 'A' ? 'error' : 'success'
}

const getWinnerColor = (winner: string) => {
  switch (winner) {
    case 'A':
      return 'error'
    case 'B':
      return 'success'
    default:
      return 'info'
  }
}

const getWinnerText = (winner: string) => {
  switch (winner) {
    case 'A':
      return 'Version A Wins'
    case 'B':
      return 'Version B Wins'
    default:
      return 'Tie'
  }
}

const getPerformanceGapColor = (gap: number) => {
  if (gap > 10) return 'text-error'
  if (gap > 5) return 'text-warning'
  return 'text-success'
}

const formatAnalysisKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const formatAnalysisValue = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}
</script>

<style scoped>
.detailed-analysis {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}
</style>