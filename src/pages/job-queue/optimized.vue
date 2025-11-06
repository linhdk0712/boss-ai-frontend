<template>
    <div class="optimized-job-queue-page">
        <!-- Page Header -->
        <div class="page-header mb-6">
            <div class="d-flex align-center justify-space-between">
                <div>
                    <h1 class="text-h4 font-weight-bold mb-2">Job Queue Management</h1>
                    <p class="text-body-1 text-medium-emphasis">
                        Monitor and manage your content generation jobs with optimized performance
                    </p>
                </div>

                <div class="d-flex align-center ga-3">
                    <!-- Performance Indicator -->
                    <v-chip v-if="averageRequestTime" size="small" variant="tonal" color="info"
                        prepend-icon="mdi-speedometer">
                        {{ averageRequestTime }}
                    </v-chip>

                    <!-- Auto-refresh Toggle -->
                    <v-btn-toggle v-model="autoRefreshEnabled" mandatory variant="outlined" density="compact">
                        <v-btn :value="true" size="small">
                            <v-icon>mdi-refresh-auto</v-icon>
                        </v-btn>
                        <v-btn :value="false" size="small">
                            <v-icon>mdi-refresh-off</v-icon>
                        </v-btn>
                    </v-btn-toggle>

                    <!-- Refresh Button -->
                    <v-btn color="primary" variant="tonal" :loading="loading" @click="handleRefresh">
                        <v-icon start>mdi-refresh</v-icon>
                        Refresh
                    </v-btn>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div v-if="statistics" class="statistics-section mb-6">
            <v-row>
                <v-col cols="12" sm="6" md="3">
                    <MetricCard title="Total Jobs" :value="statistics.totalJobs" icon="mdi-briefcase-outline"
                        color="primary" />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                    <MetricCard title="Completed" :value="statistics.completedJobs"
                        :percentage="statistics.successRate * 100" icon="mdi-check-circle" color="success" />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                    <MetricCard title="Processing" :value="statistics.processingJobs + statistics.queuedJobs"
                        icon="mdi-cog" color="warning" />
                </v-col>

                <v-col cols="12" sm="6" md="3">
                    <MetricCard title="Failed" :value="statistics.failedJobs" icon="mdi-alert-circle" color="error" />
                </v-col>
            </v-row>
        </div>

        <!-- Filters Section -->
        <OptimizedJobFilters :filters="filters" :loading="loading || searchLoading"
            :available-content-types="availableContentTypes" :content-types-loading="contentTypesLoading"
            @filter-change="handleFilterChange" @search-change="handleSearchChange" @sort-change="handleSortChange"
            @clear-filters="handleClearFilters" @load-content-types="loadContentTypes" />

        <!-- View Toggle -->
        <div class="view-controls mb-4">
            <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                    <v-btn-toggle v-model="viewMode" mandatory variant="outlined" density="compact">
                        <v-btn value="virtual" size="small">
                            <v-icon>mdi-view-list</v-icon>
                            Virtual
                        </v-btn>
                        <v-btn value="standard" size="small">
                            <v-icon>mdi-table</v-icon>
                            Standard
                        </v-btn>
                    </v-btn-toggle>

                    <v-divider vertical class="mx-2" />

                    <v-select v-model="pageSize" :items="pageSizeOptions" label="Page Size" variant="outlined"
                        density="compact" hide-details style="width: 120px;"
                        @update:model-value="handlePageSizeChange" />
                </div>

                <div class="d-flex align-center ga-2 text-body-2 text-medium-emphasis">
                    <span>{{ jobs.length }} of {{ totalItems }} jobs</span>
                    <v-chip v-if="isFiltered" size="small" color="primary" variant="tonal">
                        Filtered
                    </v-chip>
                </div>
            </div>
        </div>

        <!-- Job Table (Virtual or Standard) -->
        <div class="job-table-container">
            <!-- Virtual Scrolling Table -->
            <VirtualJobTable v-if="viewMode === 'virtual'" :jobs="jobs" :loading="loading" :total-items="totalItems"
                :has-more="hasMore" @retry-job="handleRetryJob" @generate-video="handleGenerateVideo"
                @view-details="handleViewDetails" @sort-change="handleSortChange" @load-more="handleLoadMore"
                @clear-filters="handleClearFilters" />

            <!-- Standard Table -->
            <JobTable v-else :jobs="jobs" :loading="loading" :pagination="pagination" @retry-job="handleRetryJob"
                @generate-video="handleGenerateVideo" @view-details="handleViewDetails" @page-change="handlePageChange"
                @sort-change="handleSortChange" @clear-filters="handleClearFilters" />
        </div>

        <!-- Load More Button (for virtual scrolling) -->
        <div v-if="viewMode === 'virtual' && hasMore" class="load-more-section mt-4 text-center">
            <v-btn color="primary" variant="outlined" :loading="loading" @click="handleLoadMore">
                <v-icon start>mdi-plus</v-icon>
                Load More Jobs
            </v-btn>
        </div>

        <!-- Job Details Modal -->
        <JobDetailsModal v-model="showDetailsModal" :job="selectedJob" @download="handleDownload"
            @close="showDetailsModal = false" />

        <!-- Video Generation Dialog -->
        <VideoGenerationDialog v-model="showVideoDialog" :job="selectedJob" @video-started="handleVideoStarted"
            @close="showVideoDialog = false" />

        <!-- Error State -->
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4" closable @click:close="error = null">
            <template #title>
                Error Loading Jobs
            </template>
            {{ error }}
            <template #append>
                <v-btn variant="text" size="small" @click="handleRefresh">
                    Retry
                </v-btn>
            </template>
        </v-alert>

        <!-- Performance Debug Panel (Development Only) -->
        <v-expansion-panels v-if="isDevelopment" class="mt-6" variant="accordion">
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <v-icon class="me-2">mdi-bug</v-icon>
                    Performance Debug
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="debug-info">
                        <v-row>
                            <v-col cols="12" md="6">
                                <h4>Request Metrics</h4>
                                <ul>
                                    <li>Average Request Time: {{ averageRequestTime || 'N/A' }}</li>
                                    <li>Total Requests: {{ requestCount }}</li>
                                    <li>Cache Hit Rate: {{ cacheHitRate }}%</li>
                                    <li>Jobs in Memory: {{ jobs.length }}</li>
                                </ul>
                            </v-col>
                            <v-col cols="12" md="6">
                                <h4>Current State</h4>
                                <ul>
                                    <li>View Mode: {{ viewMode }}</li>
                                    <li>Page Size: {{ pageSize }}</li>
                                    <li>Current Page: {{ currentPage }}</li>
                                    <li>Auto Refresh: {{ autoRefreshEnabled ? 'On' : 'Off' }}</li>
                                </ul>
                            </v-col>
                        </v-row>

                        <v-divider class="my-4" />

                        <div class="d-flex ga-2">
                            <v-btn size="small" variant="outlined" @click="clearCache">
                                Clear Cache
                            </v-btn>
                            <v-btn size="small" variant="outlined" @click="logPerformanceMetrics">
                                Log Metrics
                            </v-btn>
                        </div>
                    </div>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOptimizedJobQueue } from '@/composables/useOptimizedJobQueue'
import { useToastNotifications } from '@/composables/useToastNotifications'
import VirtualJobTable from '@/components/content/VirtualJobTable.vue'
import JobTable from '@/components/content/JobTable.vue'
import OptimizedJobFilters from '@/components/content/OptimizedJobFilters.vue'
import JobDetailsModal from '@/components/content/JobDetailsModal.vue'
import VideoGenerationDialog from '@/components/content/VideoGenerationDialog.vue'
import MetricCard from '@/components/content/MetricCard.vue'
import type { Job } from '@/types/content'

// Page metadata
definePage({
    name: 'job-queue-optimized',
    meta: {
        title: 'Optimized Job Queue',
        requiresAuth: true,
        action: 'read',
        subject: 'Content'
    }
})

// Composables
const router = useRouter()
const { showSuccess, showError } = useToastNotifications()

// Job queue management
const {
    jobs,
    totalItems,
    loading,
    searchLoading,
    contentTypesLoading,
    error,
    currentPage,
    pageSize,
    filters,
    pagination,
    hasMore,
    isFiltered,
    statistics,
    availableContentTypes,
    averageRequestTime,
    requestCount,
    loadJobs,
    loadMore,
    searchJobs,
    updateFilters,
    clearFilters,
    updateSort,
    loadContentTypes,
    retryJob,
    generateVideo,
    refresh,
    clearCache,
    startAutoRefresh,
    stopAutoRefresh
} = useOptimizedJobQueue()

// Local state
const viewMode = ref<'virtual' | 'standard'>('virtual')
const autoRefreshEnabled = ref(true)
const showDetailsModal = ref(false)
const showVideoDialog = ref(false)
const selectedJob = ref<Job | null>(null)

// Page size options
const pageSizeOptions = [
    { title: '10', value: 10 },
    { title: '25', value: 25 },
    { title: '50', value: 50 },
    { title: '100', value: 100 }
]

// Development mode check
const isDevelopment = computed(() => {
    return import.meta.env.DEV
})

// Performance metrics
const cacheHitRate = ref(0)

// Event handlers
const handleFilterChange = async (newFilters: any) => {
    await updateFilters(newFilters)
}

const handleSearchChange = async (searchText: string) => {
    await searchJobs(searchText)
}

const handleSortChange = async (sortBy: string, sortOrder: 'asc' | 'desc') => {
    await updateSort(sortBy, sortOrder)
}

const handleClearFilters = async () => {
    await clearFilters()
}

const handlePageChange = async (page: number) => {
    currentPage.value = page
    await loadJobs(true)
}

const handlePageSizeChange = async (newSize: number) => {
    pageSize.value = newSize
    currentPage.value = 0
    await loadJobs(true)
}

const handleLoadMore = async () => {
    await loadMore()
}

const handleRefresh = async () => {
    await refresh()
    showSuccess('Jobs refreshed successfully')
}

const handleRetryJob = async (job: Job) => {
    await retryJob(job)
}

const handleGenerateVideo = async (job: Job) => {
    selectedJob.value = job
    showVideoDialog.value = true
}

const handleViewDetails = (job: Job) => {
    selectedJob.value = job
    showDetailsModal.value = true
}

const handleDownload = async (job: Job, format: string) => {
    try {
        // Implementation would depend on your download service
        showSuccess(`Downloading job #${job.id} as ${format.toUpperCase()}`)
    } catch (err: any) {
        showError('Download failed', err.message)
    }
}

const handleVideoStarted = (job: Job) => {
    showSuccess(`Video generation started for job #${job.id}`)
    showVideoDialog.value = false
}

// Performance debugging
const logPerformanceMetrics = () => {
    console.group('Job Queue Performance Metrics')
    console.log('Average Request Time:', averageRequestTime.value)
    console.log('Total Requests:', requestCount.value)
    console.log('Jobs in Memory:', jobs.value.length)
    console.log('Cache Hit Rate:', cacheHitRate.value + '%')
    console.log('Current View Mode:', viewMode.value)
    console.log('Auto Refresh:', autoRefreshEnabled.value)
    console.groupEnd()
}

// Watch auto-refresh toggle
watch(autoRefreshEnabled, (enabled) => {
    if (enabled) {
        startAutoRefresh()
    } else {
        stopAutoRefresh()
    }
})

// Watch view mode changes
watch(viewMode, (newMode) => {
    // Adjust page size based on view mode
    if (newMode === 'virtual' && pageSize.value < 25) {
        pageSize.value = 25
    } else if (newMode === 'standard' && pageSize.value > 50) {
        pageSize.value = 25
    }
})

// Lifecycle
onMounted(() => {
    // Start with auto-refresh enabled
    if (autoRefreshEnabled.value) {
        startAutoRefresh()
    }
})
</script>

<style scoped>
.optimized-job-queue-page {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.statistics-section {
    margin-bottom: 24px;
}

.view-controls {
    background-color: rgb(var(--v-theme-surface));
    border-radius: 8px;
    padding: 16px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.job-table-container {
    background-color: rgb(var(--v-theme-surface));
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.load-more-section {
    padding: 16px;
}

.debug-info {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.875rem;
}

.debug-info h4 {
    margin-bottom: 8px;
    color: rgb(var(--v-theme-primary));
}

.debug-info ul {
    list-style: none;
    padding: 0;
}

.debug-info li {
    padding: 2px 0;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
    .optimized-job-queue-page {
        padding: 16px;
    }

    .page-header {
        padding: 16px;
    }
}

@media (max-width: 959px) {
    .optimized-job-queue-page {
        padding: 12px;
    }

    .page-header {
        padding: 12px;
    }

    .page-header .d-flex {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .view-controls .d-flex {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}

@media (max-width: 599px) {
    .statistics-section .v-col {
        padding: 8px;
    }
}

/* Performance optimizations */
.job-table-container {
    contain: layout style paint;
}

/* Smooth transitions */
.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
    transition: opacity 0.2s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
    opacity: 0;
}
</style>