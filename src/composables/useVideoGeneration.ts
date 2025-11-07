import { ref, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { workflowIntegrationService } from '@/services/workflowIntegrationService'
import { contentService } from '@/services/contentService'
import type { WorkflowRequest, WorkflowResponse } from '@/types/content'
import type { WebSocketMessage } from '@/composables/useWebSocket'

export interface VideoProgressUpdate {
    jobId: string
    progress: number
    status: string
    stage?: string
    estimatedTimeRemaining?: number
    error?: string
    result?: any
}

export function useVideoGeneration() {
    // State
    const loading = ref(false)
    const progress = ref(0)
    const currentJob = ref<any>(null)
    const videoStatus = ref('')
    const currentStage = ref('')
    const estimatedTimeRemaining = ref(0)
    const videoError = ref('')
    const isTracking = ref(false)

    // WebSocket integration
    const {
        isConnected,
        connect,
        subscribe,
        unsubscribe,
        subscribeToChannel,
        unsubscribeFromChannel,
        onMessage
    } = useWebSocket()

    // Methods
    const generateVideo = async (request: WorkflowRequest): Promise<WorkflowResponse> => {
        loading.value = true
        progress.value = 0

        try {
            // Ensure contentType is provided for ContentWorkflowRequest
            const workflowRequest = {
                ...request,
                contentType: request.contentType || 'article' // Default to 'article' if not provided
            }

            const result = await contentService.triggerWorkflow(workflowRequest)

            if (result.errorCode === 'SUCCESS') {
                currentJob.value = result.data
                return result.data
            } else {
                throw new Error(result.errorMessage || 'Failed to start video generation')
            }
        } catch (error: any) {
            // console.error('Error generating video:', error)
            throw new Error(error.message || 'Failed to start video generation')
        } finally {
            loading.value = false
        }
    }

    // Generate video from job queue content
    const generateVideoFromJob = async (jobId: number): Promise<WorkflowResponse> => {
        loading.value = true
        progress.value = 0
        videoStatus.value = 'PREPARING'
        currentStage.value = 'Preparing content'

        try {
            const result = await workflowIntegrationService.generateVideoFromJob(jobId)

            if (result.errorCode === 'SUCCESS') {
                currentJob.value = { ...result.data, sourceJobId: jobId }
                return result.data
            } else {
                throw new Error(result.errorMessage || 'Failed to start video generation from job')
            }
        } catch (error: any) {
            // console.error('Error generating video from job:', error)
            videoStatus.value = 'FAILED'
            videoError.value = error.message || 'Failed to start video generation from job'
            throw error
        } finally {
            loading.value = false
        }
    }

    // Generate video asynchronously from job queue content
    const generateVideoFromJobAsync = async (jobId: number): Promise<WorkflowResponse> => {
        loading.value = true
        progress.value = 0
        videoStatus.value = 'QUEUED'
        currentStage.value = 'Queuing video generation'

        try {
            const result = await workflowIntegrationService.generateVideoFromJobAsync(jobId)

            if (result.errorCode === 'SUCCESS') {
                currentJob.value = { ...result.data, sourceJobId: jobId }
                return result.data
            } else {
                throw new Error(result.errorMessage || 'Failed to queue video generation from job')
            }
        } catch (error: any) {
            // console.error('Error generating video async from job:', error)
            videoStatus.value = 'FAILED'
            videoError.value = error.message || 'Failed to queue video generation from job'
            throw error
        } finally {
            loading.value = false
        }
    }

    const checkVideoProgress = async (jobId: string) => {
        try {
            const response = await fetch(`/api/v1/content/workflow/${jobId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.errorCode === 'SUCCESS') {
                progress.value = result.data.progress || 0
                return result.data
            } else {
                throw new Error(result.errorMessage || 'Failed to check video progress')
            }
        } catch (error: any) {
            // console.error('Error checking video progress:', error)
            throw new Error(error.message || 'Failed to check video progress')
        }
    }

    const cancelVideoGeneration = async (jobId: string) => {
        try {
            const response = await fetch(`/api/v1/content/workflow/${jobId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.errorCode === 'SUCCESS') {
                currentJob.value = null
                progress.value = 0
                return result.data
            } else {
                throw new Error(result.errorMessage || 'Failed to cancel video generation')
            }
        } catch (error: any) {
            // console.error('Error cancelling video generation:', error)
            throw new Error(error.message || 'Failed to cancel video generation')
        }
    }

    // WebSocket message handler for video progress
    const handleVideoProgressMessage = (message: WebSocketMessage) => {
        if (!isTracking.value) return

        switch (message.type) {
            case 'video_progress':
                handleVideoProgress(message)
                break
            case 'video_stage_update':
                handleVideoStageUpdate(message)
                break
            case 'video_completed':
                handleVideoCompleted(message)
                break
            case 'video_failed':
                handleVideoFailed(message)
                break
            case 'n8n_workflow_progress':
                handleN8NProgress(message)
                break
            default:
                // Ignore other message types
                break
        }
    }

    // Handle video progress updates
    const handleVideoProgress = (message: WebSocketMessage) => {
        const { jobId, progress: newProgress, estimatedTime } = message

        if (currentJob.value && currentJob.value.id?.toString() === jobId) {
            progress.value = Math.min(Math.max(newProgress || 0, 0), 100)

            if (estimatedTime !== undefined) {
                estimatedTimeRemaining.value = estimatedTime
            }
        }
    }

    // Handle video stage updates
    const handleVideoStageUpdate = (message: WebSocketMessage) => {
        const { jobId, stage, status } = message

        if (currentJob.value && currentJob.value.id?.toString() === jobId) {
            currentStage.value = stage || ''
            videoStatus.value = status || videoStatus.value
        }
    }

    // Handle video completion
    const handleVideoCompleted = (message: WebSocketMessage) => {
        const { jobId, result } = message

        if (currentJob.value && currentJob.value.id?.toString() === jobId) {
            progress.value = 100
            videoStatus.value = 'COMPLETED'
            currentStage.value = 'Completed'
            estimatedTimeRemaining.value = 0

            if (result) {
                currentJob.value = { ...currentJob.value, result }
            }

            // Stop tracking this job
            stopProgressTracking()
        }
    }

    // Handle video failure
    const handleVideoFailed = (message: WebSocketMessage) => {
        const { jobId, error } = message

        if (currentJob.value && currentJob.value.id?.toString() === jobId) {
            videoStatus.value = 'FAILED'
            videoError.value = error || 'Video generation failed'
            currentStage.value = 'Failed'
            estimatedTimeRemaining.value = 0

            // Stop tracking this job
            stopProgressTracking()
        }
    }

    // Handle N8N workflow progress (more detailed progress from N8N)
    const handleN8NProgress = (message: WebSocketMessage) => {
        const {
            workflowId,
            nodeId,
            nodeName,
            progress: nodeProgress,
            status,
            executionId
        } = message

        // Map N8N progress to our video generation progress
        if (currentJob.value && currentJob.value.executionId === executionId) {
            // Update stage based on node name
            if (nodeName) {
                currentStage.value = mapN8NNodeToStage(nodeName)
            }

            // Update overall progress based on node progress
            if (nodeProgress !== undefined) {
                progress.value = Math.min(Math.max(nodeProgress, 0), 100)
            }

            // Update status
            if (status) {
                videoStatus.value = status
            }
        }
    }

    // Map N8N node names to user-friendly stage names
    const mapN8NNodeToStage = (nodeName: string): string => {
        const stageMap: Record<string, string> = {
            'content-analysis': 'Analyzing Content',
            'script-generation': 'Generating Script',
            'voice-synthesis': 'Creating Voice',
            'video-rendering': 'Rendering Video',
            'final-processing': 'Final Processing',
            'upload-storage': 'Uploading Video'
        }

        return stageMap[nodeName.toLowerCase()] || nodeName
    }

    // Start tracking video progress for a specific job
    const startProgressTracking = (jobId: string) => {
        if (!isConnected.value) {
            console.warn('WebSocket not connected, cannot track video progress')
            return
        }

        isTracking.value = true

        // Subscribe to video progress channel
        subscribeToChannel('video-progress')

        // Subscribe to specific job updates
        subscribe(`video-${jobId}`)

        // Subscribe to N8N workflow updates if we have execution ID
        if (currentJob.value?.executionId) {
            subscribe(`n8n-execution-${currentJob.value.executionId}`)
        }

        // console.log(`Started tracking video progress for job: ${jobId}`)
    }

    // Stop tracking video progress
    const stopProgressTracking = () => {
        if (!isTracking.value) return

        isTracking.value = false

        // Unsubscribe from channels
        unsubscribeFromChannel('video-progress')

        if (currentJob.value) {
            unsubscribe(`video-${currentJob.value.id}`)

            if (currentJob.value.executionId) {
                unsubscribe(`n8n-execution-${currentJob.value.executionId}`)
            }
        }

        // console.log('Stopped tracking video progress')
    }

    // Enhanced generate video method with progress tracking
    const generateVideoWithTracking = async (request: WorkflowRequest): Promise<WorkflowResponse> => {
        loading.value = true
        progress.value = 0
        videoError.value = ''
        videoStatus.value = 'STARTING'
        currentStage.value = 'Initializing'

        try {
            const result = await generateVideo(request)

            // Start progress tracking if WebSocket is connected
            if (isConnected.value && result.id) {
                startProgressTracking(result.id.toString())
            }

            return result
        } catch (error) {
            videoStatus.value = 'FAILED'
            videoError.value = error instanceof Error ? error.message : 'Unknown error'
            throw error
        }
    }

    // Enhanced cancel method
    const cancelVideoGenerationWithTracking = async (jobId: string) => {
        try {
            const result = await cancelVideoGeneration(jobId)

            // Stop tracking
            stopProgressTracking()

            // Reset state
            videoStatus.value = 'CANCELLED'
            currentStage.value = 'Cancelled'
            progress.value = 0
            estimatedTimeRemaining.value = 0

            return result
        } catch (error) {
            throw error
        }
    }

    const reset = () => {
        loading.value = false
        progress.value = 0
        currentJob.value = null
        videoStatus.value = ''
        currentStage.value = ''
        estimatedTimeRemaining.value = 0
        videoError.value = ''

        // Stop any active tracking
        stopProgressTracking()
    }

    // Initialize WebSocket connection and message handler
    onMounted(() => {
        onMessage(handleVideoProgressMessage)

        // Connect if not already connected
        if (!isConnected.value) {
            connect().catch(error => {
                // console.error('Failed to connect to WebSocket for video progress:', error)
            })
        }
    })

    // Cleanup on unmount
    onUnmounted(() => {
        stopProgressTracking()
    })

    return {
        // State
        loading,
        progress,
        currentJob,
        videoStatus,
        currentStage,
        estimatedTimeRemaining,
        videoError,
        isTracking,

        // WebSocket state
        isConnected,

        // Methods
        generateVideo,
        checkVideoProgress,
        cancelVideoGeneration,
        reset,

        // Job-based video generation methods
        generateVideoFromJob,
        generateVideoFromJobAsync,

        // Enhanced methods with WebSocket tracking
        generateVideoWithTracking,
        cancelVideoGenerationWithTracking,
        startProgressTracking,
        stopProgressTracking
    }
}