import { ref, computed, type Ref } from 'vue'
import { presetService } from '@/services/presetService'
import type {
    UserPreset,
    CreatePresetRequest,
    UpdatePresetRequest,
    PresetSearchFilters
} from '@/types/preset'

export function usePresetManagement() {
    const presets: Ref<UserPreset[]> = ref([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const searchQuery = ref('')
    const selectedContentType = ref<string | undefined>()
    const sortBy = ref<'name' | 'usageCount' | 'lastUsedAt' | 'createdAt'>('lastUsedAt')
    const sortOrder = ref<'asc' | 'desc'>('desc')

    // Computed properties
    const defaultPreset = computed(() =>
        presets.value.find(p => p.isDefault)
    )

    const filteredPresets = computed(() => {
        let filtered = [...presets.value]

        // Apply search filter
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            )
        }

        // Apply content type filter
        if (selectedContentType.value) {
            filtered = filtered.filter(p =>
                p.configuration.contentType === selectedContentType.value
            )
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sortBy.value) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'usageCount':
                    aValue = a.usageCount
                    bValue = b.usageCount
                    break
                case 'lastUsedAt':
                    aValue = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0
                    bValue = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0
                    break
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
                    break
                default:
                    return 0
            }

            if (sortOrder.value === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

        return filtered
    })

    const contentTypes = computed(() => {
        const types = new Set(presets.value.map(p => p.configuration.contentType))
        return Array.from(types).sort()
    })

    // Methods
    const loadPresets = async (filters?: PresetSearchFilters) => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.getUserPresets(filters)

            if (response.errorCode === 'SUCCESS') {
                presets.value = response.data
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to load presets'
        } finally {
            loading.value = false
        }
    }

    const createPreset = async (request: CreatePresetRequest): Promise<UserPreset | null> => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.createPreset(request)

            if (response.errorCode === 'SUCCESS') {
                presets.value.push(response.data)
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to create preset'
            return null
        } finally {
            loading.value = false
        }
    }

    const updatePreset = async (id: number, request: UpdatePresetRequest): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.updatePreset(id, request)

            if (response.errorCode === 'SUCCESS') {
                const index = presets.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    presets.value[index] = response.data
                }
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to update preset'
            return false
        } finally {
            loading.value = false
        }
    }

    const deletePreset = async (id: number): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.deletePreset(id)

            if (response.errorCode === 'SUCCESS') {
                presets.value = presets.value.filter(p => p.id !== id)
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to delete preset'
            return false
        } finally {
            loading.value = false
        }
    }

    const setDefaultPreset = async (id: number): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.setDefaultPreset(id)

            if (response.errorCode === 'SUCCESS') {
                // Update all presets to reflect new default
                presets.value = presets.value.map(p => ({
                    ...p,
                    isDefault: p.id === id
                }))
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to set default preset'
            return false
        } finally {
            loading.value = false
        }
    }

    const applyPreset = async (preset: UserPreset): Promise<UserPreset | null> => {
        try {
            const response = await presetService.applyPreset(preset.id)

            if (response.errorCode === 'SUCCESS') {
                // Update usage count and last used timestamp
                const index = presets.value.findIndex(p => p.id === preset.id)
                if (index !== -1) {
                    presets.value[index] = response.data
                }
                return response.data
            } else {
                error.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to apply preset'
            return null
        }
    }

    const sharePreset = async (id: number, workspaceId: number): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const response = await presetService.sharePreset(id, workspaceId)

            if (response.errorCode === 'SUCCESS') {
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to share preset'
            return false
        } finally {
            loading.value = false
        }
    }

    const exportPreset = async (id: number): Promise<void> => {
        try {
            const response = await presetService.exportPreset(id)

            if (response.errorCode === 'SUCCESS') {
                const preset = response.data
                const dataStr = JSON.stringify(preset, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}.json`
                link.click()
                URL.revokeObjectURL(url)
            } else {
                error.value = response.errorMessage
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to export preset'
        }
    }

    const importPreset = async (file: File): Promise<boolean> => {
        try {
            loading.value = true
            error.value = null

            const text = await file.text()
            const presetData = JSON.parse(text)

            // Create preset from imported data
            const request: CreatePresetRequest = {
                name: presetData.name,
                description: presetData.description,
                configuration: presetData.configuration,
                isDefault: false
            }

            const response = await presetService.importPreset(request)

            if (response.errorCode === 'SUCCESS') {
                presets.value.push(response.data)
                return true
            } else {
                error.value = response.errorMessage
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to import preset'
            return false
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        presets,
        loading,
        error,
        searchQuery,
        selectedContentType,
        sortBy,
        sortOrder,

        // Computed
        defaultPreset,
        filteredPresets,
        contentTypes,

        // Methods
        loadPresets,
        createPreset,
        updatePreset,
        deletePreset,
        setDefaultPreset,
        applyPreset,
        sharePreset,
        exportPreset,
        importPreset
    }
}
