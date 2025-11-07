import { ref, computed } from 'vue'
import { videoTemplateService, type VideoTemplate, type CreateVideoTemplateRequest } from '@/services/videoTemplateService'
import { useErrorHandler } from '@/composables/useErrorHandler'

export function useVideoTemplates() {
    // State
    const templates = ref<VideoTemplate[]>([])
    const selectedTemplate = ref<VideoTemplate | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Error handler
    const { handleApiError } = useErrorHandler()

    // Computed
    const hasTemplates = computed(() => templates.value.length > 0)

    const templatesByCategory = computed(() => {
        const grouped: Record<string, VideoTemplate[]> = {}
        templates.value.forEach(template => {
            const category = template.category || 'Other'
            if (!grouped[category]) {
                grouped[category] = []
            }
            grouped[category].push(template)
        })
        return grouped
    })

    // Methods
    const loadPublicTemplates = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getPublicTemplates()
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const loadPopularTemplates = async (limit = 10) => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getPopularTemplates(limit)
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load popular templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const loadRecommendedTemplates = async (limit = 10) => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getRecommendedTemplates(limit)
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load recommended templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const loadUserTemplates = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getUserTemplates()
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load user templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const loadTemplatesByCategory = async (category: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getTemplatesByCategory(category)
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load templates by category'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const searchTemplates = async (query: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.searchTemplates(query)
            if (response.errorCode === 'SUCCESS') {
                templates.value = response.data || []
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to search templates'
            handleApiError(err)
        } finally {
            loading.value = false
        }
    }

    const getTemplateById = async (id: number): Promise<VideoTemplate | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.getTemplateById(id)
            if (response.errorCode === 'SUCCESS') {
                selectedTemplate.value = response.data
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load template'
            handleApiError(err)
            return null
        } finally {
            loading.value = false
        }
    }

    const createTemplate = async (request: CreateVideoTemplateRequest): Promise<VideoTemplate | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.createTemplate(request)
            if (response.errorCode === 'SUCCESS') {
                // Add to templates list
                templates.value.unshift(response.data)
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to create template'
            handleApiError(err)
            return null
        } finally {
            loading.value = false
        }
    }

    const updateTemplate = async (id: number, request: CreateVideoTemplateRequest): Promise<VideoTemplate | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.updateTemplate(id, request)
            if (response.errorCode === 'SUCCESS') {
                // Update in templates list
                const index = templates.value.findIndex(t => t.id === id)
                if (index !== -1) {
                    templates.value[index] = response.data
                }
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to update template'
            handleApiError(err)
            return null
        } finally {
            loading.value = false
        }
    }

    const deleteTemplate = async (id: number): Promise<boolean> => {
        loading.value = true
        error.value = null

        try {
            const response = await videoTemplateService.deleteTemplate(id)
            if (response.errorCode === 'SUCCESS') {
                // Remove from templates list
                templates.value = templates.value.filter(t => t.id !== id)
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to delete template'
            handleApiError(err)
            return false
        } finally {
            loading.value = false
        }
    }

    const selectTemplate = (template: VideoTemplate | null) => {
        selectedTemplate.value = template
    }

    const clearError = () => {
        error.value = null
    }

    return {
        // State
        templates,
        selectedTemplate,
        loading,
        error,

        // Computed
        hasTemplates,
        templatesByCategory,

        // Methods
        loadPublicTemplates,
        loadPopularTemplates,
        loadRecommendedTemplates,
        loadUserTemplates,
        loadTemplatesByCategory,
        searchTemplates,
        getTemplateById,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        selectTemplate,
        clearError
    }
}
