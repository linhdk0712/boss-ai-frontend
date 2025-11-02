<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { SettingsCategory } from '@/types/settings'
import type { SettingsTab } from '@/types/settings'
import SettingsTabContent from '@/components/settings/SettingsTabContent.vue'
import SettingsSummary from '@/components/settings/SettingsSummary.vue'

// Define page metadata
definePage({
    name: 'settings',
    meta: {
        title: 'Settings',
        requiresAuth: true,
        action: 'read',
        subject: 'Settings'
    }
})

// Settings store
const settingsStore = useSettingsStore()
const {
    getSettingsForCategory,
    isLoadingCategory,
    isUpdating,
    hasError,
    errorMessage,
    fetchSettings,
    toggleSetting,
    clearError
} = settingsStore

// State
const activeTab = ref<SettingsCategory>(SettingsCategory.TONE)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Settings tabs configuration
const settingsTabs: SettingsTab[] = [
    {
        key: SettingsCategory.TONE,
        title: 'Tone',
        icon: 'tabler-mood-happy',
        description: 'Configure your preferred writing tones'
    },
    {
        key: SettingsCategory.INDUSTRY,
        title: 'Industry',
        icon: 'tabler-building',
        description: 'Select your industry preferences'
    },
    {
        key: SettingsCategory.LANGUAGE,
        title: 'Language',
        icon: 'tabler-language',
        description: 'Choose your language settings'
    },
    {
        key: SettingsCategory.TARGET_AUDIENCE,
        title: 'Target Audience',
        icon: 'tabler-users',
        description: 'Define your target audience preferences'
    },
    {
        key: SettingsCategory.CONTENT_TYPE,
        title: 'Content Type',
        icon: 'tabler-file-text',
        description: 'Select your preferred content types'
    }
]

// Methods
const handleTabChange = async (tabKey: SettingsCategory) => {
    activeTab.value = tabKey
    clearError()
    await loadTabData(tabKey)
}

const loadTabData = async (category: SettingsCategory) => {
    try {
        await fetchSettings(category)
    } catch (error) {
        console.error('Error loading tab data:', error)
    }
}

const handleToggleSetting = async (setting: any) => {
    try {
        const success = await toggleSetting(setting)

        if (success) {
            snackbarMessage.value = `${setting.displayLabel} ${setting.isSelected ? 'disabled' : 'enabled'} successfully`
            snackbarColor.value = 'success'
        } else {
            snackbarMessage.value = errorMessage.value || 'Failed to update setting'
            snackbarColor.value = 'error'
        }

        snackbar.value = true
    } catch (error) {
        console.error('Error toggling setting:', error)
        snackbarMessage.value = 'An error occurred while updating the setting'
        snackbarColor.value = 'error'
        snackbar.value = true
    }
}

const getActiveTabConfig = () => {
    return settingsTabs.find(tab => tab.key === activeTab.value)
}

// Lifecycle
onMounted(async () => {
    await loadTabData(activeTab.value)
})
</script>

<template>
    <div class="settings-page">
        <!-- Page Header -->
        <div class="d-flex align-center justify-space-between mb-6">
            <div>
                <h1 class="text-h4 font-weight-bold mb-1">
                    Settings
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                    Manage your content generation preferences
                </p>
            </div>

            <!-- Settings Summary Card -->
            <div class="settings-summary-container">
                <SettingsSummary />
            </div>
        </div>

        <!-- Settings Card -->
        <v-card class="settings-card">
            <!-- Tabs -->
            <v-tabs v-model="activeTab" color="primary" class="settings-tabs" @update:model-value="handleTabChange">
                <v-tab v-for="tab in settingsTabs" :key="tab.key" :value="tab.key" class="settings-tab">
                    <v-icon :icon="tab.icon" size="20" class="me-2" />
                    {{ tab.title }}
                </v-tab>
            </v-tabs>

            <v-divider />

            <!-- Tab Content -->
            <v-card-text class="pa-6">
                <!-- Loading State -->
                <div v-if="isLoadingCategory(activeTab).value" class="d-flex justify-center align-center py-8">
                    <v-progress-circular indeterminate color="primary" size="48" />
                </div>

                <!-- Error State -->
                <v-alert v-else-if="hasError" type="error" variant="tonal" class="mb-4" closable
                    @click:close="clearError">
                    {{ errorMessage }}
                </v-alert>

                <!-- Settings Content -->
                <SettingsTabContent v-else :settings="getSettingsForCategory(activeTab).value"
                    :tab-config="getActiveTabConfig()!" :is-loading="isLoadingCategory(activeTab).value"
                    :is-updating="isUpdating" @toggle-setting="handleToggleSetting" />
            </v-card-text>
        </v-card>

        <!-- Success/Error Snackbar -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" location="top right">
            {{ snackbarMessage }}

            <template #actions>
                <v-btn variant="text" @click="snackbar = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<style scoped>
.settings-page {
    max-width: 1200px;
    margin: 0 auto;
}

.settings-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-tabs {
    padding: 0 24px;
}

.settings-tab {
    text-transform: none;
    font-weight: 500;
}

.settings-list {
    min-height: 400px;
}

.setting-item {
    transition: all 0.2s ease;
    border-radius: 8px;
}

.setting-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.setting-item--selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.setting-item--selected:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}

.settings-summary-container {
    min-width: 280px;
}
</style>