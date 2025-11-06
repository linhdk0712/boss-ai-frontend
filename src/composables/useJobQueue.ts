import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import type { Job, PaginationInfo } from '@/types/content'

export function useJobQueue() {
    // State
    const jobs = ref<Job[]>([])
    const selectedJob = ref<Job | null>(null)
    const loading = ref(false)
    const detailsLoading = ref(false)
    const realTimeUpdatesEnabled = ref(true)

    // WebSocket connection
    const {
        isConnected,
        connect: connectWebSocket,
        disconnect: disconnectWebSocket,
        onMessage
    } = useWebSocket()

    // Pagination
    const pagination = ref<PaginationInfo>({
        page: 0,
        size: 10,
        total: 0,
        totalPages: 0
    })

    // Methods
    const getJobs = async (page = 0, size = 10, filters?: any) => {
        loading.value = true
        try {
            const token = localStorage.getItem('accessToken')

            // For development: try API first, fallback to mock data if no token or API fails
            if (token) {
                try {
                    const params = new URLSearchParams({
                        page: page.toString(),
                        size: size.toString(),
                        ...filters
                    })

                    const response = await fetch(`http://localhost:8080/api/v1/queue/jobs?${params}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()

                        if (data.errorCode === 'SUCCESS') {
                            jobs.value = data.data.content || []
                            pagination.value = {
                                page: data.data.number || 0,
                                size: data.data.size || 10,
                                total: data.data.totalElements || 0,
                                totalPages: data.data.totalPages || 0
                            }
                            return
                        }
                    }
                } catch (apiError) {
                    console.warn('API call failed, using mock data:', apiError)
                }
            }

            // Mock data for development
            const mockJobs: Job[] = [
                {
                    id: '1',
                    jobId: 'job-001',
                    userId: 1,
                    status: 'COMPLETED',
                    priority: 'HIGH',
                    contentType: 'blog-post',
                    requestParams: {
                        topic: 'AI Technology',
                        length: 'medium',
                        tone: 'professional'
                    },
                    result: 'Generated blog post about AI technology...',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    completedAt: new Date(Date.now() - 1800000).toISOString(),
                    retryCount: 0,
                    maxRetries: 3
                },
                {
                    id: '2',
                    jobId: 'job-002',
                    userId: 1,
                    status: 'PROCESSING',
                    priority: 'STANDARD',
                    contentType: 'article',
                    requestParams: {
                        topic: 'Machine Learning',
                        length: 'long',
                        tone: 'technical'
                    },
                    createdAt: new Date(Date.now() - 1800000).toISOString(),
                    startedAt: new Date(Date.now() - 900000).toISOString(),
                    retryCount: 0,
                    maxRetries: 3
                },
                {
                    id: '3',
                    jobId: 'job-003',
                    userId: 1,
                    status: 'FAILED',
                    priority: 'LOW',
                    contentType: 'social-media',
                    requestParams: {
                        platform: 'twitter',
                        topic: 'Tech News',
                        count: 5
                    },
                    errorMessage: 'API rate limit exceeded',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    startedAt: new Date(Date.now() - 6300000).toISOString(),
                    completedAt: new Date(Date.now() - 6000000).toISOString(),
                    retryCount: 2,
                    maxRetries: 3
                }
            ]

            // Simulate pagination
            const startIndex = page * size
            const endIndex = startIndex + size
            const paginatedJobs = mockJobs.slice(startIndex, endIndex)

            jobs.value = paginatedJobs
            pagination.value = {
                page: page,
                size: size,
                total: mockJobs.length,
                totalPages: Math.ceil(mockJobs.length / size)
            }

        } catch (error) {
            console.error('Error fetching jobs:', error)
            jobs.value = []
            throw error
        } finally {
            loading.value = false
        }
    }

    const getJobDetails = async (jobId: string) => {
        detailsLoading.value = true
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                throw new Error('No authentication token found')
            }

            const response = await fetch(`http://localhost:8080/api/v1/queue/jobs/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.errorCode === 'SUCCESS') {
                return data.data
            } else {
                throw new Error(data.errorMessage || 'Failed to fetch job details')
            }
        } catch (error) {
            console.error('Error fetching job details:', error)
            throw error
        } finally {
            detailsLoading.value = false
        }
    }

    const retryJob = async (jobId: string) => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                throw new Error('No authentication token found')
            }

            const response = await fetch(`http://localhost:8080/api/v1/job-queue/jobs/${jobId}/retry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.errorCode === 'SUCCESS') {
                return data.data
            } else {
                throw new Error(data.errorMessage || 'Failed to retry job')
            }
        } catch (error) {
            console.error('Error retrying job:', error)
            throw error
        }
    }

    const downloadJobContent = async (jobId: string, format = 'txt') => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                throw new Error('No authentication token found')
            }

            const response = await fetch(`http://localhost:8080/api/v1/job-queue/jobs/${jobId}/download?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            // Handle file download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `job-${jobId}.${format}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error downloading job content:', error)
            throw error
        }
    }

    const toggleRealTimeUpdates = (enabled: boolean) => {
        realTimeUpdatesEnabled.value = enabled
        if (enabled) {
            connectWebSocket()
        } else {
            disconnectWebSocket()
        }
    }

    /**
     * Handle WebSocket messages for job updates
     */
    const handleWebSocketMessage = (message: any): void => {
        console.log('Job Queue WebSocket message:', message) // Debug log

        if (message.type === 'job_status_update' || message.type === 'job_completed') {
            const { jobId } = message

            // Find and update the job in the current list
            const jobIndex = jobs.value.findIndex(job => job.jobId === jobId)
            if (jobIndex !== -1) {
                const updatedJob = { ...jobs.value[jobIndex] }

                if (message.type === 'job_status_update') {
                    const { data } = message
                    updatedJob.status = data.status || updatedJob.status
                    if (data.status === 'PROCESSING' && !updatedJob.startedAt) {
                        updatedJob.startedAt = new Date().toISOString()
                    }
                } else if (message.type === 'job_completed') {
                    const { result } = message
                    updatedJob.status = result.success ? 'COMPLETED' : 'FAILED'
                    updatedJob.completedAt = new Date().toISOString()
                    if (result.success && result.result) {
                        updatedJob.result = result.result.generatedContent || JSON.stringify(result.result)
                    }
                    if (!result.success && result.error) {
                        updatedJob.errorMessage = result.error
                    }
                }

                // Update the job in the array
                jobs.value[jobIndex] = updatedJob

                console.log(`Updated job ${jobId} status to ${updatedJob.status}`) // Debug log
            } else {
                // Job not in current page, refresh to get latest data
                console.log(`Job ${jobId} not found in current page, refreshing...`) // Debug log
                refreshCurrentPage()
            }
        }
    }

    /**
     * Refresh current page data
     */
    const refreshCurrentPage = async () => {
        if (!loading.value) {
            try {
                await getJobs(pagination.value.page, pagination.value.size)
            } catch (error) {
                console.error('Error refreshing job queue:', error)
            }
        }
    }

    /**
     * Initialize WebSocket connection
     */
    const initializeWebSocket = () => {
        if (realTimeUpdatesEnabled.value) {
            connectWebSocket()
            onMessage(handleWebSocketMessage)
        }
    }

    /**
     * Cleanup WebSocket connection
     */
    const cleanupWebSocket = () => {
        disconnectWebSocket()
    }

    // Initialize WebSocket on mount
    onMounted(() => {
        initializeWebSocket()
    })

    // Cleanup on unmount
    onUnmounted(() => {
        cleanupWebSocket()
    })

    return {
        // State
        jobs: computed(() => jobs.value),
        selectedJob: computed(() => selectedJob.value),
        loading: computed(() => loading.value),
        detailsLoading: computed(() => detailsLoading.value),
        pagination: computed(() => pagination.value),
        realTimeUpdatesEnabled: computed(() => realTimeUpdatesEnabled.value),
        isConnected: computed(() => isConnected.value),

        // Methods
        getJobs,
        getJobDetails,
        retryJob,
        downloadJobContent,
        toggleRealTimeUpdates,
        refreshCurrentPage,
        initializeWebSocket,
        cleanupWebSocket
    }
}