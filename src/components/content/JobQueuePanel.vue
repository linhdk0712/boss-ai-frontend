<template>
    <v-card class="job-queue-panel" elevation="2">
        <v-card-title class="d-flex align-center py-3">
            <v-icon class="me-2" size="20">mdi-format-list-bulleted</v-icon>
            <span class="text-body-1 font-weight-medium">Job Queue</span>
            <v-spacer />
            <v-chip :color="hasActiveJobs ? 'primary' : 'default'" size="small" variant="tonal">
                {{ activeJobs.length }} active
            </v-chip>
        </v-card-title>

        <v-card-text class="pa-0">
            <!-- Connection Status -->
            <div class="connection-status pa-3 border-b">
                <div class="d-flex align-center">
                    <v-icon :color="connectionStatusColor" :icon="connectionStatusIcon" size="16" class="me-2" />
                    <span class="text-caption">{{ connectionStatusText }}</span>
                    <v-spacer />
                    <v-btn v-if="!wsConnected && !pollingEnabled" size="x-small" variant="text"
                        @click="$emit('reconnect')">
                        Reconnect
                    </v-btn>
                </div>
            </div>

            <!-- Active Jobs -->
            <div v-if="hasActiveJobs" class="active-jobs">
                <div class="section-header pa-3 bg-surface-variant">
                    <span class="text-caption font-weight-medium text-medium-emphasis">
                        Active Jobs ({{ activeJobs.length }})
                    </span>
                </div>

                <div class="jobs-list">
                    <JobQueueItem v-for="job in activeJobs" :key="job.id" :job="job"
                        @cancel="$emit('cancel-job', job.id)" @retry="$emit('retry-job', job.id)" />
                </div>
            </div>

            <!-- Completed Jobs -->
            <div v-if="completedJobs.length > 0" class="completed-jobs">
                <div class="section-header pa-3 bg-surface-variant">
                    <div class="d-flex align-center">
                        <span class="text-caption font-weight-medium text-medium-emphasis">
                            Recent Completed ({{ completedJobs.length }})
                        </span>
                        <v-spacer />
                        <v-btn size="x-small" variant="text" @click="$emit('clear-completed')">
                            Clear
                        </v-btn>
                    </div>
                </div>

                <div class="jobs-list">
                    <JobQueueItem v-for="job in completedJobs.slice(0, 5)" :key="job.id" :job="job"
                        @retry="$emit('retry-job', job.id)" />
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!hasActiveJobs && completedJobs.length === 0" class="empty-state pa-6 text-center">
                <v-icon color="medium-emphasis" size="48" class="mb-3">
                    mdi-clipboard-list-outline
                </v-icon>
                <p class="text-body-2 text-medium-emphasis mb-0">
                    No jobs in queue
                </p>
                <p class="text-caption text-disabled">
                    Generated content will appear here
                </p>
            </div>

            <!-- Queue Statistics -->
            <div v-if="hasActiveJobs || completedJobs.length > 0" class="queue-stats pa-3 border-t">
                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Queue: {{ queueLength }}</span>
                    <span>Processing: {{ processingJobs.length }}</span>
                    <span>Completed: {{ completedJobs.length }}</span>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JobQueueItem from './JobQueueItem.vue'
import type { AsyncJob } from '@/composables/useAsyncContentGeneration'

interface Props {
    activeJobs: AsyncJob[]
    completedJobs: AsyncJob[]
    queueLength: number
    processingJobs: AsyncJob[]
    wsConnected: boolean
    pollingEnabled: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'cancel-job': [jobId: string]
    'retry-job': [jobId: string]
    'clear-completed': []
    'reconnect': []
}>()

// Computed properties
const hasActiveJobs = computed(() => props.activeJobs.length > 0)

const connectionStatusColor = computed(() => {
    if (props.wsConnected) return 'success'
    if (props.pollingEnabled) return 'warning'
    return 'error'
})

const connectionStatusIcon = computed(() => {
    if (props.wsConnected) return 'mdi-wifi'
    if (props.pollingEnabled) return 'mdi-wifi-strength-2'
    return 'mdi-wifi-off'
})

const connectionStatusText = computed(() => {
    if (props.wsConnected) return 'Real-time updates active'
    if (props.pollingEnabled) return 'Polling for updates'
    return 'Connection unavailable'
})
</script>

<style scoped>
.job-queue-panel {
    border-radius: 8px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.v-card-title {
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
    font-size: 0.875rem;
    font-weight: 500;
    flex-shrink: 0;
}

.v-card-text {
    flex: 1;
    overflow-y: auto;
}

.connection-status {
    background-color: rgba(var(--v-theme-surface-variant), 0.5);
}

.section-header {
    position: sticky;
    top: 0;
    z-index: 1;
}

.jobs-list {
    max-height: 300px;
    overflow-y: auto;
}

.border-b {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-t {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.empty-state {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

/* Scrollbar styling */
.jobs-list::-webkit-scrollbar {
    width: 4px;
}

.jobs-list::-webkit-scrollbar-track {
    background: transparent;
}

.jobs-list::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 2px;
}

.jobs-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>