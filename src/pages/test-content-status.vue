<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { flowService } from '@/services/flowService'
import type { N8nNodeRunDto } from '@/types/flow'

// Simple test page to verify our implementation
definePage({
    name: 'test-content-status',
    meta: {
        title: 'Test Content Status',
        requiresAuth: true
    }
})

const nodeRuns = ref<N8nNodeRunDto[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadData = async () => {
    try {
        isLoading.value = true
        error.value = null

        const response = await flowService.getNodeRuns()

        if (response.errorCode === 'SUCCESS') {
            nodeRuns.value = response.data
        } else {
            error.value = response.errorMessage
        }
    } catch (err: any) {
        error.value = err.message || 'Failed to load data'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="pa-6">
        <h1>Test Content Status</h1>

        <v-btn @click="loadData" :loading="isLoading" class="mb-4">
            Load Node Runs
        </v-btn>

        <v-alert v-if="error" type="error" class="mb-4">
            {{ error }}
        </v-alert>

        <v-card v-if="nodeRuns.length > 0">
            <v-card-title>Node Runs ({{ nodeRuns.length }})</v-card-title>
            <v-card-text>
                <pre>{{ JSON.stringify(nodeRuns, null, 2) }}</pre>
            </v-card-text>
        </v-card>

        <v-card v-else-if="!isLoading">
            <v-card-text>No data available</v-card-text>
        </v-card>
    </div>
</template>