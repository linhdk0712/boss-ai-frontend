import { ref, reactive, computed, watch } from 'vue'
import type { JobFilterCriteria } from '@/types/content'

export interface JobFilterOptions {
    statusOptions: Array<{ value: string; label: string; color?: string }>
    contentTypeOptions: Array<{ value: string; label: string }>
    dateRangePresets: Array<{ value: string; label: string; range: [string, string] }>
}

export function useJobFilters() {
    // Filter state
    const filters = reactive<JobFilterCriteria>({
        search: '',
        status: [],
        contentType: [],
        dateRange: []
    })

    // UI state
    const showAdvancedFilters = ref(false)
    const isFiltering = ref(false)

    // Filter options
    const filterOptions: JobFilterOptions = {
        statusOptions: [
            { value: 'PENDING', label: 'Pending', color: 'warning' },
            { value: 'PROCESSING', label: 'Processing', color: 'info' },
            { value: 'COMPLETED', label: 'Completed', color: 'success' },
            { value: 'FAILED', label: 'Failed', color: 'error' },
            { value: 'CANCELLED', label: 'Cancelled', color: 'secondary' }
        ],
        contentTypeOptions: [
            { value: 'blog-post', label: 'Blog Post' },
            { value: 'article', label: 'Article' },
            { value: 'social-media-post', label: 'Social Media Post' },
            { value: 'marketing-copy', label: 'Marketing Copy' },
            { value: 'product-description', label: 'Product Description' },
            { value: 'email', label: 'Email' },
            { value: 'story', label: 'Story' },
            { value: 'script', label: 'Script' },
            { value: 'other', label: 'Other' }
        ],
        dateRangePresets: [
            {
                value: 'today',
                label: 'Today',
                range: [
                    new Date().toISOString().split('T')[0],
                    new Date().toISOString().split('T')[0]
                ]
            },
            {
                value: 'yesterday',
                label: 'Yesterday',
                range: [
                    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                ]
            },
            {
                value: 'last-7-days',
                label: 'Last 7 Days',
                range: [
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    new Date().toISOString().split('T')[0]
                ]
            },
            {
                value: 'last-30-days',
                label: 'Last 30 Days',
                range: [
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    new Date().toISOString().split('T')[0]
                ]
            },
            {
                value: 'this-month',
                label: 'This Month',
                range: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                    new Date().toISOString().split('T')[0]
                ]
            },
            {
                value: 'last-month',
                label: 'Last Month',
                range: [
                    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
                    new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
                ]
            }
        ]
    }

    // Computed properties
    const hasActiveFilters = computed(() => {
        return !!(
            filters.search ||
            (filters.status && filters.status.length > 0) ||
            (filters.contentType && filters.contentType.length > 0) ||
            (filters.dateRange && filters.dateRange.length > 0)
        )
    })

    const activeFilterCount = computed(() => {
        let count = 0
        if (filters.search) count++
        if (filters.status && filters.status.length > 0) count++
        if (filters.contentType && filters.contentType.length > 0) count++
        if (filters.dateRange && filters.dateRange.length > 0) count++
        return count
    })

    const filterSummary = computed(() => {
        const summary: string[] = []

        if (filters.search) {
            summary.push(`Search: "${filters.search}"`)
        }

        if (filters.status && filters.status.length > 0) {
            summary.push(`Status: ${filters.status.join(', ')}`)
        }

        if (filters.contentType && filters.contentType.length > 0) {
            summary.push(`Type: ${filters.contentType.join(', ')}`)
        }

        if (filters.dateRange && filters.dateRange.length === 2) {
            summary.push(`Date: ${filters.dateRange[0]} to ${filters.dateRange[1]}`)
        }

        return summary.join(' | ')
    })

    // Methods
    const clearAllFilters = () => {
        filters.search = ''
        filters.status = []
        filters.contentType = []
        filters.dateRange = []
    }

    const clearFilter = (filterType: keyof JobFilterCriteria) => {
        switch (filterType) {
            case 'search':
                filters.search = ''
                break
            case 'status':
                filters.status = []
                break
            case 'contentType':
                filters.contentType = []
                break
            case 'dateRange':
                filters.dateRange = []
                break
        }
    }

    const setDateRangePreset = (presetValue: string) => {
        const preset = filterOptions.dateRangePresets.find(p => p.value === presetValue)
        if (preset) {
            filters.dateRange = [...preset.range]
        }
    }

    const setCustomDateRange = (startDate: string, endDate: string) => {
        filters.dateRange = [startDate, endDate]
    }

    const addStatusFilter = (status: string) => {
        if (!filters.status) filters.status = []
        if (!filters.status.includes(status)) {
            filters.status.push(status)
        }
    }

    const removeStatusFilter = (status: string) => {
        if (filters.status) {
            filters.status = filters.status.filter(s => s !== status)
        }
    }

    const toggleStatusFilter = (status: string) => {
        if (!filters.status) filters.status = []

        if (filters.status.includes(status)) {
            removeStatusFilter(status)
        } else {
            addStatusFilter(status)
        }
    }

    const addContentTypeFilter = (contentType: string) => {
        if (!filters.contentType) filters.contentType = []
        if (!filters.contentType.includes(contentType)) {
            filters.contentType.push(contentType)
        }
    }

    const removeContentTypeFilter = (contentType: string) => {
        if (filters.contentType) {
            filters.contentType = filters.contentType.filter(ct => ct !== contentType)
        }
    }

    const toggleContentTypeFilter = (contentType: string) => {
        if (!filters.contentType) filters.contentType = []

        if (filters.contentType.includes(contentType)) {
            removeContentTypeFilter(contentType)
        } else {
            addContentTypeFilter(contentType)
        }
    }

    const setSearchFilter = (searchTerm: string) => {
        filters.search = searchTerm
    }

    const getStatusColor = (status: string): string => {
        const option = filterOptions.statusOptions.find(opt => opt.value === status)
        return option?.color || 'primary'
    }

    const getStatusLabel = (status: string): string => {
        const option = filterOptions.statusOptions.find(opt => opt.value === status)
        return option?.label || status
    }

    const getContentTypeLabel = (contentType: string): string => {
        const option = filterOptions.contentTypeOptions.find(opt => opt.value === contentType)
        return option?.label || contentType
    }

    // Validation
    const validateDateRange = (startDate: string, endDate: string): boolean => {
        if (!startDate || !endDate) return false
        return new Date(startDate) <= new Date(endDate)
    }

    const isValidFilter = computed(() => {
        // Check date range validity
        if (filters.dateRange && filters.dateRange.length === 2) {
            return validateDateRange(filters.dateRange[0], filters.dateRange[1])
        }
        return true
    })

    // Export filters as a clean object for API calls
    const getApiFilters = (): JobFilterCriteria => {
        const apiFilters: JobFilterCriteria = {}

        if (filters.search && filters.search.trim()) {
            apiFilters.search = filters.search.trim()
        }

        if (filters.status && filters.status.length > 0) {
            apiFilters.status = [...filters.status]
        }

        if (filters.contentType && filters.contentType.length > 0) {
            apiFilters.contentType = [...filters.contentType]
        }

        if (filters.dateRange && filters.dateRange.length === 2) {
            apiFilters.dateRange = [...filters.dateRange]
        }

        return apiFilters
    }

    // Save/load filters to/from localStorage
    const saveFiltersToStorage = (key = 'jobQueueFilters') => {
        try {
            localStorage.setItem(key, JSON.stringify(filters))
        } catch (error) {
            console.warn('Failed to save filters to localStorage:', error)
        }
    }

    const loadFiltersFromStorage = (key = 'jobQueueFilters') => {
        try {
            const saved = localStorage.getItem(key)
            if (saved) {
                const parsedFilters = JSON.parse(saved)
                Object.assign(filters, parsedFilters)
            }
        } catch (error) {
            console.warn('Failed to load filters from localStorage:', error)
        }
    }

    const clearStoredFilters = (key = 'jobQueueFilters') => {
        try {
            localStorage.removeItem(key)
        } catch (error) {
            console.warn('Failed to clear stored filters:', error)
        }
    }

    // Watch for filter changes to update isFiltering state
    watch(
        () => ({ ...filters }),
        () => {
            isFiltering.value = hasActiveFilters.value
        },
        { deep: true }
    )

    return {
        // State
        filters,
        showAdvancedFilters,
        isFiltering,
        filterOptions,

        // Computed
        hasActiveFilters,
        activeFilterCount,
        filterSummary,
        isValidFilter,

        // Methods
        clearAllFilters,
        clearFilter,
        setDateRangePreset,
        setCustomDateRange,
        addStatusFilter,
        removeStatusFilter,
        toggleStatusFilter,
        addContentTypeFilter,
        removeContentTypeFilter,
        toggleContentTypeFilter,
        setSearchFilter,
        getStatusColor,
        getStatusLabel,
        getContentTypeLabel,
        validateDateRange,
        getApiFilters,

        // Storage methods
        saveFiltersToStorage,
        loadFiltersFromStorage,
        clearStoredFilters
    }
}