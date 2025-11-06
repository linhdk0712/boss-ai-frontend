<template>
    <div class="job-table">
        <v-data-table-server v-model:items-per-page="itemsPerPage" v-model:page="currentPage" :headers="headers"
            :items="jobs" :items-length="pagination.total" :loading="loading"
            :items-per-page-options="itemsPerPageOptions" class="elevation-1" @update:options="handleOptionsUpdate">
            <!-- Job ID Column -->
            <template #item.id="{ item }">
                <div class="d-flex align-center">
                    <v-chip size="small" variant="outlined" color="primary" class="font-mono">
                        #{{ item.id }}
                    </v-chip>
                </div>
            </template>

            <!-- Content Type Column -->
            <template #item.contentType="{ item }">
                <v-chip size="small" variant="tonal" :color="getContentTypeColor(item.contentType)">
                    <v-icon start size="16">
                        {{ getContentTypeIcon(item.contentType) }}
                    </v-icon>
                    {{ formatContentType(item.contentType) }}
                </v-chip>
            </template>

            <!-- Status Column -->
            <template #item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" variant="tonal" size="small">
                    <v-icon start size="16">
                        {{ getStatusIcon(item.status) }}
                    </v-icon>
                    {{ item.status }}
                </v-chip>
            </template>

            <!-- Created At Column -->
            <template #item.createdAt="{ item }">
                <div class="text-body-2">
                    <div>{{ formatDate(item.createdAt) }}</div>
                    <div class="text-caption text-medium-emphasis">
                        {{ formatTime(item.createdAt) }}
                    </div>
                </div>
            </template>

            <!-- Completed At Column -->
            <template #item.completedAt="{ item }">
                <div v-if="item.completedAt" class="text-body-2">
                    <div>{{ formatDate(item.completedAt) }}</div>
                    <div class="text-caption text-medium-emphasis">
                        {{ formatTime(item.completedAt) }}
                    </div>
                </div>
                <span v-else class="text-medium-emphasis">—</span>
            </template>

            <!-- Execution Time Column -->
            <template #item.executionTimeMs="{ item }">
                <div v-if="item.executionTimeMs" class="text-body-2">
                    {{ formatExecutionTime(item.executionTimeMs) }}
                </div>
                <span v-else class="text-medium-emphasis">—</span>
            </template>

            <!-- Retry Count Column -->
            <template #item.retryCount="{ item }">
                <v-chip v-if="item.retryCount > 0" size="small" variant="outlined" color="warning">
                    {{ item.retryCount }} retries
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
            </template>

            <!-- Actions Column -->
            <template #item.actions="{ item }">
                <JobActions :job="item" :loading="loading" @retry="$emit('retry-job', item)"
                    @generate-video="$emit('generate-video', item)" @view-details="$emit('view-details', item)" />
            </template>

            <!-- Loading State -->
            <template #loading>
                <v-skeleton-loader v-for="n in 5" :key="n" type="table-row" class="mx-auto" />
            </template>

            <!-- No Data State -->
            <template #no-data>
                <div class="text-center py-8">
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
            </template>

            <!-- Bottom Pagination -->
            <template #bottom>
                <div class="d-flex align-center justify-space-between pa-4">
                    <div class="text-body-2 text-medium-emphasis">
                        Showing {{ startItem }} to {{ endItem }} of {{ pagination.total }} jobs
                    </div>

                    <v-pagination v-model="currentPage" :length="pagination.totalPages" :total-visible="7" size="small"
                        @update:model-value="handlePageChange" />
                </div>
            </template>
        </v-data-table-server>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import JobActions from './JobActions.vue'
import type { Job, PaginationInfo } from '@/types/content'

// Props
interface Props {
    jobs: Job[]
    loading: boolean
    pagination: PaginationInfo
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'retry-job': [job: Job]
    'generate-video': [job: Job]
    'view-details': [job: Job]
    'page-change': [page: number]
    'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
    'clear-filters': []
}>()

// Local state
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<string>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Table configuration
const itemsPerPageOptions = [
    { value: 5, title: '5' },
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
    { value: 100, title: '100' }
]

const headers = [
    {
        title: 'Job ID',
        key: 'id',
        sortable: true,
        width: '100px'
    },
    {
        title: 'Content Type',
        key: 'contentType',
        sortable: true,
        width: '150px'
    },
    {
        title: 'Status',
        key: 'status',
        sortable: true,
        width: '120px'
    },
    {
        title: 'Created',
        key: 'createdAt',
        sortable: true,
        width: '140px'
    },
    {
        title: 'Completed',
        key: 'completedAt',
        sortable: true,
        width: '140px'
    },
    {
        title: 'Duration',
        key: 'executionTimeMs',
        sortable: true,
        width: '100px'
    },
    {
        title: 'Retries',
        key: 'retryCount',
        sortable: true,
        width: '100px'
    },
    {
        title: 'Actions',
        key: 'actions',
        sortable: false,
        width: '150px',
        align: 'center'
    }
]

// Computed properties
const startItem = computed(() => {
    return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
    const end = currentPage.value * itemsPerPage.value
    return Math.min(end, props.pagination.total)
})

// Methods
const handleOptionsUpdate = (options: any) => {
    if (options.page !== currentPage.value) {
        currentPage.value = options.page
        handlePageChange(options.page)
    }

    if (options.itemsPerPage !== itemsPerPage.value) {
        itemsPerPage.value = options.itemsPerPage
        currentPage.value = 1
        handlePageChange(1)
    }

    if (options.sortBy && options.sortBy.length > 0) {
        const newSortBy = options.sortBy[0].key
        const newSortOrder = options.sortBy[0].order

        if (newSortBy !== sortBy.value || newSortOrder !== sortOrder.value) {
            sortBy.value = newSortBy
            sortOrder.value = newSortOrder
            emit('sort-change', newSortBy, newSortOrder)
        }
    }
}

const handlePageChange = (page: number) => {
    emit('page-change', page - 1) // Convert to 0-based index for API
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

const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'mdi-check-circle'
        case 'processing':
            return 'mdi-loading'
        case 'failed':
            return 'mdi-alert-circle'
        case 'pending':
            return 'mdi-clock-outline'
        case 'cancelled':
            return 'mdi-cancel'
        default:
            return 'mdi-help-circle'
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

const formatContentType = (contentType: string) => {
    return contentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

// Date/time utilities
const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatExecutionTime = (ms: number) => {
    if (!ms) return ''

    if (ms < 1000) {
        return `${ms}ms`
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`
    } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }
}

// Watch for pagination changes from parent
watch(() => props.pagination.page, (newPage) => {
    currentPage.value = newPage + 1 // Convert from 0-based to 1-based
})

watch(() => props.pagination.size, (newSize) => {
    itemsPerPage.value = newSize
})
</script>

<style scoped>
.job-table {
    width: 100%;
}

.font-mono {
    font-family: 'Roboto Mono', monospace;
}

/* Custom table styling */
:deep(.v-data-table) {
    border-radius: 8px;
}

:deep(.v-data-table__wrapper) {
    border-radius: 8px;
}

:deep(.v-data-table-header) {
    background-color: rgb(var(--v-theme-surface-variant));
}

:deep(.v-data-table-header th) {
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface-variant));
}

:deep(.v-data-table__td) {
    padding: 12px 16px;
}

:deep(.v-data-table__th) {
    padding: 12px 16px;
}

/* Row hover effect */
:deep(.v-data-table__wrapper tbody tr:hover) {
    background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Loading skeleton styling */
:deep(.v-skeleton-loader__table-row) {
    height: 60px;
}

/* Responsive adjustments */
@media (max-width: 959px) {

    :deep(.v-data-table__td),
    :deep(.v-data-table__th) {
        padding: 8px 12px;
    }

    :deep(.v-data-table) {
        font-size: 0.875rem;
    }
}

@media (max-width: 599px) {

    :deep(.v-data-table__td),
    :deep(.v-data-table__th) {
        padding: 6px 8px;
    }

    :deep(.v-data-table) {
        font-size: 0.8125rem;
    }
}
</style>