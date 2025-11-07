import { ref, computed, type Ref } from 'vue'
import { templateService, type ContentTemplate, type TemplateSearchParams, type TemplateRatingRequest } from '@/services/templateService'
import { useErrorHandler } from '@/composables/useErrorHandler'

export function useTemplateManagement() {
    const { handleApiError } = useErrorHandler()

    const templates: Ref<ContentTemplate[]> = ref([])
    const selectedTemplate: Ref<ContentTemplate | null> = ref(null)
    const recommendedTemplates: Ref<ContentTemplate[]> = ref([])
    const popularTemplates: Ref<ContentTemplate[]> = ref([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Search and filter state
    const searchQuery = ref('')
    const selectedCategory = ref<string | null>(null)
    const selectedIndustry = ref<string | null>(null)
    const selectedContentType = ref<string | null>(null)
    const selectedTags = ref<string[]>([])
    const minRating = ref<number>(0)

    /**
     * Load all templates
     */
    const loadTemplates = async () => {
        try {
            loading.value = true
            error.value = null

            const response = await templateService.getTemplates()

            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to load templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Load recommended templates
     */
    const loadRecommendedTemplates = async () => {
        try {
            loading.value = true
            error.value = null

            const response = await templateService.getRecommendedTemplates()

            if (response.errorCode === 'SUCCESS') {
                recommendedTemplates.value = response.data
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to load recommended templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Load popular templates
     */
    const loadPopularTemplates = async (limit: number = 10) => {
        try {
            loading.value = true
            error.value = null

            const response = await templateService.getPopularTemplates(limit)

            if (response.errorCode === 'SUCCESS') {
                popularTemplates.value = response.data
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to load popular templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Search templates with filters
     */
    const searchTemplates = async () => {
        try {
            loading.value = true
            error.value = null

            const params: TemplateSearchParams = {
                query: searchQuery.value || undefined,
                category: selectedCategory.value || undefined,
                industry: selectedIndustry.value || undefined,
                contentType: selectedContentType.value || undefined,
                tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
                minRating: minRating.value > 0 ? minRating.value : undefined,
            }

            const response = await templateService.searchTemplates(params)

            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to search templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Get template by ID
     */
    const getTemplateById = async (id: number) => {
        try {
            loading.value = true
            error.value = null

            const response = await templateService.getTemplateById(id)

            if (response.errorCode === 'SUCCESS') {
                selectedTemplate.value = response.data
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to load template'
            handleApiError(err)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Apply template
     */
    const applyTemplate = async (templateId: number, customParams?: Record<string, any>) => {
        try {
            loading.value = true
            error.value = null

            const response = await templateService.applyTemplate(templateId, { customParams })

            if (response.errorCode === 'SUCCESS') {
                // Record usage
                await templateService.recordTemplateUsage(templateId)
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to apply template'
            handleApiError(err)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Rate template
     */
    const rateTemplate = async (templateId: number, rating: number, feedback?: string) => {
        try {
            loading.value = true
            error.value = null

            const request: TemplateRatingRequest = { rating, feedback }
            const response = await templateService.rateTemplate(templateId, request)

            if (response.errorCode === 'SUCCESS') {
                // Reload template to get updated rating
                await getTemplateById(templateId)
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || 'Failed to rate template'
            handleApiError(err)
            return false
        } finally {
            loading.value = false
        }
    }

    /**
     * Clear filters
     */
    const clearFilters = () => {
        searchQuery.value = ''
        selectedCategory.value = null
        selectedIndustry.value = null
        selectedContentType.value = null
        selectedTags.value = []
        minRating.value = 0
    }

    /**
     * Filtered templates (computed)
     */
    const filteredTemplates = computed(() => {
        let result = templates.value

        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            result = result.filter(
                t =>
                    t.name.toLowerCase().includes(query) ||
                    t.description?.toLowerCase().includes(query) ||
                    t.tags.some(tag => tag.toLowerCase().includes(query))
            )
        }

        if (selectedCategory.value) {
            result = result.filter(t => t.category === selectedCategory.value)
        }

        if (selectedIndustry.value) {
            result = result.filter(t => t.industry === selectedIndustry.value)
        }

        if (selectedContentType.value) {
            result = result.filter(t => t.contentType === selectedContentType.value)
        }

        if (selectedTags.value.length > 0) {
            result = result.filter(t => selectedTags.value.some(tag => t.tags.includes(tag)))
        }

        if (minRating.value > 0) {
            result = result.filter(t => t.averageRating >= minRating.value)
        }

        return result
    })

    /**
     * Get unique categories
     */
    const categories = computed(() => {
        const cats = new Set(templates.value.map(t => t.category))
        return Array.from(cats).sort()
    })

    /**
     * Get unique industries
     */
    const industries = computed(() => {
        const inds = new Set(templates.value.filter(t => t.industry).map(t => t.industry!))
        return Array.from(inds).sort()
    })

    /**
     * Get unique content types
     */
    const contentTypes = computed(() => {
        const types = new Set(templates.value.map(t => t.contentType))
        return Array.from(types).sort()
    })

    /**
     * Get all unique tags
     */
    const allTags = computed(() => {
        const tags = new Set(templates.value.flatMap(t => t.tags))
        return Array.from(tags).sort()
    })

    return {
        // State
        templates,
        selectedTemplate,
        recommendedTemplates,
        popularTemplates,
        loading,
        error,

        // Search and filter state
        searchQuery,
        selectedCategory,
        selectedIndustry,
        selectedContentType,
        selectedTags,
        minRating,

        // Computed
        filteredTemplates,
        categories,
        industries,
        contentTypes,
        allTags,

        // Methods
        loadTemplates,
        loadRecommendedTemplates,
        loadPopularTemplates,
        searchTemplates,
        getTemplateById,
        applyTemplate,
        rateTemplate,
        clearFilters,
    }
}
