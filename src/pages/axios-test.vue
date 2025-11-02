<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <h1>Axios Test Page</h1>

                <v-card class="mb-4">
                    <v-card-title>API Client Test</v-card-title>
                    <v-card-text>
                        <v-btn @click="testApiClient" color="primary" class="mb-2">
                            Test API Client
                        </v-btn>

                        <v-btn @click="testConfigService" color="secondary" class="mb-2 ml-2">
                            Test Config Service
                        </v-btn>

                        <div v-if="result" class="mt-4">
                            <h3>Result:</h3>
                            <pre>{{ result }}</pre>
                        </div>

                        <div v-if="error" class="mt-4">
                            <v-alert type="error">
                                <h3>Error:</h3>
                                <pre>{{ error }}</pre>
                            </v-alert>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/plugins/axios'
import { configService } from '@/services/configService'

const result = ref('')
const error = ref('')

const testApiClient = async () => {
    try {
        error.value = ''
        result.value = 'Testing API client...'

        console.log('API Client:', apiClient)

        const response = await apiClient.get('/config/industry')
        result.value = JSON.stringify(response.data, null, 2)

    } catch (err: any) {
        console.error('API Client test error:', err)
        error.value = err.message || 'Unknown error'
    }
}

const testConfigService = async () => {
    try {
        error.value = ''
        result.value = 'Testing config service...'

        const response = await configService.getIndustryOptions()
        result.value = JSON.stringify(response, null, 2)

    } catch (err: any) {
        console.error('Config service test error:', err)
        error.value = err.message || 'Unknown error'
    }
}

// Page metadata
definePage({
    name: 'axios-test',
    meta: {
        title: 'Axios Test',
        requiresAuth: true
    }
})
</script>
</template>