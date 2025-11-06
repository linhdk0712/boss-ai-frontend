<template>
    <div class="job-filters">
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
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <v-row>
                        <!-- Text Search -->
                        <v-col cols="12" md="6" lg="3">
                            <v-text-field v-model="localFilters.search" label="Search jobs"
                                placeholder="Search by content, title..." prepend-inner-icon="mdi-magnify"
                                variant="outlined" density="compact" clearable :loading="loading"
                                @input="debouncedSearch" @click:clear="clearSearch" />
                        </v-col>

                        <!-- Status Filter -->
                        <v-col cols="12" md="6" lg="2">
                            <v-select v-model="localFilters.status" :items="statusOptions" label="Status"
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

                        <!-- Content Type Filter -->
                        <v-col cols="12" md="6" lg="2">
                            <v-select v-model="localFilters.contentType" :items="contentTypeOptions"
                                label="Content Type" variant="outlined" density="compact" clearable multiple chips
                                :loading="loading" @update:model-value="handleFilterChange">
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

                        <!-- Date Range Filter -->
                        <v-col cols="12" md="6" lg="3">
                            <v-menu v-model="datePickerMenu" :close-on-content-click="false"
                                transition="scale-transition" offset-y min-width="auto">
                                <template #activator="{ props }">
                                    <v-text-field v-bind="props" :model-value="dateRangeText" label="Date Range"
                                        prepend-inner-icon="mdi-calendar-range" variant="outlined" density="compact"
                                        readonly clearable :loading="loading" @click:clear="clearDateRange" />
                                </template>

                                <v-card>
                                    <v-card-text>
                                        <v-date-picker v-model="localFilters.dateRange" range color="primary"
                                            @update:model-value="handleDateRangeChange" />
                                    </v-card-text>

                                    <v-card-actions>
                                        <v-spacer />
                                        <v-btn variant="text" @click="datePickerMenu = false">
                                            Cancel
                                        </v-btn>
                                        <v-btn color="primary" variant="text" @click="applyDateRange">
                                            Apply
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-menu>
                        </v-col>

                        <!-- Quick Date Filters -->
                        <v-col cols="12" lg="2">
                            <div class="d-flex flex-column ga-2">
                                <v-btn v-for="quickFilter in quickDateFilters" :key="quickFilter.key"
                                    :variant="isQuickFilterActive(quickFilter.key) ? 'tonal' : 'outlined'"
                                    :color="isQuickFilterActive(quickFilter.key) ? 'primary' : 'default'" size="small"
                                    density="compact" :loading="loading" @click="applyQuickDateFilter(quickFilter.key)">
                                    {{ quickFilter.label }}
                                </v-btn>
                            </div>
                        </v-col>
                    </v-row>

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
                                </div>

                                <div class="text-caption text-medium-emphasis">
                                    {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
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
import { ref, computed, watch, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { JobFilterCriteria } from '@/types/content'

// Props
interface Props {
    filters: JobFilterCriteria
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
const emit = defineEmits<{
    'filter-change': [filters: JobFilterCriteria]
    'clear-filters': []
}>()

// Local state
const filtersExpanded = ref([0]) // Expand filters by default
const datePickerMenu = ref(false)
const localFilters = ref<JobFilterCriteria>({ ...props.filters })
const activeQuickFilter = ref<string | null>(null)

// Filter options
const statusOptions = [
    { title: 'Pending', value: 'PENDING' },
    { title: 'Processing', value: 'PROCESSING' },
    { title: 'Completed', value: 'COMPLETED' },
    { title: 'Failed', value: 'FAILED' },
    { title: 'Cancelled', value: 'CANCELLED' }
]

const contentTypeOptions = [
    { title: 'Blog Post', value: 'blog_post' },
    { title: 'Article', value: 'article' },
    { title: 'Social Media', value: 'social_media' },
    { title: 'Email', value: 'email' },
    { title: 'Video Script', value: 'video_script' },
    { title: 'Product Description', value: 'product_description' }
]

const quickDateFilters = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 days' },
    { key: 'last30days', label: 'Last 30 days' }
]

// Computed properties
const activeFiltersCount = computed(() => {
    let count = 0

    if (localFilters.value.search?.trim()) count++
    if (localFilters.value.status?.length) count++
    if (localFilters.value.contentType?.length) count++
    if (localFilters.value.dateRange?.length === 2) count++

    return count
})

const dateRangeText = computed(() => {
    if (!localFilters.value.dateRange || localFilters.value.dateRange.length !== 2) {
        return ''
    }

    const [start, end] = localFilters.value.dateRange
    const startDate = new Date(start).toLocaleDateString()
    const endDate = new Date(end).toLocaleDateString()

    return `${startDate} - ${endDate}`
})

// Debounced search
const debouncedSearch = useDebounceFn(() => {
    handleFilterChange()
}, 500)

// Methods
const handleFilterChange = () => {
    emit('filter-change', { ...localFilters.value })
}

const applyFilters = () => {
    emit('filter-change', { ...localFilters.value })
}

const clearSearch = () => {
    localFilters.value.search = ''
    handleFilterChange()
}

const clearDateRange = () => {
    localFilters.value.dateRange = []
    activeQuickFilter.value = null
    handleFilterChange()
}

const clearAllFilters = () => {
    localFilters.value = {
        search: '',
        status: [],
        contentType: [],
        dateRange: []
    }
    activeQuickFilter.value = null
    emit('clear-filters')
}

const handleDateRangeChange = (range: any) => {
    localFilters.value.dateRange = range
    activeQuickFilter.value = null
}

const applyDateRange = () => {
    datePickerMenu.value = false
    handleFilterChange()
}

const applyQuickDateFilter = (filterKey: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date
    let endDate: Date = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today

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

    localFilters.value.dateRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
    ]

    activeQuickFilter.value = filterKey
    handleFilterChange()
}

const isQuickFilterActive = (filterKey: string) => {
    return activeQuickFilter.value === filterKey
}

// Status utilities
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'success'
        case 'processing':
            return 'warning'
        case 'failed':
            return 'error'
        case 'pending':
            return 'info'
        case 'cancelled':
            return 'secondary'
        default:
            return 'primary'
    }
}

// Content type utilities
const getContentTypeColor = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            return 'primary'
        case 'social_media':
            return 'secondary'
        case 'email':
            return 'info'
        case 'video_script':
            return 'warning'
        case 'product_description':
            return 'success'
        default:
            return 'primary'
    }
}

const getContentTypeIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
        case 'blog_post':
        case 'article':
            return 'mdi-post'
        case 'social_media':
            return 'mdi-share-variant'
        case 'email':
            return 'mdi-email'
        case 'video_script':
            return 'mdi-video'
        case 'product_description':
            return 'mdi-package-variant'
        default:
            return 'mdi-file-document'
    }
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
.job-filters {
    margin-bottom: 1rem;
}

/* Custom expansion panel styling */
:deep(.v-expansion-panel-title) {
    padding: 12px 16px;
}

:deep(.v-expansion-panel-text__wrapper) {
    padding: 16px;
}

/* Date picker styling */
:deep(.v-date-picker) {
    box-shadow: none;
}

/* Responsive adjustments */
@media (max-width: 959px) {
    :deep(.v-expansion-panel-title) {
        padding: 8px 12px;
    }

    :deep(.v-expansion-panel-text__wrapper) {
        padding: 12px;
    }
}
</style>