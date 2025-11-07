import { ref, computed, readonly } from 'vue'
import { settingsService } from '@/services/settingsService'
import type { VUserConfigDto } from '@/types/settings'
import { SettingsCategory } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
    // State
    const settings = ref<Record<SettingsCategory, VUserConfigDto[]>>({
        [SettingsCategory.TONE]: [],
        [SettingsCategory.INDUSTRY]: [],
        [SettingsCategory.LANGUAGE]: [],
        [SettingsCategory.TARGET_AUDIENCE]: [],
        [SettingsCategory.CONTENT_TYPE]: [],
    })

    const loading = ref<Record<SettingsCategory, boolean>>({
        [SettingsCategory.TONE]: false,
        [SettingsCategory.INDUSTRY]: false,
        [SettingsCategory.LANGUAGE]: false,
        [SettingsCategory.TARGET_AUDIENCE]: false,
        [SettingsCategory.CONTENT_TYPE]: false,
    })

    const updating = ref(false)
    const error = ref<string | null>(null)
    const lastUpdated = ref<Record<SettingsCategory, Date | null>>({
        [SettingsCategory.TONE]: null,
        [SettingsCategory.INDUSTRY]: null,
        [SettingsCategory.LANGUAGE]: null,
        [SettingsCategory.TARGET_AUDIENCE]: null,
        [SettingsCategory.CONTENT_TYPE]: null,
    })

    // Getters
    const getSettingsForCategory = (category: SettingsCategory) => {
        return computed(() => settings.value[category] || [])
    }

    const getSelectedSettings = (category: SettingsCategory) => {
        return computed(() =>
            settings.value[category]?.filter(item => item.isSelected) || []
        )
    }

    const isLoadingCategory = (category: SettingsCategory) => {
        return computed(() => loading.value[category])
    }

    const isUpdating = computed(() => updating.value)
    const hasError = computed(() => !!error.value)
    const errorMessage = computed(() => error.value)

    // Check if data is stale (older than 5 minutes)
    const isDataStale = (category: SettingsCategory) => {
        const lastUpdate = lastUpdated.value[category]
        if (!lastUpdate) return true

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        return lastUpdate < fiveMinutesAgo
    }

    // Actions
    const fetchSettings = async (category: SettingsCategory, force = false) => {
        // Skip if already loading or data is fresh (unless forced)
        if (loading.value[category] || (!force && !isDataStale(category))) {
            return
        }

        try {
            loading.value[category] = true
            error.value = null

            const response = await settingsService.getSettingsByCategory(category)

            if (response.errorCode === 'SUCCESS') {
                settings.value[category] = response.data || []
                lastUpdated.value[category] = new Date()
            } else {
                error.value = response.errorMessage || 'Failed to fetch settings'
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to fetch settings'
        } finally {
            loading.value[category] = false
        }
    }

    const fetchAllSettings = async (force = false) => {
        const categories = Object.values(SettingsCategory)

        try {
            error.value = null

            // Set all categories to loading
            categories.forEach(category => {
                if (force || isDataStale(category)) {
                    loading.value[category] = true
                }
            })

            const allSettings = await settingsService.getAllSettings()

            settings.value = {
                [SettingsCategory.TONE]: allSettings.tone,
                [SettingsCategory.INDUSTRY]: allSettings.industry,
                [SettingsCategory.LANGUAGE]: allSettings.language,
                [SettingsCategory.TARGET_AUDIENCE]: allSettings.targetAudience,
                [SettingsCategory.CONTENT_TYPE]: allSettings.contentType,
            }

            // Update timestamps
            const now = new Date()
            categories.forEach(category => {
                lastUpdated.value[category] = now
            })

        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to fetch all settings'
        } finally {
            // Clear all loading states
            categories.forEach(category => {
                loading.value[category] = false
            })
        }
    }

    const updateSetting = async (settingId: number, category: SettingsCategory, isSelected: boolean) => {
        try {
            updating.value = true
            error.value = null

            const request = {
                id: settingId,
                category,
                isSelected
            }

            const response = await settingsService.updateSetting(request)

            if (response.errorCode === 'SUCCESS') {
                // Update local state with response data
                settings.value[category] = response.data || []
                lastUpdated.value[category] = new Date()
                return true
            } else {
                error.value = response.errorMessage || 'Failed to update setting'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to update setting'
            return false
        } finally {
            updating.value = false
        }
    }

    const toggleSetting = async (setting: VUserConfigDto) => {
        const newSelectedState = !setting.isSelected
        return await updateSetting(setting.id, setting.category as SettingsCategory, newSelectedState)
    }

    const clearError = () => {
        error.value = null
    }

    const clearCache = (category?: SettingsCategory) => {
        if (category) {
            settings.value[category] = []
            lastUpdated.value[category] = null
        } else {
            // Clear all cache
            Object.values(SettingsCategory).forEach(cat => {
                settings.value[cat] = []
                lastUpdated.value[cat] = null
            })
        }
    }

    // Get summary of selected settings across all categories
    const getSelectedSummary = computed(() => {
        const summary: Record<SettingsCategory, number> = {
            [SettingsCategory.TONE]: 0,
            [SettingsCategory.INDUSTRY]: 0,
            [SettingsCategory.LANGUAGE]: 0,
            [SettingsCategory.TARGET_AUDIENCE]: 0,
            [SettingsCategory.CONTENT_TYPE]: 0,
        }

        Object.entries(settings.value).forEach(([category, settingsList]) => {
            summary[category as SettingsCategory] = settingsList.filter(s => s.isSelected).length
        })

        return summary
    })

    return {
        // State
        settings: readonly(settings),
        loading: readonly(loading),
        isUpdating,
        hasError,
        errorMessage,
        lastUpdated: readonly(lastUpdated),

        // Getters
        getSettingsForCategory,
        getSelectedSettings,
        isLoadingCategory,
        getSelectedSummary,

        // Actions
        fetchSettings,
        fetchAllSettings,
        updateSetting,
        toggleSetting,
        clearError,
        clearCache,
        isDataStale,
    }
})