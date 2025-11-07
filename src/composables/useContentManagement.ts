import { contentService } from '@/services/contentService'
import type { ContentGenerationDto, ContentSaveRequest } from '@/types/content'
import { computed, ref } from 'vue'

/**
 * Composable for content management operations
 * Handles CRUD operations for saved content
 */
export function useContentManagement() {
    // State for content list
    const contentList = ref<ContentGenerationDto[]>([])
    const currentContent = ref<ContentGenerationDto | null>(null)

    // Pagination state
    const pagination = ref({
        page: 0,
        size: 10,
        total: 0,
        totalPages: 0,
    })

    // Filter and search state
    const searchQuery = ref('')
    const selectedContentType = ref<string>('')
    const selectedLanguage = ref<string>('')

    // Operation states
    const loading = ref(false)
    const loadingDetail = ref(false)
    const updating = ref(false)
    const deleting = ref(false)

    // Error states
    const error = ref<string | null>(null)
    const updateError = ref<string | null>(null)
    const deleteError = ref<string | null>(null)

    // Computed properties
    const hasContent = computed(() => contentList.value?.length > 0)
    const totalPages = computed(() => pagination.value.totalPages)
    const currentPage = computed(() => pagination.value.page)

    const filteredContent = computed(() => {
        if (!contentList.value) {
            return []
        }
        let filtered = contentList.value

        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            filtered = filtered.filter(content =>
                (content.title?.toLowerCase() || '').includes(query) ||
                (content.content?.toLowerCase() || '').includes(query) ||
                (content.generatedContent?.toLowerCase() || '').includes(query)
            )
        }

        if (selectedContentType.value) {
            filtered = filtered.filter(content => content.contentType === selectedContentType.value)
        }

        if (selectedLanguage.value) {
            filtered = filtered.filter(content => content.language === selectedLanguage.value)
        }

        return filtered
    })

    /**
     * Load user's content list with pagination and filters
     */
    const loadContentList = async (page = 0, size = 10) => {
        try {
            loading.value = true
            error.value = null

            const params = {
                page,
                size,
                search: searchQuery.value || undefined,
                contentType: selectedContentType.value || undefined,
                language: selectedLanguage.value || undefined,
            }

            const response = await contentService.getContentList(params)



            if (response.errorCode === 'SUCCESS' && response.data) {
                // Backend returns content array directly in data field
                contentList.value = Array.isArray(response.data) ? response.data : []



                // Calculate pagination info from response
                const contentArray = contentList.value
                pagination.value = {
                    page: page,
                    size: size,
                    total: contentArray.length,
                    totalPages: Math.ceil(contentArray.length / size) || 1,
                }


            } else {
                error.value = response.errorMessage || 'Failed to load content'

                // Ensure contentList is always an array
                if (!contentList.value) {
                    contentList.value = []
                }
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to load content'
            // console.error('Failed to load content list:', err)
            // Ensure contentList is always an array even on error
            if (!contentList.value) {
                contentList.value = []
            }
        } finally {
            loading.value = false
        }
    }

    /**
     * Load specific content by ID
     */
    const loadContentById = async (id: number): Promise<ContentGenerationDto | null> => {
        try {
            loadingDetail.value = true
            error.value = null

            const response = await contentService.getContentById(id)

            if (response.errorCode === 'SUCCESS') {
                currentContent.value = response.data
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to load content'
            // console.error('Failed to load content:', err)
            return null
        } finally {
            loadingDetail.value = false
        }
    }

    /**
     * Update existing content
     */
    const updateContent = async (id: number, updates: Partial<ContentSaveRequest>): Promise<ContentGenerationDto | null> => {
        try {
            updating.value = true
            updateError.value = null

            const response = await contentService.updateContent(id, updates)

            if (response.errorCode === 'SUCCESS') {
                // Update in local list if present
                const index = contentList.value.findIndex(content => content.id === id)
                if (index !== -1) {
                    contentList.value[index] = response.data
                }

                // Update current content if it's the same
                if (currentContent.value?.id === id) {
                    currentContent.value = response.data
                }

                return response.data
            } else {
                updateError.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            updateError.value = err.response?.data?.errorMessage || err.message || 'Failed to update content'
            // console.error('Failed to update content:', err)
            return null
        } finally {
            updating.value = false
        }
    }

    /**
     * Delete content by ID
     */
    const deleteContent = async (id: number): Promise<boolean> => {
        try {
            deleting.value = true
            deleteError.value = null

            const response = await contentService.deleteContent(id)

            if (response.errorCode === 'SUCCESS') {
                // Remove from local list
                contentList.value = contentList.value.filter(content => content.id !== id)

                // Clear current content if it's the deleted one
                if (currentContent.value?.id === id) {
                    currentContent.value = null
                }

                // Update pagination total
                pagination.value.total = Math.max(0, pagination.value.total - 1)

                return true
            } else {
                deleteError.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            deleteError.value = err.response?.data?.errorMessage || err.message || 'Failed to delete content'
            // console.error('Failed to delete content:', err)
            return false
        } finally {
            deleting.value = false
        }
    }

    /**
     * Refresh content list
     */
    const refreshContentList = async () => {
        await loadContentList(pagination.value.page, pagination.value.size)
    }

    /**
     * Go to specific page
     */
    const goToPage = async (page: number) => {
        if (page >= 0 && page < pagination.value.totalPages) {
            await loadContentList(page, pagination.value.size)
        }
    }

    /**
     * Change page size
     */
    const changePageSize = async (size: number) => {
        await loadContentList(0, size) // Reset to first page when changing size
    }

    /**
     * Apply filters and reload
     */
    const applyFilters = async () => {
        await loadContentList(0, pagination.value.size) // Reset to first page when filtering
    }

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        searchQuery.value = ''
        selectedContentType.value = ''
        selectedLanguage.value = ''
    }

    /**
     * Clear all errors
     */
    const clearErrors = () => {
        error.value = null
        updateError.value = null
        deleteError.value = null
    }

    /**
     * Reset all state
     */
    const resetState = () => {
        contentList.value = []
        currentContent.value = null
        pagination.value = { page: 0, size: 10, total: 0, totalPages: 0 }
        clearFilters()
        clearErrors()
    }

    return {
        // State
        contentList,
        currentContent,
        pagination,

        // Filter state
        searchQuery,
        selectedContentType,
        selectedLanguage,

        // Operation states
        loading,
        loadingDetail,
        updating,
        deleting,

        // Error states
        error,
        updateError,
        deleteError,

        // Computed properties
        hasContent,
        totalPages,
        currentPage,
        filteredContent,

        // Methods
        loadContentList,
        loadContentById,
        updateContent,
        deleteContent,
        refreshContentList,
        goToPage,
        changePageSize,
        applyFilters,
        clearFilters,
        clearErrors,
        resetState,
    }
}