import { ref, computed, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

export interface WebSocketMessage {
    type: string
    [key: string]: any
}

export interface WebSocketConfig {
    url?: string
    reconnectInterval?: number
    maxReconnectAttempts?: number
    heartbeatInterval?: number
}

/**
 * Composable for WebSocket connection management
 * Provides connection handling, message routing, and automatic reconnection
 */
export function useWebSocket(config: WebSocketConfig = {}) {
    const { getToken } = useAuth()

    // Configuration - Use native WebSocket endpoint (without SockJS)
    const wsUrl = config.url || `${import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080'}/ws/job-status-native`
    const reconnectInterval = config.reconnectInterval || 3000
    const maxReconnectAttempts = config.maxReconnectAttempts || 10
    const heartbeatInterval = config.heartbeatInterval || 30000

    // Connection state
    const socket = ref<WebSocket | null>(null)
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const connectionError = ref<string | null>(null)
    const reconnectAttempts = ref(0)
    const lastConnectedAt = ref<number | null>(null)

    // Message handling
    const messageHandlers = ref<Map<string, (message: WebSocketMessage) => void>>(new Map())
    const subscriptions = ref<Set<string>>(new Set())

    // Timers
    const reconnectTimer = ref<NodeJS.Timeout | null>(null)
    const heartbeatTimer = ref<NodeJS.Timeout | null>(null)

    /**
     * Connect to WebSocket server
     */
    const connect = async (): Promise<void> => {
        if (isConnecting.value || isConnected.value) return

        try {
            isConnecting.value = true
            connectionError.value = null

            const token = getToken()
            if (!token) {
                throw new Error('No authentication token available')
            }

            const url = `${wsUrl}?token=${encodeURIComponent(token)}`
            socket.value = new WebSocket(url)

            socket.value.onopen = handleOpen
            socket.value.onmessage = handleMessage
            socket.value.onclose = handleClose
            socket.value.onerror = handleError

        } catch (error: any) {
            isConnecting.value = false
            connectionError.value = error.message
            console.error('WebSocket connection failed:', error)
            scheduleReconnect()
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    const disconnect = (): void => {
        clearTimers()

        if (socket.value) {
            socket.value.close(1000, 'Client disconnect')
            socket.value = null
        }

        isConnected.value = false
        isConnecting.value = false
        reconnectAttempts.value = 0
    }

    /**
     * Send message to server
     */
    const send = (message: WebSocketMessage): void => {
        if (!isConnected.value || !socket.value) {
            console.warn('WebSocket not connected, cannot send message:', message)
            return
        }

        try {
            socket.value.send(JSON.stringify(message))
        } catch (error) {
            console.error('Failed to send WebSocket message:', error)
        }
    }

    /**
     * Subscribe to job updates
     */
    const subscribe = (jobId: string): void => {
        subscriptions.value.add(jobId)

        if (isConnected.value) {
            send({
                type: 'subscribe_job',
                jobId
            })
        }
    }

    /**
     * Unsubscribe from job updates
     */
    const unsubscribe = (jobId: string): void => {
        subscriptions.value.delete(jobId)

        if (isConnected.value) {
            send({
                type: 'unsubscribe_job',
                jobId
            })
        }
    }

    /**
     * Subscribe to channel updates
     */
    const subscribeToChannel = (channel: string): void => {
        if (isConnected.value) {
            send({
                type: 'subscribe_channel',
                channel
            })
        }
    }

    /**
     * Unsubscribe from channel updates
     */
    const unsubscribeFromChannel = (channel: string): void => {
        if (isConnected.value) {
            send({
                type: 'unsubscribe_channel',
                channel
            })
        }
    }

    /**
     * Register message handler
     */
    const onMessage = (handler: (message: WebSocketMessage) => void): void => {
        const handlerId = Math.random().toString(36).substr(2, 9)
        messageHandlers.value.set(handlerId, handler)
    }

    /**
     * Remove message handler
     */
    const offMessage = (handler: (message: WebSocketMessage) => void): void => {
        for (const [id, h] of messageHandlers.value.entries()) {
            if (h === handler) {
                messageHandlers.value.delete(id)
                break
            }
        }
    }

    /**
     * Get connection status info
     */
    const getConnectionInfo = () => ({
        isConnected: isConnected.value,
        isConnecting: isConnecting.value,
        connectionError: connectionError.value,
        reconnectAttempts: reconnectAttempts.value,
        lastConnectedAt: lastConnectedAt.value,
        subscriptions: Array.from(subscriptions.value)
    })

    /**
     * Handle WebSocket open event
     */
    const handleOpen = (): void => {
        isConnected.value = true
        isConnecting.value = false
        connectionError.value = null
        reconnectAttempts.value = 0
        lastConnectedAt.value = Date.now()

        console.log('WebSocket connected successfully')

        // Resubscribe to all jobs
        for (const jobId of subscriptions.value) {
            send({
                type: 'subscribe_job',
                jobId
            })
        }

        // Start heartbeat
        startHeartbeat()
    }

    /**
     * Handle WebSocket message event
     */
    const handleMessage = (event: MessageEvent): void => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data)

            // Handle system messages
            if (message.type === 'connection_established') {
                console.log('WebSocket connection established:', message)
                return
            }

            if (message.type === 'heartbeat') {
                // Respond to heartbeat
                send({ type: 'pong' })
                return
            }

            if (message.type === 'pong') {
                // Heartbeat response received
                return
            }

            // Route message to handlers
            for (const handler of messageHandlers.value.values()) {
                try {
                    handler(message)
                } catch (error) {
                    console.error('Message handler error:', error)
                }
            }

        } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
        }
    }

    /**
     * Handle WebSocket close event
     */
    const handleClose = (event: CloseEvent): void => {
        isConnected.value = false
        isConnecting.value = false
        clearTimers()

        console.log('WebSocket connection closed:', event.code, event.reason)

        // Schedule reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
            scheduleReconnect()
        } else if (reconnectAttempts.value >= maxReconnectAttempts) {
            connectionError.value = 'Maximum reconnection attempts reached'
        }
    }

    /**
     * Handle WebSocket error event
     */
    const handleError = (event: Event): void => {
        console.error('WebSocket error:', event)
        connectionError.value = 'WebSocket connection error'
    }

    /**
     * Schedule reconnection attempt
     */
    const scheduleReconnect = (): void => {
        if (reconnectTimer.value) return

        reconnectAttempts.value++
        const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttempts.value - 1), 30000)

        console.log(`Scheduling WebSocket reconnect attempt ${reconnectAttempts.value} in ${delay}ms`)

        reconnectTimer.value = setTimeout(() => {
            reconnectTimer.value = null
            connect()
        }, delay)
    }

    /**
     * Start heartbeat timer
     */
    const startHeartbeat = (): void => {
        if (heartbeatTimer.value) return

        heartbeatTimer.value = setInterval(() => {
            if (isConnected.value) {
                send({ type: 'ping' })
            }
        }, heartbeatInterval)
    }

    /**
     * Clear all timers
     */
    const clearTimers = (): void => {
        if (reconnectTimer.value) {
            clearTimeout(reconnectTimer.value)
            reconnectTimer.value = null
        }

        if (heartbeatTimer.value) {
            clearInterval(heartbeatTimer.value)
            heartbeatTimer.value = null
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        disconnect()
    })

    return {
        // State
        isConnected: computed(() => isConnected.value),
        isConnecting: computed(() => isConnecting.value),
        connectionError: computed(() => connectionError.value),
        reconnectAttempts: computed(() => reconnectAttempts.value),

        // Methods
        connect,
        disconnect,
        send,
        subscribe,
        unsubscribe,
        subscribeToChannel,
        unsubscribeFromChannel,
        onMessage,
        offMessage,
        getConnectionInfo
    }
}