import { ref, computed } from 'vue'
import { configService } from '@/services/configService'
import type { ConfigOption } from '@/types/content'

/**
 * Composable for managing content configuration data
 * Handles loading and caching of dropdown options
 */
export function useContentConfig() {
    // Reactive state for configuration options
    const industryOptions = ref<ConfigOption[]>([])
    const contentTypeOptions = ref<ConfigOption[]>([])
    const languageOptions = ref<ConfigOption[]>([])
    const toneOptions = ref<ConfigOption[]>([])
    const targetAudienceOptions = ref<ConfigOption[]>([])

    // Loading and error states
    const loading = ref(false)
    const error = ref<string | null>(null)
    const initialized = ref(false)

    // Computed properties for filtered and sorted options
    const activeIndustryOptions = computed(() =>
        industryOptions.value
            .filter(option => option.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
    )

    const activeContentTypeOptions = computed(() =>
        contentTypeOptions.value
            .filter(option => option.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
    )

    const activeLanguageOptions = computed(() =>
        languageOptions.value
            .filter(option => option.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
    )

    const activeToneOptions = computed(() =>
        toneOptions.value
            .filter(option => option.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
    )

    const activeTargetAudienceOptions = computed(() =>
        targetAudienceOptions.value
            .filter(option => option.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
    )

    // Check if all configurations are loaded
    const isConfigLoaded = computed(() =>
        industryOptions.value.length > 0 &&
        contentTypeOptions.value.length > 0 &&
        languageOptions.value.length > 0 &&
        toneOptions.value.length > 0 &&
        targetAudienceOptions.value.length > 0
    )

    /**
     * Load all configuration data in parallel
     */
    const loadAllConfigs = async () => {
        if (loading.value || initialized.value) return

        try {
            loading.value = true
            error.value = null

            const configs = await configService.getAllConfigs()

            industryOptions.value = configs.industry
            contentTypeOptions.value = configs.contentType
            languageOptions.value = configs.language
            toneOptions.value = configs.tone
            targetAudienceOptions.value = configs.targetAudience

            initialized.value = true
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Failed to load configuration'
            console.error('Failed to load configuration:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Refresh configuration data
     */
    const refreshConfigs = async () => {
        initialized.value = false
        await loadAllConfigs()
    }

    /**
     * Get default language option (Vietnamese)
     */
    const getDefaultLanguage = () => {
        return activeLanguageOptions.value.find(option => option.value === 'vi') ||
            activeLanguageOptions.value[0]
    }

    /**
     * Find option by value in a specific category
     */
    const findOptionByValue = (category: 'industry' | 'contentType' | 'language' | 'tone' | 'targetAudience', value: string) => {
        const optionsMap = {
            industry: activeIndustryOptions.value,
            contentType: activeContentTypeOptions.value,
            language: activeLanguageOptions.value,
            tone: activeToneOptions.value,
            targetAudience: activeTargetAudienceOptions.value,
        }

        return optionsMap[category].find(option => option.value === value)
    }

    /**
     * Get display label for a value
     */
    const getDisplayLabel = (category: 'industry' | 'contentType' | 'language' | 'tone' | 'targetAudience', value: string) => {
        const option = findOptionByValue(category, value)
        return option?.displayLabel || value
    }

    return {
        // Raw options
        industryOptions,
        contentTypeOptions,
        languageOptions,
        toneOptions,
        targetAudienceOptions,

        // Filtered and sorted options
        activeIndustryOptions,
        activeContentTypeOptions,
        activeLanguageOptions,
        activeToneOptions,
        activeTargetAudienceOptions,

        // State
        loading,
        error,
        initialized,
        isConfigLoaded,

        // Methods
        loadAllConfigs,
        refreshConfigs,
        getDefaultLanguage,
        findOptionByValue,
        getDisplayLabel,
    }
}