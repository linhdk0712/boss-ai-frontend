<template>
    <div class="job-queue-page">
        <v-container fluid class="pa-6">
            <v-row>
                <v-col cols="12">
                    <!-- Page Header -->
                    <div class="d-flex align-center mb-6">
                        <div>
                            <h3 class="text-h4 font-weight-bold">Job Queue Management</h3>
                            <p class="text-subtitle-1 text-medium-emphasis mb-0">
                                Monitor and manage your content generation jobs
                            </p>
                        </div>
                        <v-spacer />

                        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="refreshJobs">
                            Refresh
                        </v-btn>
                    </div>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12">
                    <v-card>
                        <v-card-title>
                            <div class="d-flex align-center justify-space-between w-100">
                                <span>Job Queue</span>
                                <v-chip color="primary" variant="tonal" size="small">
                                    {{ pagination.total }} Total Jobs
                                </v-chip>
                            </div>
                        </v-card-title>

                        <v-card-text>
                            <!-- Loading State -->
                            <div v-if="loading" class="text-center py-8">
                                <v-progress-circular indeterminate color="primary" size="64" />
                                <p class="mt-4 text-subtitle-1">Loading jobs...</p>
                            </div>

                            <!-- Error State -->
                            <div v-else-if="error" class="text-center py-8">
                                <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
                                <p class="text-h6 mb-2">Failed to load jobs</p>
                                <p class="text-body-2 text-medium-emphasis mb-4">{{ error }}</p>
                                <v-btn color="primary" @click="refreshJobs">Try Again</v-btn>
                            </div>

                            <!-- Empty State -->
                            <div v-else-if="jobs.length === 0" class="text-center py-8">
                                <v-icon color="info" size="64" class="mb-4">mdi-inbox</v-icon>
                                <p class="text-h6 mb-2">No jobs found</p>
                                <p class="text-body-2 text-medium-emphasis">No content generation jobs have been created
                                    yet.</p>
                            </div>

                            <!-- Jobs Table -->
                            <v-data-table v-else :items="jobs" :headers="headers" :loading="loading"
                                :items-per-page="pagination.size" :page="pagination.page + 1"
                                :server-items-length="pagination.total" @update:page="handlePageChange"
                                @update:items-per-page="handleSizeChange">
                                <!-- Status Column -->
                                <template #item.status="{ item }">
                                    <v-chip :color="getStatusColor(item.status)" variant="tonal" size="small">
                                        {{ item.status }}
                                    </v-chip>
                                </template>

                                <!-- Priority Column -->
                                <template #item.priority="{ item }">
                                    <v-chip :color="getPriorityColor(item.priority)" variant="outlined" size="small">
                                        {{ item.priority }}
                                    </v-chip>
                                </template>

                                <!-- Created At Column -->
                                <template #item.createdAt="{ item }">
                                    {{ formatDate(item.createdAt) }}
                                </template>

                                <!-- Actions Column -->
                                <template #item.actions="{ item }">
                                    <div class="d-flex ga-2 align-center">
                                        <v-btn variant="text" size="small" color="primary" prepend-icon="mdi-eye"
                                            @click="viewJobDetails(item)">
                                            View
                                        </v-btn>
                                        <v-btn v-if="item.status === 'FAILED'" variant="text" size="small"
                                            color="warning" prepend-icon="mdi-refresh" @click="retryJob(item)">
                                            Retry
                                        </v-btn>
                                    </div>
                                </template>
                            </v-data-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>

        <!-- Job Details Dialog -->
        <v-dialog v-model="showDetailsDialog" max-width="800">
            <v-card v-if="selectedJob">
                <v-card-title>
                    <span class="text-h5">Job Details</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false" />
                </v-card-title>

                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-list density="compact">
                                <v-list-item>
                                    <v-list-item-title>Job ID</v-list-item-title>
                                    <v-list-item-subtitle>{{ selectedJob.jobId }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>Status</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip :color="getStatusColor(selectedJob.status)" variant="tonal"
                                            size="small">
                                            {{ selectedJob.status }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>Content Type</v-list-item-title>
                                    <v-list-item-subtitle>{{ selectedJob.contentType }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>Priority</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <v-chip :color="getPriorityColor(selectedJob.priority)" variant="outlined"
                                            size="small">
                                            {{ selectedJob.priority }}
                                        </v-chip>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-list density="compact">
                                <v-list-item>
                                    <v-list-item-title>Created At</v-list-item-title>
                                    <v-list-item-subtitle>{{ formatDate(selectedJob.createdAt) }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="selectedJob.startedAt">
                                    <v-list-item-title>Started At</v-list-item-title>
                                    <v-list-item-subtitle>{{ formatDate(selectedJob.startedAt) }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item v-if="selectedJob.completedAt">
                                    <v-list-item-title>Completed At</v-list-item-title>
                                    <v-list-item-subtitle>{{ formatDate(selectedJob.completedAt)
                                    }}</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>Retry Count</v-list-item-title>
                                    <v-list-item-subtitle>{{ selectedJob.retryCount }} / {{ selectedJob.maxRetries
                                    }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-col>
                    </v-row>

                    <!-- Request Parameters -->
                    <v-divider class="my-4" />
                    <h4 class="text-h6 mb-2">Request Parameters</h4>
                    <pre
                        class="bg-grey-lighten-4 pa-3 rounded">{{ JSON.stringify(selectedJob.requestParams, null, 2) }}</pre>

                    <!-- Result -->
                    <div v-if="selectedJob.result">
                        <v-divider class="my-4" />
                        <h4 class="text-h6 mb-2">Result</h4>
                        <v-textarea :model-value="selectedJob.result" readonly rows="6" variant="outlined" />
                    </div>

                    <!-- Error Message -->
                    <div v-if="selectedJob.errorMessage">
                        <v-divider class="my-4" />
                        <h4 class="text-h6 mb-2">Error Message</h4>
                        <v-alert type="error" variant="tonal">
                            {{ selectedJob.errorMessage }}
                        </v-alert>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn v-if="selectedJob.status === 'FAILED'" color="warning" prepend-icon="mdi-refresh"
                        @click="retryJob(selectedJob)">
                        Retry Job
                    </v-btn>
                    <v-btn color="primary" @click="showDetailsDialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useJobQueue } from '@/composables/useJobQueue'
import type { Job } from '@/types/content'

// Composables
const {
    jobs,
    loading,
    pagination,
    getJobs,
    retryJob: retryJobApi
} = useJobQueue()

// Local state
const error = ref<string | null>(null)
const selectedJob = ref<Job | null>(null)
const showDetailsDialog = ref(false)

// Table headers
const headers = [
    { title: 'Job ID', key: 'jobId', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Priority', key: 'priority', sortable: true },
    { title: 'Content Type', key: 'contentType', sortable: true },
    { title: 'Created At', key: 'createdAt', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false }
]

// Methods
const refreshJobs = async () => {
    try {
        error.value = null
        await getJobs(0, 10)
    } catch (err: any) {
        error.value = err.message || 'Failed to load jobs'
        console.error('Error loading jobs:', err)
    }
}

const handlePageChange = async (page: number) => {
    try {
        error.value = null
        await getJobs(page - 1, pagination.value.size) // Convert to 0-based index
    } catch (err: any) {
        error.value = err.message || 'Failed to load jobs'
        console.error('Error loading jobs:', err)
    }
}

const handleSizeChange = async (size: number) => {
    try {
        error.value = null
        await getJobs(0, size) // Reset to first page
    } catch (err: any) {
        error.value = err.message || 'Failed to load jobs'
        console.error('Error loading jobs:', err)
    }
}

const viewJobDetails = (job: Job) => {
    selectedJob.value = job
    showDetailsDialog.value = true
}

const retryJob = async (job: Job) => {
    try {
        await retryJobApi(job.jobId)
        await refreshJobs() // Refresh the list
    } catch (err: any) {
        error.value = err.message || 'Failed to retry job'
        console.error('Error retrying job:', err)
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'success'
        case 'PROCESSING':
            return 'warning'
        case 'FAILED':
            return 'error'
        case 'QUEUED':
            return 'info'
        case 'CANCELLED':
            return 'secondary'
        case 'EXPIRED':
            return 'error'
        default:
            return 'primary'
    }
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'URGENT':
            return 'error'
        case 'HIGH':
            return 'warning'
        case 'STANDARD':
            return 'primary'
        case 'LOW':
            return 'info'
        default:
            return 'primary'
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
}

// Initialize data
onMounted(async () => {
    await refreshJobs()
})

// Page metadata
definePage({
    name: 'job-queue-index',
    meta: {
        title: 'Job Queue Management',
        requiresAuth: true,
        action: 'read',
        subject: 'JobQueue'
    }
})
</script>

<style scoped>
.job-queue-page {
    min-height: 100vh;
    background-color: rgb(var(--v-theme-background));
}

/* Responsive adjustments */
@media (max-width: 959px) {
    .job-queue-page .v-container {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>