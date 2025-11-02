<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { SettingsCategory } from '@/types/settings'

// Define page metadata
definePage({
    name: 'settings-test',
    meta: {
        title: 'Settings Test',
        requiresAuth: true,
        action: 'read',
        subject: 'Settings'
    }
})

const settingsStore = useSettingsStore()
const { getSelectedSummary, fetchAllSettings } = settingsStore

const loading = ref(false)
const error = ref<string | null>(null)
const testResults = ref<string[]>([])

const runTests = async () => {
    loading.value = true
    error.value = null
    testResults.value = []

    try {
        // Test 1: Check if store is available
        testResults.value.push('✅ Settings store is available')

        // Test 2: Backend health check
        try {
            const healthResponse = await fetch('/api/v1/setting-test/health')
            const healthData = await healthResponse.json()

            if (healthResponse.ok) {
                testResults.value.push('✅ Backend health check passed')
                testResults.value.push(`🔍 Health data: ${JSON.stringify(healthData, null, 2)}`)
            } else {
                testResults.value.push('❌ Backend health check failed')
                testResults.value.push(`🔍 Health error: ${JSON.stringify(healthData, null, 2)}`)
            }
        } catch (healthErr: any) {
            testResults.value.push(`❌ Backend health check error: ${healthErr.message}`)
        }

        // Test 3: Try individual category endpoints
        const categories = ['industry', 'tone', 'language', 'target-audience', 'content-type']

        for (const category of categories) {
            try {
                const response = await fetch(`/api/v1/setting/${category}`)
                if (response.ok) {
                    const data = await response.json()
                    testResults.value.push(`✅ ${category} endpoint: ${data.data?.length || 0} items`)
                } else {
                    const errorData = await response.text()
                    testResults.value.push(`❌ ${category} endpoint failed: ${response.status} - ${errorData}`)
                }
            } catch (categoryErr: any) {
                testResults.value.push(`❌ ${category} endpoint error: ${categoryErr.message}`)
            }
        }

        // Test 4: Check if we can fetch settings via store
        try {
            await fetchAllSettings()
            testResults.value.push('✅ Settings data fetched via store successfully')
        } catch (storeErr: any) {
            testResults.value.push(`❌ Store fetch error: ${storeErr.message}`)
        }

        // Test 5: Check if summary is working
        const summary = getSelectedSummary.value
        if (summary) {
            testResults.value.push('✅ Settings summary is available')
            testResults.value.push(`📊 Summary data: ${JSON.stringify(summary, null, 2)}`)
        } else {
            testResults.value.push('❌ Settings summary is null')
        }

        // Test 6: Check individual categories
        Object.values(SettingsCategory).forEach(category => {
            const categorySettings = settingsStore.getSettingsForCategory(category).value
            testResults.value.push(`📋 ${category}: ${categorySettings.length} items`)
        })

    } catch (err: any) {
        error.value = err.message
        testResults.value.push(`❌ Error: ${err.message}`)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    runTests()
})
</script>

<template>
    <div class="settings-test-page pa-6">
        <v-card>
            <v-card-title>
                <v-icon icon="tabler-test-pipe" class="me-2" />
                Settings System Test
            </v-card-title>

            <v-card-text>
                <div class="mb-4">
                    <v-btn @click="runTests" :loading="loading" color="primary" prepend-icon="tabler-refresh">
                        Run Tests
                    </v-btn>
                </div>

                <v-alert v-if="error" type="error" class="mb-4">
                    {{ error }}
                </v-alert>

                <div v-if="testResults.length > 0">
                    <h3 class="text-h6 mb-3">Test Results:</h3>
                    <v-list>
                        <v-list-item v-for="(result, index) in testResults" :key="index" class="px-0">
                            <pre class="text-body-2">{{ result }}</pre>
                        </v-list-item>
                    </v-list>
                </div>

                <div v-if="loading" class="text-center py-4">
                    <v-progress-circular indeterminate />
                    <div class="text-caption mt-2">Running tests...</div>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>
.settings-test-page {
    max-width: 800px;
    margin: 0 auto;
}

pre {
    white-space: pre-wrap;
    word-break: break-word;
}
</style>