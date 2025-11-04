<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            <v-icon class="me-2">tabler-chart-bar</v-icon>
            Performance Metrics
            <v-spacer />
            <v-btn icon="tabler-refresh" variant="text" size="small" :loading="isLoadingStatistics"
                @click="refreshStatistics" />
        </v-card-title>

        <v-card-text>
            <!-- Loading State -->
            <div v-if="isLoadingStatistics" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" />
                <p class="text-body-2 mt-4">Loading performance metrics...</p>
            </div>

            <!-- Statistics Content -->
            <div v-else-if="statistics">
                <!-- Overview Cards -->
                <v-row class="mb-4">
                    <v-col cols="12" sm="6" md="3">
                        <v-card variant="tonal" color="primary">
                            <v-card-text class="text-center">
                                <div class="text-h4">{{ statistics.totalVersions }}</div>
                                <div class="text-body-2">Total Versions</div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                        <v-card variant="tonal" color="success">
                            <v-card-text class="text-center">
                                <div class="text-h4">v{{ statistics.latestVersion }}</div>
                                <div class="text-body-2">Latest Version</div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                        <v-card variant="tonal" color="info">
                            <v-card-text class="text-center">
                                <div class="text-h4">{{ statistics.branchCount }}</div>
                                <div class="text-body-2">Branches</div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" md="3">
                        <v-card variant="tonal" color="warning">
                            <v-card-text class="text-center">
                                <div class="text-h4">{{ statistics.tagCount }}</div>
                                <div class="text-body-2">Tags</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Quality Metrics -->
                <div v-if="hasQualityMetrics" class="mb-4">
                    <h4 class="text-h6 mb-3">Average Quality Scores</h4>
                    <v-row>
                        <v-col v-if="statistics.averageQualityScore" cols="12" md="4">
                            <MetricCard title="Quality Score" :value="statistics.averageQualityScore" icon="tabler-star"
                                :color="getScoreColor(statistics.averageQualityScore)" />
                        </v-col>

                        <v-col v-if="statistics.averageReadabilityScore" cols="12" md="4">
                            <MetricCard title="Readability" :value="statistics.averageReadabilityScore"
                                icon="tabler-book" :color="getScoreColor(statistics.averageReadabilityScore)" />
                        </v-col>

                        <v-col v-if="statistics.averageSeoScore" cols="12" md="4">
                            <MetricCard title="SEO Score" :value="statistics.averageSeoScore" icon="tabler-search"
                                :color="getScoreColor(statistics.averageSeoScore)" />
                        </v-col>
                    </v-row>
                </div>

                <!-- Resource Usage -->
                <div class="mb-4">
                    <h4 class="text-h6 mb-3">Resource Usage</h4>
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-card variant="outlined">
                                <v-card-title class="d-flex align-center">
                                    <v-icon class="me-2">tabler-coins</v-icon>
                                    Total Tokens
                                </v-card-title>
                                <v-card-text>
                                    <div class="text-h5">{{ formatNumber(statistics.totalTokensUsed) }}</div>
                                    <div class="text-body-2 text-medium-emphasis">
                                        Avg: {{ formatNumber(Math.round(statistics.totalTokensUsed /
                                        statistics.totalVersions)) }} per version
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-card variant="outlined">
                                <v-card-title class="d-flex align-center">
                                    <v-icon class="me-2">tabler-currency-dollar</v-icon>
                                    Total Cost
                                </v-card-title>
                                <v-card-text>
                                    <div class="text-h5">${{ statistics.totalCost.toFixed(4) }}</div>
                                    <div class="text-body-2 text-medium-emphasis">
                                        Avg: ${{ (statistics.totalCost / statistics.totalVersions).toFixed(4) }} per
                                        version
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-card variant="outlined">
                                <v-card-title class="d-flex align-center">
                                    <v-icon class="me-2">tabler-clock</v-icon>
                                    Avg Processing Time
                                </v-card-title>
                                <v-card-text>
                                    <div class="text-h5">{{ formatTime(statistics.averageProcessingTime) }}</div>
                                    <div class="text-body-2 text-medium-emphasis">
                                        Per generation request
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>

                <!-- Performance Trends Chart -->
                <div v-if="showTrends">
                    <h4 class="text-h6 mb-3">Performance Trends</h4>
                    <v-card variant="outlined">
                        <v-card-text>
                            <div class="text-center py-8">
                                <v-icon size="64" color="grey-lighten-1">tabler-chart-line</v-icon>
                                <h3 class="text-h6 mt-4">Performance Trends</h3>
                                <p class="text-body-2 text-medium-emphasis">
                                    Detailed performance trends will be available with more version data.
                                </p>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">tabler-chart-bar-off</v-icon>
                <h3 class="text-h6 mt-4">No Metrics Available</h3>
                <p class="text-body-2 text-medium-emphasis">
                    Performance metrics will appear once content versions are created.
                </p>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useContentVersioning } from '@/composables/useContentVersioning'
import MetricCard from './MetricCard.vue'

interface Props {
    contentId: number
    autoLoad?: boolean
    showTrends?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    autoLoad: true,
    showTrends: false
})

// Composables
const {
    versionStatistics: statistics,
    isLoadingStatistics,
    loadVersionStatistics
} = useContentVersioning(computed(() => props.contentId))

// Computed properties
const hasQualityMetrics = computed(() => {
    return statistics.value?.averageQualityScore ||
        statistics.value?.averageReadabilityScore ||
        statistics.value?.averageSeoScore
})

// Methods
const getScoreColor = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'error'
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
}

const formatTime = (milliseconds: number) => {
    if (milliseconds < 1000) {
        return `${milliseconds}ms`
    }
    return `${(milliseconds / 1000).toFixed(1)}s`
}

const refreshStatistics = () => {
    loadVersionStatistics()
}

// Lifecycle
onMounted(() => {
    if (props.autoLoad) {
        loadVersionStatistics()
    }
})

// Watch for contentId changes
watch(() => props.contentId, () => {
    if (props.autoLoad) {
        loadVersionStatistics()
    }
})

// Expose methods for parent components
defineExpose({
    loadVersionStatistics,
    refresh: refreshStatistics
})
</script>