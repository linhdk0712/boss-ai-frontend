<template>
  <v-card variant="outlined" class="h-100">
    <v-card-title v-if="showTitle" class="d-flex align-center">
      <v-icon v-if="icon" class="me-2">{{ icon }}</v-icon>
      {{ title }}
    </v-card-title>
    
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-4">
        <!-- Version A Score -->
        <div class="text-center">
          <div class="text-body-2 text-medium-emphasis mb-1">Version A</div>
          <v-chip
            :color="getScoreColor(metric.versionAScore || 0)"
            variant="flat"
            :size="large ? 'default' : 'small'"
          >
            {{ formatScore(metric.versionAScore) }}
          </v-chip>
        </div>

        <!-- Comparison Arrow -->
        <div class="text-center mx-4">
          <v-icon
            :color="getWinnerColor(metric.winner)"
            :size="large ? 32 : 24"
          >
            {{ getComparisonIcon(metric.winner) }}
          </v-icon>
        </div>

        <!-- Version B Score -->
        <div class="text-center">
          <div class="text-body-2 text-medium-emphasis mb-1">Version B</div>
          <v-chip
            :color="getScoreColor(metric.versionBScore || 0)"
            variant="flat"
            :size="large ? 'default' : 'small'"
          >
            {{ formatScore(metric.versionBScore) }}
          </v-chip>
        </div>
      </div>

      <!-- Difference and Change -->
      <div class="text-center">
        <div
          :class="[
            large ? 'text-h5' : 'text-h6',
            getDifferenceColor(metric.difference)
          ]"
        >
          {{ metric.difference > 0 ? '+' : '' }}{{ metric.difference.toFixed(2) }}
        </div>
        
        <div class="text-body-2 text-medium-emphasis">
          {{ Math.abs(metric.percentageChange).toFixed(1) }}% {{ metric.percentageChange > 0 ? 'increase' : 'decrease' }}
        </div>
        
        <!-- Significance Badge -->
        <v-chip
          :color="getSignificanceColor(metric.significance)"
          variant="tonal"
          size="small"
          class="mt-2"
        >
          {{ formatSignificance(metric.significance) }}
        </v-chip>
      </div>

      <!-- Winner Badge -->
      <div v-if="metric.winner !== 'TIE'" class="text-center mt-3">
        <v-chip
          :color="getWinnerColor(metric.winner)"
          variant="flat"
          size="small"
        >
          <v-icon start>{{ getWinnerIcon(metric.winner) }}</v-icon>
          Version {{ metric.winner }} Wins
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ScoreComparison } from '@/types/content'

interface Props {
  title: string
  metric: ScoreComparison
  icon?: string
  showTitle?: boolean
  large?: boolean
}

withDefaults(defineProps<Props>(), {
  showTitle: true,
  large: false
})

// Methods
const formatScore = (score?: number) => {
  if (score === undefined || score === null) return 'N/A'
  return score.toFixed(1)
}

const getScoreColor = (score: number) => {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  if (score >= 4) return 'info'
  return 'error'
}

const getDifferenceColor = (difference: number) => {
  if (difference > 0) return 'text-success'
  if (difference < 0) return 'text-error'
  return 'text-medium-emphasis'
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

const getComparisonIcon = (winner: string) => {
  switch (winner) {
    case 'A':
      return 'tabler-arrow-left'
    case 'B':
      return 'tabler-arrow-right'
    default:
      return 'tabler-equal'
  }
}

const getWinnerIcon = (winner: string) => {
  switch (winner) {
    case 'A':
      return 'tabler-trophy'
    case 'B':
      return 'tabler-trophy'
    default:
      return 'tabler-equal'
  }
}

const getSignificanceColor = (significance: string) => {
  switch (significance) {
    case 'MAJOR':
      return 'error'
    case 'MINOR':
      return 'warning'
    case 'NEGLIGIBLE':
      return 'info'
    default:
      return 'default'
  }
}

const formatSignificance = (significance: string) => {
  switch (significance) {
    case 'MAJOR':
      return 'Major Change'
    case 'MINOR':
      return 'Minor Change'
    case 'NEGLIGIBLE':
      return 'Negligible'
    default:
      return significance
  }
}
</script>