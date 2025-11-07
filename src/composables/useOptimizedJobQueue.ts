import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDebounceFn, useThrottleFn, useLocalStorage } from '@vueuse/core'
import { jobQueueService } from '@/services/jobQueueService'
import { useToastNotifications } from '@/composables/useToastNotifications'
import type { Job, JobFilterCriteria, PaginationInfo, JobStatistics } from '@/types/content'

/**
 * Optimized composable for job queue management with performance enhancements
 * Features: caching, debouncing, virtual scrolling support, and intelligent prefetching
 */
export function useOptimizedJobQueue() {
    // State management
    const jobs = ref<Job[]>([])
    const totalItems = ref(0)
    const loading = ref(false)
    const searchLoading = ref(false)
    const contentTypesLoading = ref(false)
    const error = ref<string | null>(null)

    // Pagination and filtering
    const currentPage = ref(0)
    const pageSize = ref(25) // Larger page size for virtual scrolling
    const filters = ref<JobFilterCriteria>({
        search: '',
        status: [],
        contentType: [],
        dateRange: [],
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    // Statistics and metadata
    const statistics = ref<JobStatistics | null>(null)
    const availableContentTypes = ref<string[]>([])

    // Performance tracking
    const lastRequestTime = ref<number | null>(null)
    const requestCount = ref(0)

    // Caching
    const jobCache = new Map<string, Job[]>()
    const statisticsCache = new Map<string, JobStatistics>()
    const contentTypesCache = ref<string[]>([])
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes

    // Local storage for user preferences
    const userPreferences = useLocalStorage('job-queue-preferences', {
        pageSize: 25,
        defaultFilters: filters.value,
        sortPreferences: {
            sortBy: 'createdAt',
            sortOrder: 'desc' as 'asc' | 'desc'
        }
    })

    // Toast notifications
    const { showSuccess, showError, showWarning } = useToastNotifications()

    // Computed properties
    const hasMore = computed(() => {
        return jobs.value.length < totalItems.value
    })

    const pagination = computed<PaginationInfo>(() => ({
        page: currentPage.value,
        size: pageSize.value,
        total: totalItems.value,
        totalPages: Math.ceil(totalItems.value / pageSize.value)
    }))

    const isFiltered = computed(() => {
        return !!(
            filters.value.search?.trim() ||
            filters.value.status?.length ||
            filters.value.contentType?.length ||
            filters.value.dateRange?.length
        )
    })

    const cacheKey = computed(() => {
        return JSON.stringify({
            page: currentPage.value,
            size: pageSize.value,
            filters: filters.value
        })
    })

    // Performance metrics
    const averageRequestTime = computed(() => {
        return lastRequestTime.value ? `${lastRequestTime.value}ms` : null
    })

    // Debounced and throttled functions
    const debouncedSearch = useDebounceFn(async (searchText: string) => {
        searchLoading.value = true
        filters.value.search = searchText
        currentPage.value = 0
        await loadJobs(true)
        searchLoading.value = false
    }, 300)

    const throttledFilterChange = useThrottleFn(async () => {
        currentPage.value = 0
        await loadJobs(true)
    }, 150)

    // Cache management
    const getCachedJobs = (key: string): Job[] | null => {
        const cached = jobCache.get(key)
        if (cached) {
            // Simple cache validation - in production, you'd want timestamp-based expiry
            return cached
        }
        return null
    }

    const setCachedJobs = (key: string, data: Job[]) => {
        // Limit cache size to prevent memory issues
        if (jobCache.size > 50) {
            const firstKey = jobCache.keys().next().value
            jobCache.delete(firstKey)
        }
        jobCache.set(key, data)
    }

    const getCachedStatistics = (userId: string): JobStatistics | null => {
        return statisticsCache.get(userId) || null
    }

    const setCachedStatistics = (userId: string, stats: JobStatistics) => {
        statisticsCache.set(userId, stats)
    }

    const clearCache = () => {
        jobCache.clear()
        statisticsCache.clear()
        contentTypesCache.value = []
    }

    // Main data loading function
    const loadJobs = async (reset = false) => {
        if (loading.value) return

        const startTime = performance.now()

        try {
            loading.value = true
            error.value = null

            // Check cache first
            const cached = getCachedJobs(cacheKey.value)
            if (cached && !reset) {
                jobs.value = reset ? cached : [...jobs.value, ...cached]
                loading.value = false
                return
            }

            // Make API request
            const response = await jobQueueService.getJobs({
                page: currentPage.value,
                size: pageSize.value,
                ...filters.value
            })

            if (response.success && response.data) {
                const newJobs = response.data.jobs || []

                // Update jobs list
                if (reset || currentPage.value === 0) {
                    jobs.value = newJobs
                } else {
                    // Append for infinite scrolling
                    jobs.value = [...jobs.value, ...newJobs]
                }

                // Update metadata
                totalItems.value = response.data.pagination?.totalElements || 0
                statistics.value = response.data.statistics || null

                // Cache the results
                setCachedJobs(cacheKey.value, newJobs)

                // Cache statistics
                if (statistics.value) {
                    setCachedStatistics('current-user', statistics.value)
                }

                // Performance tracking
                const endTime = performance.now()
                lastRequestTime.value = Math.round(endTime - startTime)
                requestCount.value++

            } else {
                throw new Error(response.message || 'Failed to load jobs')
            }

        } catch (err: any) {
            error.value = err.message || 'Failed to load jobs'
            showError('Failed to load jobs', err.message)
            // console.error('Error loading jobs:', err)
        } finally {
            loading.value = false
        }
    }

    // Load more jobs for infinite scrolling
    const loadMore = async () => {
        if (!hasMore.value || loading.value) return

        currentPage.value++
        await loadJobs(false)
    }

    // Search functionality
    const searchJobs = async (searchText: string) => {
        debouncedSearch(searchText)
    }

    // Filter management
    const updateFilters = async (newFilters: Partial<JobFilterCriteria>) => {
        filters.value = { ...filters.value, ...newFilters }

        // Save user preferences
        userPreferences.value.defaultFilters = filters.value

        await throttledFilterChange()
    }

    const clearFilters = async () => {
        filters.value = {
            search: '',
            status: [],
            contentType: [],
            dateRange: [],
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }

        currentPage.value = 0
        clearCache()
        await loadJobs(true)

        showSuccess('Filters cleared')
    }

    // Sorting
    const updateSort = async (sortBy: string, sortOrder: 'asc' | 'desc') => {
        filters.value.sortBy = sortBy
        filters.value.sortOrder = sortOrder

        // Save sort preferences
        userPreferences.value.sortPreferences = { sortBy, sortOrder }

        currentPage.value = 0
        clearCache()
        await loadJobs(true)
    }

    // Content types management
    const loadContentTypes = async () => {
        if (contentTypesLoading.value) return

        // Check cache first
        if (contentTypesCache.value.length > 0) {
            availableContentTypes.value = contentTypesCache.value
            return
        }

        try {
            contentTypesLoading.value = true

            const response = await jobQueueService.getContentTypes()

            if (response.success && response.data) {
                availableContentTypes.value = response.data
                contentTypesCache.value = response.data
            }

        } catch (err: any) {
            // console.error('Error loading content types:', err)
            // Don't show error toast for this as it's not critical
        } finally {
            contentTypesLoading.value = false
        }
    }

    // Job actions
    const retryJob = async (job: Job) => {
        try {
            loading.value = true

            const response = await jobQueueService.retryJob(job.id)

            if (response.success) {
                showSuccess(`Job #${job.id} queued for retry`)

                // Update job in the list
                const jobIndex = jobs.value.findIndex(j => j.id === job.id)
                if (jobIndex !== -1) {
                    jobs.value[jobIndex] = { ...job, status: 'PENDING', retryCount: job.retryCount + 1 }
                }

                // Clear cache to ensure fresh data on next load
                clearCache()

            } else {
                throw new Error(response.message || 'Failed to retry job')
            }

        } catch (err: any) {
            showError('Failed to retry job', err.message)
            // console.error('Error retrying job:', err)
        } finally {
            loading.value = false
        }
    }

    const generateVideo = async (job: Job) => {
        try {
            loading.value = true

            const response = await jobQueueService.generateVideo(job.id)

            if (response.success) {
                showSuccess(`Video generation started for job #${job.id}`)
            } else {
                throw new Error(response.message || 'Failed to start video generation')
            }

        } catch (err: any) {
            showError('Failed to generate video', err.message)
            // console.error('Error generating video:', err)
        } finally {
            loading.value = false
        }
    }

    // Refresh data
    const refresh = async () => {
        clearCache()
        currentPage.value = 0
        await Promise.all([
            loadJobs(true),
            loadContentTypes()
        ])
    }

    // Prefetch next page for better UX
    const prefetchNextPage = async () => {
        if (!hasMore.value || loading.value) return

        const nextPageKey = JSON.stringify({
            page: currentPage.value + 1,
            size: pageSize.value,
            filters: filters.value
        })

        // Only prefetch if not already cached
        if (!getCachedJobs(nextPageKey)) {
            try {
                const response = await jobQueueService.getJobs({
                    page: currentPage.value + 1,
                    size: pageSize.value,
                    ...filters.value
                })

                if (response.success && response.data?.jobs) {
                    setCachedJobs(nextPageKey, response.data.jobs)
                }
            } catch (err) {
                // Silently fail prefetch
            }
        }
    }

    // Auto-refresh for real-time updates
    const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)

    const startAutoRefresh = (intervalMs = 30000) => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
        }

        autoRefreshInterval.value = setInterval(async () => {
            // Only refresh if user is not actively interacting
            if (!loading.value && !searchLoading.value) {
                await loadJobs(true)
            }
        }, intervalMs)
    }

    const stopAutoRefresh = () => {
        if (autoRefreshInterval.value) {
            clearInterval(autoRefreshInterval.value)
            autoRefreshInterval.value = null
        }
    }

    // Initialize with user preferences
    const initializeWithPreferences = () => {
        const prefs = userPreferences.value

        if (prefs.pageSize) {
            pageSize.value = prefs.pageSize
        }

        if (prefs.defaultFilters) {
            filters.value = { ...filters.value, ...prefs.defaultFilters }
        }

        if (prefs.sortPreferences) {
            filters.value.sortBy = prefs.sortPreferences.sortBy
            filters.value.sortOrder = prefs.sortPreferences.sortOrder
        }
    }

    // Lifecycle
    onMounted(async () => {
        initializeWithPreferences()

        await Promise.all([
            loadJobs(true),
            loadContentTypes()
        ])

        // Start auto-refresh
        startAutoRefresh()

        // Prefetch next page after initial load
        setTimeout(prefetchNextPage, 1000)
    })

    onUnmounted(() => {
        stopAutoRefresh()
    })

    // Watch for filter changes to trigger prefetch
    watch(filters, () => {
        // Prefetch after filter changes
        setTimeout(prefetchNextPage, 500)
    }, { deep: true })

    return {
        // State
        jobs,
        totalItems,
        loading,
        searchLoading,
        contentTypesLoading,
        error,

        // Pagination and filtering
        currentPage,
        pageSize,
        filters,
        pagination,
        hasMore,
        isFiltered,

        // Statistics and metadata
        statistics,
        availableContentTypes,

        // Performance metrics
        averageRequestTime,
        requestCount,

        // Methods
        loadJobs,
        loadMore,
        searchJobs,
        updateFilters,
        clearFilters,
        updateSort,
        loadContentTypes,
        retryJob,
        generateVideo,
        refresh,

        // Cache management
        clearCache,

        // Auto-refresh
        startAutoRefresh,
        stopAutoRefresh
    }
}