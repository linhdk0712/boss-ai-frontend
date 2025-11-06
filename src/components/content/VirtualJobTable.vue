<template>
    <div class="virtual-job-table">
        <!-- Table Header -->
        <div class="table-header elevation-1">
            <div class="header-row">
                <div v-for="header in headers" :key="header.key" :class="getHeaderClass(header)"
                    @click="handleSort(header)">
                    <span>{{ header.title }}</span>
                    <v-icon v-if="header.sortable && sortBy === header.key" size="16" class="ms-1">
                        {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                </div>
            </div>
        </div>

        <!-- Virtual Scrolling Container -->
        <div ref="scrollContainer" class="scroll-container" @scroll="handleScroll">
            <div class="scroll-content" :style="{ height: `${totalHeight}px` }">
                <!-- Loading State -->
                <div v-if="loading && jobs.length === 0" class="loading-state">
                    <JobTableSkeleton :rows="10" />
                </div>

                <!-- Virtual Items -->
                <div v-else class="virtual-items" :style="{ transform: `translateY(${offsetY}px)` }">
                    <div v-for="(job, index) in visibleJobs" :key="job.id" class="table-row"
                        :class="{ 'row-hover': hoveredRow === job.id }" :style="{ height: `${itemHeight}px` }"
                        @mouseenter="hoveredRow = job.id" @mouseleave="hoveredRow = null"
                        @click="$emit('view-details', job)">

                        <!-- Job ID -->
                        <div class="cell cell-id">
                            <v-chip size="small" variant="outlined" color="primary" class="font-mono">
                                #{{ job.id }}
                            </v-chip>
                        </div>

                        <!-- Content Type -->
                        <div class="cell cell-content-type">
                            <v-chip size="small" variant="tonal" :color="getContentTypeColor(job.contentType)">
                                <v-icon start size="16">
                                    {{ getContentTypeIcon(job.contentType) }}
                                </v-icon>
                                {{ formatContentType(job.contentType) }}
                            </v-chip>
                        </div>

                        <!-- Status -->
                        <div class="cell cell-status">
                            <v-chip :color="getStatusColor(job.status)" variant="tonal" size="small">
                                <v-icon start size="16">
                                    {{ getStatusIcon(job.status) }}
                                </v-icon>
                                {{ job.status }}
                            </v-chip>
                        </div>

                        <!-- Created At -->
                        <div class="cell cell-created">
                            <div class="text-body-2">
                                <div>{{ formatDate(job.createdAt) }}</div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ formatTime(job.createdAt) }}
                                </div>
                            </div>
                        </div>

                        <!-- Completed At -->
                        <div class="cell cell-completed">
                            <div v-if="job.completedAt" class="text-body-2">
                                <div>{{ formatDate(job.completedAt) }}</div>
                                <div class="text-caption text-medium-emphasis">
                                    {{ formatTime(job.completedAt) }}
                                </div>
                            </div>
                            <span v-else class="text-medium-emphasis">—</span>
                        </div>

                        <!-- Execution Time -->
                        <div class="cell cell-duration">
                            <div v-if="job.executionTimeMs" class="text-body-2">
                                {{ formatExecutionTime(job.executionTimeMs) }}
                            </div>
                            <span v-else class="text-medium-emphasis">—</span>
                        </div>

                        <!-- Retry Count -->
                        <div class="cell cell-retries">
                            <v-chip v-if="job.retryCount > 0" size="small" variant="outlined" color="warning">
                                {{ job.retryCount }} retries
                            </v-chip>
                            <span v-else class="text-medium-emphasis">—</span>
                        </div>

                        <!-- Actions -->
                        <div class="cell cell-actions">
                            <JobActions :job="job" :loading="loading" @retry="$emit('retry-job', job)"
                                @generate-video="$emit('generate-video', job)"
                                @view-details="$emit('view-details', job)" />
                        </div>
                    </div>
                </div>

                <!-- Load More Indicator -->
                <div v-if="loading && jobs.length > 0" class="load-more-indicator">
                    <v-progress-circular indeterminate size="24" />
                    <span class="ms-2">Loading more jobs...</span>
                </div>
            </div>
        </div>

        <!-- No Data State -->
        <div v-if="!loading && jobs.length === 0" class="no-data-state">
            <v-icon size="64" color="medium-emphasis" class="mb-4">
                mdi-briefcase-search-outline
            </v-icon>
            <h3 class="text-h6 mb-2">No Jobs Found</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
                No jobs match your current filters. Try adjusting your search criteria.
            </p>
            <v-btn color="primary" variant="outlined" @click="$emit('clear-filters')">
                Clear Filters
            </v-btn>
        </div>

        <!-- Pagination Info -->
        <div v-if="jobs.length > 0" class="pagination-info">
            <div class="d-flex align-center justify-space-between pa-4">
                <div class="text-body-2 text-medium-emphasis">
                    Showing {{ visibleRange.start + 1 }} to {{ visibleRange.end }} of {{ totalItems }} jobs
                </div>
                <div class="d-flex align-center ga-2">
                    <v-btn v-if="hasMore" variant="outlined" size="small" :loading="loading" @click="loadMore">
                        Load More
                    </v-btn>
                    <v-btn variant="text" size="small" @click="scrollToTop">
                        <v-icon>mdi-arrow-up</v-icon>
                        Top
                    </v-btn>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import JobActions from './JobActions.vue'
import JobTableSkeleton from './JobTableSkeleton.vue'
import type { Job } from '@/types/content'

// Props
interface Props {
    jobs: Job[]
    loading: boolean
    totalItems: number
    hasMore: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'retry-job': [job: Job]
    'generate-video': [job: Job]
    'view-details': [job: Job]
    'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
    'load-more': []
    'clear-filters': []
}>()

// Virtual scrolling configuration
const itemHeight = 80 // Height of each row in pixels
const containerHeight = 600 // Height of the scroll container
const overscan = 5 // Number of items to render outside visible area

// Refs
const scrollContainer = ref<HTMLElement>()
const scrollTop = ref(0)
const hoveredRow = ref<number | null>(null)

// Sorting state
const sortBy = ref<string>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Table headers configuration
const headers = [
    { title: 'Job ID', key: 'id', sortable: true, width: '100px', class: 'cell-id' },
    { title: 'Content Type', key: 'contentType', sortable: true, width: '150px', class: 'cell-content-type' },
    { title: 'Status', key: 'status', sortable: true, width: '120px', class: 'cell-status' },
    { title: 'Created', key: 'createdAt', sortable: true, width: '140px', class: 'cell-created' },
    { title: 'Completed', key: 'completedAt', sortable: true, width: '140px', class: 'cell-completed' },
    { title: 'Duration', key: 'executionTimeMs', sortable: true, width: '100px', class: 'cell-duration' },
    { title: 'Retries', key: 'retryCount', sortable: true, width: '100px', class: 'cell-retries' },
    { title: 'Actions', key: 'actions', sortable: false, width: '150px', class: 'cell-actions' }
]

// Virtual scrolling computed properties
const totalHeight = computed(() => props.jobs.length * itemHeight)

const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount + overscan, props.jobs.length)

    return {
        start: Math.max(0, start - overscan),
        end
    }
})

const visibleJobs = computed(() => {
    const { start, end } = visibleRange.value
    return props.jobs.slice(start, end)
})

const offsetY = computed(() => visibleRange.value.start * itemHeight)

// Throttled scroll handler for better performance
const handleScroll = useThrottleFn((event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop

    // Check if we need to load more data
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
    if (scrollPercentage > 0.8 && props.hasMore && !props.loading) {
        emit('load-more')
    }
}, 16) // ~60fps

// Methods
const handleSort = (header: any) => {
    if (!header.sortable) return

    if (sortBy.value === header.key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy.value = header.key
        sortOrder.value = 'desc'
    }

    emit('sort-change', sortBy.value, sortOrder.value)
}

const getHeaderClass = (header: any) => {
    return [
        'header-cell',
        header.class,
        {
            'sortable': header.sortable,
            'sorted': header.sortable && sortBy.value === header.key
        }
    ]
}

const loadMore = () => {
    emit('load-more')
}

const scrollToTop = () => {
    if (scrollContainer.value) {
        scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

// Utility functions (memoized for performance)
const statusColorCache = new Map<string, string>()
const getStatusColor = (status: string) => {
    if (statusColorCache.has(status)) {
        return statusColorCache.get(status)!
    }

    let color: string
    switch (status?.toLowerCase()) {
        case 'completed':
            color = 'success'
            break
        case 'processing':
            color = 'warning'
            break
        case 'failed':
            color = 'error'
            break
        case 'pending':
            color = 'info'
            break
        case 'cancelled':
            color = 'secondary'
            break
        default:
            color = 'primary'
    }

    statusColorCache.set(status, color)
    return color
}

const statusIconCache = new Map<string, string>()
const getStatusIcon = (status: string) => {
    if (statusIconCache.has(status)) {
        return statusIconCache.get(status)!
    }

    let icon: string
    switch (status?.toLowerCase()) {
        case 'completed':
            icon = 'mdi-check-circle'
            break
        case 'processing':
            icon = 'mdi-loading'
            break
        case 'failed':
            icon = 'mdi-alert-circle'
            break
        case 'pending':
            icon = 'mdi-clock-outline'
            break
        case 'cancelled':
            icon = 'mdi-cancel'
            break
        default:
            icon = 'mdi-help-circle'
    }

    statusIconCache.set(status, icon)
    return icon
}

const contentTypeColorCache = new Map<string, string>()
const getContentTypeColor = (contentType: string) => {
    if (contentTypeColorCache.has(contentType)) {
        return contentTypeColorCache.get(contentType)!
    }

    let color: string
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            color = 'primary'
            break
        case 'social_media':
            color = 'secondary'
            break
        case 'email':
            color = 'info'
            break
        case 'video_script':
            color = 'warning'
            break
        case 'product_description':
            color = 'success'
            break
        default:
            color = 'primary'
    }

    contentTypeColorCache.set(contentType, color)
    return color
}

const contentTypeIconCache = new Map<string, string>()
const getContentTypeIcon = (contentType: string) => {
    if (contentTypeIconCache.has(contentType)) {
        return contentTypeIconCache.get(contentType)!
    }

    let icon: string
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            icon = 'mdi-post'
            break
        case 'social_media':
            icon = 'mdi-share-variant'
            break
        case 'email':
            icon = 'mdi-email'
            break
        case 'video_script':
            icon = 'mdi-video'
            break
        case 'product_description':
            icon = 'mdi-package-variant'
            break
        default:
            icon = 'mdi-file-document'
    }

    contentTypeIconCache.set(contentType, icon)
    return icon
}

const formatContentType = (contentType: string) => {
    return contentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

// Date formatting with caching
const dateFormatCache = new Map<string, string>()
const formatDate = (dateString: string) => {
    if (!dateString) return ''

    if (dateFormatCache.has(dateString)) {
        return dateFormatCache.get(dateString)!
    }

    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    dateFormatCache.set(dateString, formatted)
    return formatted
}

const timeFormatCache = new Map<string, string>()
const formatTime = (dateString: string) => {
    if (!dateString) return ''

    if (timeFormatCache.has(dateString)) {
        return timeFormatCache.get(dateString)!
    }

    const date = new Date(dateString)
    const formatted = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })

    timeFormatCache.set(dateString, formatted)
    return formatted
}

const executionTimeCache = new Map<number, string>()
const formatExecutionTime = (ms: number) => {
    if (!ms) return ''

    if (executionTimeCache.has(ms)) {
        return executionTimeCache.get(ms)!
    }

    let formatted: string
    if (ms < 1000) {
        formatted = `${ms}ms`
    } else if (ms < 60000) {
        formatted = `${(ms / 1000).toFixed(1)}s`
    } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        formatted = `${minutes}m ${seconds}s`
    }

    executionTimeCache.set(ms, formatted)
    return formatted
}

// Lifecycle
onMounted(() => {
    // Set initial container height
    if (scrollContainer.value) {
        scrollContainer.value.style.height = `${containerHeight}px`
    }
})

// Watch for jobs changes and reset scroll position if needed
watch(() => props.jobs.length, (newLength, oldLength) => {
    // If jobs were cleared (e.g., new search), scroll to top
    if (newLength === 0 || (oldLength > 0 && newLength < oldLength / 2)) {
        scrollToTop()
    }
})
</script>

<style scoped>
.virtual-job-table {
    border-radius: 8px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    overflow: hidden;
}

.table-header {
    background-color: rgb(var(--v-theme-surface-variant));
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.header-row {
    display: grid;
    grid-template-columns: 100px 150px 120px 140px 140px 100px 100px 150px;
    min-height: 56px;
}

.header-cell {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface-variant));
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    user-select: none;
}

.header-cell:last-child {
    border-right: none;
}

.header-cell.sortable {
    cursor: pointer;
    transition: background-color 0.2s;
}

.header-cell.sortable:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.header-cell.sorted {
    color: rgb(var(--v-theme-primary));
}

.scroll-container {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
}

.scroll-content {
    position: relative;
}

.virtual-items {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
}

.table-row {
    display: grid;
    grid-template-columns: 100px 150px 120px 140px 140px 100px 100px 150px;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    cursor: pointer;
    transition: background-color 0.2s;
}

.table-row:hover,
.table-row.row-hover {
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.cell {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    overflow: hidden;
}

.cell:last-child {
    border-right: none;
}

.cell-actions {
    justify-content: center;
}

.font-mono {
    font-family: 'Roboto Mono', monospace;
}

.loading-state,
.no-data-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.load-more-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: rgb(var(--v-theme-on-surface-variant));
}

.pagination-info {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgb(var(--v-theme-surface));
}

/* Responsive adjustments */
@media (max-width: 1200px) {

    .header-row,
    .table-row {
        grid-template-columns: 80px 120px 100px 120px 120px 80px 80px 120px;
    }

    .cell {
        padding: 8px 12px;
        font-size: 0.875rem;
    }
}

@media (max-width: 959px) {

    .header-row,
    .table-row {
        grid-template-columns: 60px 100px 80px 100px 100px 60px 60px 100px;
    }

    .cell {
        padding: 6px 8px;
        font-size: 0.8125rem;
    }
}

/* Scrollbar styling */
.scroll-container::-webkit-scrollbar {
    width: 8px;
}

.scroll-container::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-on-surface), 0.05);
}

.scroll-container::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>