<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

definePage({
    name: 'websocket-test',
    meta: {
        title: 'WebSocket Test',
        requiresAuth: true
    }
})

const { getToken, currentUser } = useAuth()

const connectionStatus = ref('Disconnected')
const messages = ref<string[]>([])
const testResults = ref<Record<string, any>>({})
const ws = ref<WebSocket | null>(null)

const addMessage = (message: string) => {
    messages.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`)
}

const testToken = () => {
    const token = getToken()
    testResults.value.token = {
        exists: !!token,
        length: token?.length || 0,
        preview: token ? `${token.substring(0, 20)}...` : 'No token'
    }

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            testResults.value.tokenPayload = {
                username: payload.sub,
                issuedAt: new Date(payload.iat * 1000).toLocaleString(),
                expiresAt: new Date(payload.exp * 1000).toLocaleString(),
                isExpired: Date.now() > payload.exp * 1000
            }
        } catch (error) {
            testResults.value.tokenPayload = { error: 'Invalid token format' }
        }
    }

    addMessage(`Token test completed: ${token ? 'Valid' : 'Missing'}`)
}

const testWebSocketConnection = () => {
    const token = getToken()
    if (!token) {
        addMessage('❌ No token available for WebSocket connection')
        return
    }

    connectionStatus.value = 'Connecting...'
    addMessage('🔄 Attempting WebSocket connection...')

    const wsUrl = `ws://localhost:8080/ws/job-status-native?token=${encodeURIComponent(token)}`

    try {
        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
            connectionStatus.value = 'Connected'
            addMessage('✅ WebSocket connected successfully!')
        }

        ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                addMessage(`📨 Received: ${data.type} - ${JSON.stringify(data)}`)
            } catch (error) {
                addMessage(`📨 Raw message: ${event.data}`)
            }
        }

        ws.value.onerror = (error) => {
            connectionStatus.value = 'Error'
            addMessage(`❌ WebSocket error: ${error}`)
        }

        ws.value.onclose = (event) => {
            connectionStatus.value = 'Disconnected'
            addMessage(`🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason}`)
        }

    } catch (error) {
        connectionStatus.value = 'Error'
        addMessage(`❌ Failed to create WebSocket: ${error}`)
    }
}

const sendTestMessage = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        const message = {
            type: 'ping',
            timestamp: Date.now()
        }
        ws.value.send(JSON.stringify(message))
        addMessage(`📤 Sent ping message`)
    } else {
        addMessage('❌ WebSocket not connected')
    }
}

const disconnect = () => {
    if (ws.value) {
        ws.value.close()
        ws.value = null
        connectionStatus.value = 'Disconnected'
        addMessage('🔌 WebSocket disconnected manually')
    }
}

const clearMessages = () => {
    messages.value = []
}

onMounted(() => {
    testToken()
    addMessage('🚀 WebSocket test page loaded')
})
</script>

<template>
    <div class="pa-6">
        <VCard>
            <VCardTitle>WebSocket Connection Test</VCardTitle>
            <VCardText>
                <div class="mb-4">
                    <h3>Current User</h3>
                    <p><strong>Username:</strong> {{ currentUser?.username || 'Not logged in' }}</p>
                    <p><strong>Email:</strong> {{ currentUser?.email || 'N/A' }}</p>
                </div>

                <div class="mb-4">
                    <h3>Connection Status</h3>
                    <VChip
                        :color="connectionStatus === 'Connected' ? 'success' : connectionStatus === 'Error' ? 'error' : 'warning'"
                        class="mb-2">
                        {{ connectionStatus }}
                    </VChip>
                </div>

                <div class="mb-4">
                    <h3>Actions</h3>
                    <div class="d-flex gap-2 flex-wrap">
                        <VBtn @click="testToken" color="info">Test Token</VBtn>
                        <VBtn @click="testWebSocketConnection" color="primary"
                            :disabled="connectionStatus === 'Connecting'">
                            Connect WebSocket
                        </VBtn>
                        <VBtn @click="sendTestMessage" color="success" :disabled="connectionStatus !== 'Connected'">
                            Send Ping
                        </VBtn>
                        <VBtn @click="disconnect" color="warning" :disabled="connectionStatus === 'Disconnected'">
                            Disconnect
                        </VBtn>
                        <VBtn @click="clearMessages" color="secondary">Clear Messages</VBtn>
                    </div>
                </div>

                <div class="mb-4" v-if="Object.keys(testResults).length > 0">
                    <h3>Test Results</h3>
                    <VExpansionPanels>
                        <VExpansionPanel title="Token Information">
                            <VExpansionPanelText>
                                <pre>{{ JSON.stringify(testResults, null, 2) }}</pre>
                            </VExpansionPanelText>
                        </VExpansionPanel>
                    </VExpansionPanels>
                </div>

                <div>
                    <h3>Messages</h3>
                    <VCard variant="outlined" class="pa-3" style="height: 300px; overflow-y: auto;">
                        <div v-if="messages.length === 0" class="text-center text-disabled">
                            No messages yet...
                        </div>
                        <div v-for="(message, index) in messages" :key="index" class="mb-1">
                            <code>{{ message }}</code>
                        </div>
                    </VCard>
                </div>
            </VCardText>
        </VCard>
    </div>
</template>

<style scoped>
pre {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
}

code {
    font-family: 'Courier New', monospace;
    font-size: 12px;
}
</style>