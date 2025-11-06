<template>
    <div class="optimized-job-filters">
        <v-expansion-panels v-model="filtersExpanded" variant="accordion">
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <div class="d-flex align-center">
                        <v-icon class="me-2">mdi-filter-variant</v-icon>
                        <span>Filters</span>
                        <v-spacer />
                        <v-chip v-if="activeFiltersCount > 0" size="small" color="primary" variant="tonal" class="me-2">
                            {{ activeFiltersCount }} active
                        </v-chip>
                        <v-chip v-if="isSearching" size="small" color="warning" variant="tonal" class="me-2">
                            <v-icon start size="16">mdi-magnify</v-icon>
                            Searching...
                        </v-chip>
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <v-row>
                        <!-- Optimized Text Search with Debouncing -->
                        <v-col cols="12" md="6" lg="3">
                            <v-text-field v-model="searchInput" label="Search jobs"
                                placeholder="Search by content, title..." prepend-inner-icon="mdi-magnify"
                                variant="outlined" density="compact" clearable :loading="isSearching"
                                @input="handleSearchInput" @click:clear="clearSearch" @keydown.enter="forceSearch">

                                <template #append-inner>
                                    <v-fade-transition>
                                        <v-icon v-if="searchInput && searchInput !== debouncedSearchValue" size="16"
                                            color="warning">
                                            mdi-clock-outline
                                        </v-icon>
                                    </v-fade-transition>
                                </template>
                            </v-text-field>
                        </v-col>

                        <!-- Cached Status Filter -->
                        <v-col cols="12" md="6" lg="2">
                            <v-select v-model="localFilters.status" :items="memoizedStatusOptions" label="Status"
                                variant="outlined" density="compact" clearable multiple chips :loading="loading"
                                @update:model-value="handleFilterChange">

                                <template #chip="{ props, item }">
                                    <v-chip v-bind="props" :color="getStatusColor(item.value)" size="small"
                                        variant="tonal">
                                        {{ item.title }}
                                    </v-chip>
                                </template>
                            </v-select>
                        </v-col>

                        <!-- Dynamic Content Type Filter -->
                        <v-col cols="12" md="6" lg="2">
                            <v-select v-model="localFilters.contentType" :items="availableContentTypes"
                                label="Content Type" variant="outlined" density="compact" clearable multiple chips
                                :loading="contentTypesLoading" @update:model-value="handleFilterChange">

                                <template #chip="{ props, item }">
                                    <v-chip v-bind="props" :color="getContentTypeColor(item.value)" size="small"
                                        variant="tonal">
                                        <v-icon start size="16">
                                            {{ getContentTypeIcon(item.value) }}
                                        </v-icon>
                                        {{ item.title }}
                                    </v-chip>
                                </template>
                            </v-select>
                        </v-col>

                        <!-- Optimized Date Range Filter -->
                        <v-col cols="12" md="6" lg="3">
                            <v-menu v-model="datePickerMenu" :close-on-content-click="false"
                                transition="scale-transition" offset-y min-width="auto">
                                <template #activator="{ props }">
                                    <v-text-field v-bind="props" :model-value="memoizedDateRangeText" label="Date Range"
                                        prepend-inner-icon="mdi-calendar-range" variant="outlined" density="compact"
                                        readonly clearable :loading="loading" @click:clear="clearDateRange" />
                                </template>

                                <v-card>
                                    <v-card-text>
                                        <v-date-picker v-model="tempDateRange" range color="primary"
                                            @update:model-value="handleTempDateRangeChange" />
                                    </v-card-text>

                                    <v-card-actions>
                                        <v-spacer />
                                        <v-btn variant="text" @click="cancelDateRange">
                                            Cancel
                                        </v-btn>
                                        <v-btn color="primary" variant="text" @click="applyDateRange">
                                            Apply
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-menu>
                        </v-col>

                        <!-- Quick Date Filters with Memoization -->
                        <v-col cols="12" lg="2">
                            <div class="d-flex flex-column ga-2">
                                <v-btn v-for="quickFilter in memoizedQuickDateFilters" :key="quickFilter.key"
                                    :variant="isQuickFilterActive(quickFilter.key) ? 'tonal' : 'outlined'"
                                    :color="isQuickFilterActive(quickFilter.key) ? 'primary' : 'default'" size="small"
                                    density="compact" :loading="loading" @click="applyQuickDateFilter(quickFilter.key)">
                                    {{ quickFilter.label }}
                                </v-btn>
                            </div>
                        </v-col>
                    </v-row>

                    <!-- Advanced Filters (Collapsible) -->
                    <v-expand-transition>
                        <div v-if="showAdvancedFilters">
                            <v-divider class="my-4" />
                            <v-row>
                                <!-- Execution Time Range -->
                                <v-col cols="12" md="6" lg="3">
                                    <v-range-slider v-model="localFilters.executionTimeRange"
                                        label="Execution Time (seconds)" :min="0" :max="300" :step="5"
                                        thumb-label="always" color="primary"
                                        @update:model-value="debouncedFilterChange">

                                        <template #thumb-label="{ modelValue }">
                                            {{ formatExecutionTimeThumb(modelValue) }}
                                        </template>
                                    </v-range-slider>
                                </v-col>

                                <!-- Retry Count Filter -->
                                <v-col cols="12" md="6" lg="2">
                                    <v-select v-model="localFilters.retryCount" :items="retryCountOptions"
                                        label="Retry Count" variant="outlined" density="compact" clearable
                                        @update:model-value="handleFilterChange" />
                                </v-col>

                                <!-- AI Provider Filter -->
                                <v-col cols="12" md="6" lg="2">
                                    <v-select v-model="localFilters.aiProvider" :items="aiProviderOptions"
                                        label="AI Provider" variant="outlined" density="compact" clearable multiple
                                        chips @update:model-value="handleFilterChange" />
                                </v-col>

                                <!-- Sort Options -->
                                <v-col cols="12" md="6" lg="3">
                                    <div class="d-flex ga-2">
                                        <v-select v-model="localFilters.sortBy" :items="sortByOptions" label="Sort By"
                                            variant="outlined" density="compact"
                                            @update:model-value="handleSortChange" />

                                        <v-btn-toggle v-model="localFilters.sortOrder" mandatory variant="outlined"
                                            density="compact" @update:model-value="handleSortChange">
                                            <v-btn value="desc" size="small">
                                                <v-icon>mdi-arrow-down</v-icon>
                                            </v-btn>
                                            <v-btn value="asc" size="small">
                                                <v-icon>mdi-arrow-up</v-icon>
                                            </v-btn>
                                        </v-btn-toggle>
                                    </div>
                                </v-col>
                            </v-row>
                        </div>
                    </v-expand-transition>

                    <!-- Filter Actions -->
                    <v-row class="mt-2">
                        <v-col cols="12">
                            <div class="d-flex align-center justify-space-between">
                                <div class="d-flex align-center ga-2">
                                    <v-btn color="primary" variant="tonal" size="small" :loading="loading"
                                        @click="applyFilters">
                                        <v-icon start>mdi-filter-check</v-icon>
                                        Apply Filters
                                    </v-btn>

                                    <v-btn variant="outlined" size="small" :disabled="activeFiltersCount === 0"
                                        @click="clearAllFilters">
                                        <v-icon start>mdi-filter-remove</v-icon>
                                        Clear All
                                    </v-btn>

                                    <v-btn variant="text" size="small" @click="toggleAdvancedFilters">
                                        <v-icon start>
                                            {{ showAdvancedFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                        </v-icon>
                                        Advanced
                                    </v-btn>
                                </div>

                                <div class="d-flex align-center ga-4">
                                    <div class="text-caption text-medium-emphasis">
                                        {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
                                    </div>

                                    <!-- Performance Indicator -->
                                    <div v-if="lastSearchTime" class="text-caption text-medium-emphasis">
                                        <v-icon size="12" class="me-1">mdi-speedometer</v-icon>
                                        {{ lastSearchTime }}ms
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import type { JobFilterCriteria } from '@/types/content'

// Props
interface Props {
    filters: JobFilterCriteria
    loading?: boolean
    availableContentTypes?: string[]
    contentTypesLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    availableContentTypes: () => [],
    contentTypesLoading: false
})

// Emits
const emit = defineEmits<{
    'filter-change': [filters: JobFilterCriteria]
    'search-change': [searchText: string]
    'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
    'clear-filters': []
    'load-content-types': []
}>()

// Local state
const filtersExpanded = ref([0])
const datePickerMenu = ref(false)
const showAdvancedFilters = ref(false)
const localFilters = ref<JobFilterCriteria>({ ...props.filters })
const activeQuickFilter = ref<string | null>(null)
const tempDateRange = ref<string[]>([])
const lastSearchTime = ref<number | null>(null)

// Search state with debouncing
const searchInput = ref(props.filters.search || '')
const debouncedSearchValue = ref(props.filters.search || '')
const isSearching = ref(false)

// Memoized options for better performance
const memoizedStatusOptions = shallowRef([
    { title: 'Pending', value: 'PENDING' },
    { title: 'Processing', value: 'PROCESSING' },
    { title: 'Completed', value: 'COMPLETED' },
    { title: 'Failed', value: 'FAILED' },
    { title: 'Cancelled', value: 'CANCELLED' }
])

const memoizedQuickDateFilters = shallowRef([
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 days' },
    { key: 'last30days', label: 'Last 30 days' }
])

const retryCountOptions = shallowRef([
    { title: 'No Retries', value: 0 },
    { title: '1 Retry', value: 1 },
    { title: '2+ Retries', value: 2 },
    { title: '5+ Retries', value: 5 }
])

const aiProviderOptions = shallowRef([
    { title: 'OpenAI', value: 'openai' },
    { title: 'Anthropic', value: 'anthropic' },
    { title: 'Google', value: 'google' },
    { title: 'Azure', value: 'azure' }
])

const sortByOptions = shallowRef([
    { title: 'Created Date', value: 'createdAt' },
    { title: 'Completed Date', value: 'completedAt' },
    { title: 'Execution Time', value: 'executionTimeMs' },
    { title: 'Status', value: 'status' },
    { title: 'Content Type', value: 'contentType' },
    { title: 'Retry Count', value: 'retryCount' }
])

// Computed properties with memoization
const activeFiltersCount = computed(() => {
    let count = 0

    if (debouncedSearchValue.value?.trim()) count++
    if (localFilters.value.status?.length) count++
    if (localFilters.value.contentType?.length) count++
    if (localFilters.value.dateRange?.length === 2) count++
    if (localFilters.value.executionTimeRange?.length === 2) count++
    if (localFilters.value.retryCount !== undefined) count++
    if (localFilters.value.aiProvider?.length) count++

    return count
})

const memoizedDateRangeText = computed(() => {
    if (!localFilters.value.dateRange || localFilters.value.dateRange.length !== 2) {
        return ''
    }

    const [start, end] = localFilters.value.dateRange
    const startDate = new Date(start).toLocaleDateString()
    const endDate = new Date(end).toLocaleDateString()

    return `${startDate} - ${endDate}`
})

const availableContentTypes = computed(() => {
    // Convert available content types to select options
    return props.availableContentTypes.map(type => ({
        title: formatContentType(type),
        value: type
    }))
})

// Debounced and throttled functions for performance
const debouncedSearch = useDebounceFn((searchText: string) => {
    const startTime = performance.now()

    debouncedSearchValue.value = searchText
    localFilters.value.search = searchText
    isSearching.value = false

    emit('search-change', searchText)
    emit('filter-change', { ...localFilters.value })

    const endTime = performance.now()
    lastSearchTime.value = Math.round(endTime - startTime)
}, 300)

const debouncedFilterChange = useDebounceFn(() => {
    handleFilterChange()
}, 150)

const throttledFilterChange = useThrottleFn(() => {
    handleFilterChange()
}, 100)

// Methods
const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value

    searchInput.value = value
    isSearching.value = true
    debouncedSearch(value)
}

const forceSearch = () => {
    // Force immediate search on Enter key
    debouncedSearch(searchInput.value)
}

const clearSearch = () => {
    searchInput.value = ''
    debouncedSearchValue.value = ''
    localFilters.value.search = ''
    isSearching.value = false
    handleFilterChange()
}

const handleFilterChange = () => {
    const startTime = performance.now()

    emit('filter-change', { ...localFilters.value })

    const endTime = performance.now()
    lastSearchTime.value = Math.round(endTime - startTime)
}

const handleSortChange = () => {
    emit('sort-change', localFilters.value.sortBy || 'createdAt', localFilters.value.sortOrder || 'desc')
}

const applyFilters = () => {
    // Force apply all pending changes
    debouncedSearch(searchInput.value)
    debouncedFilterChange()
    handleFilterChange()
}

const clearDateRange = () => {
    localFilters.value.dateRange = []
    tempDateRange.value = []
    activeQuickFilter.value = null
    handleFilterChange()
}

const clearAllFilters = () => {
    searchInput.value = ''
    debouncedSearchValue.value = ''
    localFilters.value = {
        search: '',
        status: [],
        contentType: [],
        dateRange: [],
        executionTimeRange: [0, 300],
        retryCount: undefined,
        aiProvider: [],
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }
    tempDateRange.value = []
    activeQuickFilter.value = null
    isSearching.value = false
    emit('clear-filters')
}

const handleTempDateRangeChange = (range: any) => {
    tempDateRange.value = range
}

const cancelDateRange = () => {
    tempDateRange.value = [...(localFilters.value.dateRange || [])]
    datePickerMenu.value = false
}

const applyDateRange = () => {
    localFilters.value.dateRange = [...tempDateRange.value]
    activeQuickFilter.value = null
    datePickerMenu.value = false
    handleFilterChange()
}

const applyQuickDateFilter = (filterKey: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date
    let endDate: Date = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)

    switch (filterKey) {
        case 'today':
            startDate = today
            break
        case 'yesterday':
            startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            endDate = new Date(today.getTime() - 1)
            break
        case 'last7days':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
        case 'last30days':
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        default:
            return
    }

    const dateRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
    ]

    localFilters.value.dateRange = dateRange
    tempDateRange.value = dateRange
    activeQuickFilter.value = filterKey
    handleFilterChange()
}

const isQuickFilterActive = (filterKey: string) => {
    return activeQuickFilter.value === filterKey
}

const toggleAdvancedFilters = () => {
    showAdvancedFilters.value = !showAdvancedFilters.value
}

// Utility functions with caching
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

const formatExecutionTimeThumb = (seconds: number) => {
    if (seconds < 60) {
        return `${seconds}s`
    } else {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }
}

// Lifecycle
onMounted(() => {
    // Load available content types if not provided
    if (props.availableContentTypes.length === 0) {
        emit('load-content-types')
    }

    // Initialize temp date range
    tempDateRange.value = [...(localFilters.value.dateRange || [])]
})

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters }
    searchInput.value = newFilters.search || ''
    debouncedSearchValue.value = newFilters.search || ''
    tempDateRange.value = [...(newFilters.dateRange || [])]
}, { deep: true })

// Watch for available content types changes
watch(() => props.availableContentTypes, (newTypes) => {
    // Update local content type filter if some selected types are no longer available
    if (localFilters.value.contentType?.length) {
        const validTypes = localFilters.value.contentType.filter(type =>
            newTypes.includes(type)
        )
        if (validTypes.length !== localFilters.value.contentType.length) {
            localFilters.value.contentType = validTypes
            throttledFilterChange()
        }
    }
}, { deep: true })
</script>

<style scoped>
.optimized-job-filters {
    margin-bottom: 1rem;
}

/* Custom expansion panel styling */
:deep(.v-expansion-panel-title) {
    padding: 12px 16px;
}

:deep(.v-expansion-panel-text__wrapper) {
    padding: 16px;
}

/* Performance indicator styling */
.text-caption {
    font-size: 0.75rem;
}

/* Advanced filters transition */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
    transition: all 0.3s ease;
}

/* Range slider styling */
:deep(.v-slider-thumb__label) {
    font-size: 0.75rem;
}

/* Button toggle styling */
:deep(.v-btn-toggle) {
    height: 40px;
}

/* Responsive adjustments */
@media (max-width: 959px) {
    :deep(.v-expansion-panel-title) {
        padding: 8px 12px;
    }

    :deep(.v-expansion-panel-text__wrapper) {
        padding: 12px;
    }

    .d-flex.ga-2 {
        gap: 8px;
    }
}

@media (max-width: 599px) {
    .d-flex.flex-column.ga-2 {
        flex-direction: row;
        flex-wrap: wrap;
    }
}
</style>