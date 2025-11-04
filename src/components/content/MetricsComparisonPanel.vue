<template>
  <v-card variant="outlined">
    <v-card-title>Performance Metrics Comparison</v-card-title>
    
    <v-card-text>
      <!-- Quality Metrics -->
      <div v-if="hasQualityMetrics" class="mb-6">
        <h4 class="text-h6 mb-4">Quality Metrics</h4>
        
        <v-row>
          <v-col
            v-if="comparison.qualityScore"
            cols="12"
            md="6"
            lg="3"
          >
            <MetricComparisonCard
              title="Quality Score"
              :metric="comparison.qualityScore"
              icon="tabler-star"
            />
          </v-col>
          
          <v-col
            v-if="comparison.readabilityScore"
            cols="12"
            md="6"
            lg="3"
          >
            <MetricComparisonCard
              title="Readability"
              :metric="comparison.readabilityScore"
              icon="tabler-book"
            />
          </v-col>
          
          <v-col
            v-if="comparison.seoScore"
            cols="12"
            md="6"
            lg="3"
          >
            <MetricComparisonCard
              title="SEO Score"
              :metric="comparison.seoScore"
              icon="tabler-search"
            />
          </v-col>
          
          <v-col
            v-if="comparison.sentimentScore"
            cols="12"
            md="6"
            lg="3"
          >
            <MetricComparisonCard
              title="Sentiment"
              :metric="comparison.sentimentScore"
              icon="tabler-mood-smile"
            />
          </v-col>
        </v-row>
        
        <!-- Overall Score -->
        <v-row v-if="comparison.overallScore">
          <v-col cols="12" md="6">
            <v-card variant="tonal" color="primary">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-trophy</v-icon>
                Overall Performance Score
              </v-card-title>
              <v-card-text>
                <MetricComparisonCard
                  title=""
                  :metric="comparison.overallScore"
                  :show-title="false"
                  large
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Performance Metrics -->
      <div v-if="hasPerformanceMetrics" class="mb-6">
        <h4 class="text-h6 mb-4">Performance Metrics</h4>
        
        <v-row>
          <v-col
            v-if="comparison.processingTimeDifference !== undefined"
            cols="12"
            md="4"
          >
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-clock</v-icon>
                Processing Time
              </v-card-title>
              <v-card-text>
                <div class="text-center">
                  <div
                    class="text-h4"
                    :class="getPerformanceChangeColor(comparison.processingTimeDifference)"
                  >
                    {{ comparison.processingTimeDifference > 0 ? '+' : '' }}{{ formatTime(comparison.processingTimeDifference) }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ comparison.processingTimeDifference > 0 ? 'Slower' : 'Faster' }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col
            v-if="comparison.costDifference !== undefined"
            cols="12"
            md="4"
          >
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-currency-dollar</v-icon>
                Generation Cost
              </v-card-title>
              <v-card-text>
                <div class="text-center">
                  <div
                    class="text-h4"
                    :class="getPerformanceChangeColor(comparison.costDifference)"
                  >
                    {{ comparison.costDifference > 0 ? '+' : '' }}${{ Math.abs(comparison.costDifference).toFixed(4) }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ comparison.costDifference > 0 ? 'More Expensive' : 'Cheaper' }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col
            v-if="comparison.tokenUsageDifference !== undefined"
            cols="12"
            md="4"
          >
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">tabler-coins</v-icon>
                Token Usage
              </v-card-title>
              <v-card-text>
                <div class="text-center">
                  <div
                    class="text-h4"
                    :class="getPerformanceChangeColor(comparison.tokenUsageDifference)"
                  >
                    {{ comparison.tokenUsageDifference > 0 ? '+' : '' }}{{ comparison.tokenUsageDifference }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ comparison.tokenUsageDifference > 0 ? 'More Tokens' : 'Fewer Tokens' }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- No Metrics Available -->
      <div v-if="!hasQualityMetrics && !hasPerformanceMetrics" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">tabler-chart-line</v-icon>
        <h3 class="text-h6 mt-4">No Metrics Available</h3>
        <p class="text-body-2 text-medium-emphasis">
          Performance metrics are not available for these versions.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetricComparison } from '@/types/content'
import MetricComparisonCard from './MetricComparisonCard.vue'

interface Props {
  comparison: MetricComparison
}

const props = defineProps<Props>()

// Computed properties
const hasQualityMetrics = computed(() => {
  return props.comparison.qualityScore ||
         props.comparison.readabilityScore ||
         props.comparison.seoScore ||
         props.comparison.sentimentScore ||
         props.comparison.overallScore
})

const hasPerformanceMetrics = computed(() => {
  return props.comparison.processingTimeDifference !== undefined ||
         props.comparison.costDifference !== undefined ||
         props.comparison.tokenUsageDifference !== undefined
})

// Methods
const getPerformanceChangeColor = (value: number) => {
  if (value > 0) return 'text-error'
  if (value < 0) return 'text-success'
  return 'text-medium-emphasis'
}

const formatTime = (milliseconds: number) => {
  const absMs = Math.abs(milliseconds)
  if (absMs < 1000) {
    return `${absMs}ms`
  }
  return `${(absMs / 1000).toFixed(1)}s`
}
</script>