<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { flowService } from '@/services/flowService'
import type { N8nNodeRunDto, N8nNodeRunFilter, N8nNodeRunStatistics } from '@/types/flow'

// Page definition with CASL integration
definePage({
    name: 'content-status',
    meta: {
        title: 'Content Status',
        requiresAuth: true,
        action: 'read',
        subject: 'Content'
    }
})

// Composables
const { mdAndUp } = useDisplay()

// Reactive state
const nodeRuns = ref<N8nNodeRunDto[]>([])
const statistics = ref<N8nNodeRunStatistics | null>(null)
const isLoading = ref(false)
const isLoadingStats = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedStatus = ref<string[]>([])
const selectedWorkflow = ref('')
const selectedNodeType = ref('')

// Pagination
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Filter options
const statusOptions = [
    { title: 'Pending', value: 'PENDING', color: 'warning' },
    { title: 'Running', value: 'RUNNING', color: 'info' },
    { title: 'Success', value: 'SUCCESS', color: 'success' },
    { title: 'Failed', value: 'FAILED', color: 'error' },
    { title: 'Cancelled', value: 'CANCELLED', color: 'secondary' },
    { title: 'Timeout', value: 'TIMEOUT', color: 'error' }
]

// Table headers
const headers = computed(() => [
    { title: 'Workflow', key: 'workflowName', sortable: true },
    { title: 'Node', key: 'nodeName', sortable: true },
    { title: 'Type', key: 'nodeType', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Duration', key: 'duration', sortable: true },
    { title: 'Started', key: 'startTime', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, width: '120' }
])

// Computed properties
const filteredNodeRuns = computed(() => {
    let filtered = nodeRuns.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(run =>
            run.workflowName.toLowerCase().includes(query) ||
            run.nodeName.toLowerCase().includes(query) ||
            run.nodeType.toLowerCase().includes(query)
        )
    }

    if (selectedStatus.value.length > 0) {
        filtered = filtered.filter(run => selectedStatus.value.includes(run.status))
    }

    if (selectedWorkflow.value) {
        filtered = filtered.filter(run => run.workflowId === selectedWorkflow.value)
    }

    if (selectedNodeType.value) {
        filtered = filtered.filter(run => run.nodeType === selectedNodeType.value)
    }

    return filtered
})

const uniqueWorkflows = computed(() => {
    const workflows = new Map()
    nodeRuns.value.forEach(run => {
        if (!workflows.has(run.workflowId)) {
            workflows.set(run.workflowId, run.workflowName)
        }
    })
    return Array.from(workflows.entries()).map(([id, name]) => ({ title: name, value: id }))
})

const uniqueNodeTypes = computed(() => {
    const types = new Set(nodeRuns.value.map(run => run.nodeType))
    return Array.from(types).map(type => ({ title: type, value: type }))
})

// Methods
const loadNodeRuns = async () => {
    try {
        isLoading.value = true
        error.value = null

        const filters: N8nNodeRunFilter = {}
        if (selectedStatus.value.length > 0) {
            filters.status = selectedStatus.value as any[]
        }
        if (selectedWorkflow.value) {
            filters.workflowId = selectedWorkflow.value
        }
        if (selectedNodeType.value) {
            filters.nodeType = selectedNodeType.value
        }
        if (searchQuery.value) {
            filters.search = searchQuery.value
        }

        const response = await flowService.getNodeRuns({
            page: page.value - 1, // Backend uses 0-based pagination
            size: itemsPerPage.value,
            ...filters
        })

        if (response.errorCode === 'SUCCESS') {
            nodeRuns.value = response.data
            // Note: If backend returns paginated response, update totalItems accordingly
            totalItems.value = response.data.length
        } else {
            error.value = response.errorMessage
        }
    } catch (err: any) {
        error.value = err.response?.data?.errorMessage || err.message || 'Failed to load node runs'
    } finally {
        isLoading.value = false
    }
}

const loadStatistics = async () => {
    try {
        isLoadingStats.value = true
        const response = await flowService.getNodeRunStatistics()

        if (response.errorCode === 'SUCCESS') {
            statistics.value = response.data
        }
    } catch (err: any) {
        // Error handling for statistics loading
    } finally {
        isLoadingStats.value = false
    }
}

const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status)
    return statusOption?.color || 'secondary'
}

const formatDuration = (duration?: number) => {
    if (!duration) return '-'
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
}

const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
}

const retryNodeRun = async (nodeRun: N8nNodeRunDto) => {
    try {
        const response = await flowService.retryNodeRun(nodeRun.id)
        if (response.errorCode === 'SUCCESS') {
            await loadNodeRuns()
            // Show success message
        } else {
            error.value = response.errorMessage
        }
    } catch (err: any) {
        error.value = err.response?.data?.errorMessage || 'Failed to retry node run'
    }
}

const cancelNodeRun = async (nodeRun: N8nNodeRunDto) => {
    try {
        const response = await flowService.cancelNodeRun(nodeRun.id)
        if (response.errorCode === 'SUCCESS') {
            await loadNodeRuns()
            // Show success message
        } else {
            error.value = response.errorMessage
        }
    } catch (err: any) {
        error.value = err.response?.data?.errorMessage || 'Failed to cancel node run'
    }
}

const clearFilters = () => {
    searchQuery.value = ''
    selectedStatus.value = []
    selectedWorkflow.value = ''
    selectedNodeType.value = ''
    page.value = 1
    loadNodeRuns()
}

const refreshData = () => {
    loadNodeRuns()
    loadStatistics()
}

// Lifecycle
onMounted(() => {
    loadNodeRuns()
    loadStatistics()
})
</script>

<template>
    <div>
        <!-- Page Header -->
        <div class="d-flex justify-space-between align-center mb-6">
            <div>
                <h1 class="text-h4 font-weight-bold mb-1">
                    Content Status
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                    Monitor N8N workflow node execution status and performance
                </p>
            </div>
            <v-btn color="primary" prepend-icon="tabler-refresh" @click="refreshData" :loading="isLoading">
                Refresh
            </v-btn>
        </div>

        <!-- Statistics Cards -->
        <v-row class="mb-6" v-if="statistics">
            <v-col cols="12" sm="6" md="3">
                <v-card>
                    <v-card-text>
                        <div class="d-flex align-center">
                            <v-avatar color="primary" variant="tonal" class="me-3">
                                <v-icon icon="tabler-activity" />
                            </v-avatar>
                            <div>
                                <p class="text-caption text-medium-emphasis mb-1">Total Runs</p>
                                <h3 class="text-h5">{{ statistics.totalRuns.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card>
                    <v-card-text>
                        <div class="d-flex align-center">
                            <v-avatar color="success" variant="tonal" class="me-3">
                                <v-icon icon="tabler-check" />
                            </v-avatar>
                            <div>
                                <p class="text-caption text-medium-emphasis mb-1">Success Rate</p>
                                <h3 class="text-h5">{{ (statistics.successRate * 100).toFixed(1) }}%</h3>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card>
                    <v-card-text>
                        <div class="d-flex align-center">
                            <v-avatar color="info" variant="tonal" class="me-3">
                                <v-icon icon="tabler-clock" />
                            </v-avatar>
                            <div>
                                <p class="text-caption text-medium-emphasis mb-1">Avg Duration</p>
                                <h3 class="text-h5">{{ formatDuration(statistics.averageDuration) }}</h3>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <v-card>
                    <v-card-text>
                        <div class="d-flex align-center">
                            <v-avatar color="warning" variant="tonal" class="me-3">
                                <v-icon icon="tabler-loader" />
                            </v-avatar>
                            <div>
                                <p class="text-caption text-medium-emphasis mb-1">Running</p>
                                <h3 class="text-h5">{{ statistics.runningRuns.toLocaleString() }}</h3>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Filters -->
        <v-card class="mb-6">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="3">
                        <v-text-field v-model="searchQuery" label="Search workflows, nodes..."
                            prepend-inner-icon="tabler-search" clearable @input="loadNodeRuns" />
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-select v-model="selectedStatus" :items="statusOptions" label="Status" multiple chips
                            clearable @update:model-value="loadNodeRuns" />
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-select v-model="selectedWorkflow" :items="uniqueWorkflows" label="Workflow" clearable
                            @update:model-value="loadNodeRuns" />
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-select v-model="selectedNodeType" :items="uniqueNodeTypes" label="Node Type" clearable
                            @update:model-value="loadNodeRuns" />
                    </v-col>
                </v-row>
                <div class="d-flex justify-end">
                    <v-btn variant="outlined" prepend-icon="tabler-filter-off" @click="clearFilters">
                        Clear Filters
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <!-- Error Alert -->
        <v-alert v-if="error" type="error" class="mb-6" closable @click:close="error = null">
            {{ error }}
        </v-alert>

        <!-- Data Table -->
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon icon="tabler-list" class="me-2" />
                Node Runs
                <v-spacer />
                <v-chip v-if="filteredNodeRuns.length !== nodeRuns.length" color="primary" variant="tonal" size="small">
                    {{ filteredNodeRuns.length }} of {{ nodeRuns.length }}
                </v-chip>
            </v-card-title>

            <v-data-table :headers="headers" :items="filteredNodeRuns" :loading="isLoading"
                :items-per-page="itemsPerPage" :page="page" @update:page="page = $event"
                @update:items-per-page="itemsPerPage = $event" class="text-no-wrap">
                <!-- Status column -->
                <template #item.status="{ item }">
                    <v-chip :color="getStatusColor(item.status)" variant="tonal" size="small">
                        {{ item.status }}
                    </v-chip>
                </template>

                <!-- Duration column -->
                <template #item.duration="{ item }">
                    {{ formatDuration(item.duration) }}
                </template>

                <!-- Start time column -->
                <template #item.startTime="{ item }">
                    {{ formatDateTime(item.startTime) }}
                </template>

                <!-- Actions column -->
                <template #item.actions="{ item }">
                    <div class="d-flex gap-1">
                        <v-btn v-if="item.status === 'FAILED'" icon="tabler-refresh" size="small" variant="text"
                            color="warning" @click="retryNodeRun(item)" :title="'Retry'" />
                        <v-btn v-if="item.status === 'RUNNING'" icon="tabler-x" size="small" variant="text"
                            color="error" @click="cancelNodeRun(item)" :title="'Cancel'" />
                        <v-btn icon="tabler-eye" size="small" variant="text" :title="'View Details'" />
                    </div>
                </template>

                <!-- Loading state -->
                <template #loading>
                    <v-skeleton-loader type="table-row@10" />
                </template>

                <!-- No data state -->
                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon icon="tabler-database-off" size="48" class="text-medium-emphasis mb-4" />
                        <p class="text-body-1 text-medium-emphasis">
                            No node runs found
                        </p>
                        <v-btn color="primary" variant="outlined" prepend-icon="tabler-refresh" @click="refreshData">
                            Refresh Data
                        </v-btn>
                    </div>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<style scoped>
.text-no-wrap {
    white-space: nowrap;
}
</style>