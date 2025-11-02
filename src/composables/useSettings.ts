import { ref, computed } from 'vue'
import { settingsService } from '@/services/settingsService'
import type { VUserConfigDto, SettingsUpdateRequest } from '@/types/settings'
import { SettingsCategory } from '@/types/settings'

/**
 * Settings Composable
 * Manages settings state and operations
 */
export function useSettings() {
    // State
    const settings = ref<Record<SettingsCategory, VUserConfigDto[]>>({
        [SettingsCategory.TONE]: [],
        [SettingsCategory.INDUSTRY]: [],
        [SettingsCategory.LANGUAGE]: [],
        [SettingsCategory.TARGET_AUDIENCE]: [],
        [SettingsCategory.CONTENT_TYPE]: [],
    })

    const loading = ref(false)
    const error = ref<string | null>(null)
    const updating = ref(false)

    // Getters
    const isLoading = computed(() => loading.value)
    const isUpdating = computed(() => updating.value)
    const hasError = computed(() => !!error.value)
    const errorMessage = computed(() => error.value)

    // Get settings for specific category
    const getSettingsForCategory = (category: SettingsCategory) => {
        return computed(() => settings.value[category] || [])
    }

    // Get selected settings for category
    const getSelectedSettings = (category: SettingsCategory) => {
        return computed(() =>
            settings.value[category]?.filter(item => item.isSelected) || []
        )
    }

    // Actions
    const fetchSettings = async (category: SettingsCategory) => {
        try {
            loading.value = true
            error.value = null

            const response = await settingsService.getSettingsByCategory(category)

            if (response.errorCode === 'SUCCESS') {
                settings.value[category] = response.data || []
            } else {
                error.value = response.errorMessage || 'Failed to fetch settings'
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to fetch settings'
            console.error('Error fetching settings:', err)
        } finally {
            loading.value = false
        }
    }

    const fetchAllSettings = async () => {
        try {
            loading.value = true
            error.value = null

            const allSettings = await settingsService.getAllSettings()

            settings.value = {
                [SettingsCategory.TONE]: allSettings.tone,
                [SettingsCategory.INDUSTRY]: allSettings.industry,
                [SettingsCategory.LANGUAGE]: allSettings.language,
                [SettingsCategory.TARGET_AUDIENCE]: allSettings.targetAudience,
                [SettingsCategory.CONTENT_TYPE]: allSettings.contentType,
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to fetch all settings'
            console.error('Error fetching all settings:', err)
        } finally {
            loading.value = false
        }
    }

    const updateSetting = async (settingId: number, category: SettingsCategory, isSelected: boolean) => {
        try {
            updating.value = true
            error.value = null

            const request: SettingsUpdateRequest = {
                id: settingId,
                category,
                isSelected
            }

            const response = await settingsService.updateSetting(request)

            if (response.errorCode === 'SUCCESS') {
                // Update local state with response data
                settings.value[category] = response.data || []
                return true
            } else {
                error.value = response.errorMessage || 'Failed to update setting'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to update setting'
            console.error('Error updating setting:', err)
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

    return {
        // State
        settings: readonly(settings),
        isLoading,
        isUpdating,
        hasError,
        errorMessage,

        // Getters
        getSettingsForCategory,
        getSelectedSettings,

        // Actions
        fetchSettings,
        fetchAllSettings,
        updateSetting,
        toggleSetting,
        clearError,
    }
}