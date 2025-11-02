<script setup lang="ts">
import type { VUserConfigDto, SettingsTab } from '@/types/settings'

interface Props {
    settings: VUserConfigDto[]
    tabConfig: SettingsTab
    isLoading?: boolean
    isUpdating?: boolean
}

interface Emits {
    toggleSetting: [setting: VUserConfigDto]
}

withDefaults(defineProps<Props>(), {
    isLoading: false,
    isUpdating: false
})

const emit = defineEmits<Emits>()

const handleToggle = (setting: VUserConfigDto) => {
    emit('toggleSetting', setting)
}
</script>

<template>
    <div class="settings-tab-content">
        <!-- Tab Description -->
        <div class="mb-6">
            <h2 class="text-h6 font-weight-semibold mb-2">
                {{ tabConfig.title }} Settings
            </h2>
            <p class="text-body-2 text-medium-emphasis">
                {{ tabConfig.description }}
            </p>
        </div>

        <!-- Settings Grid -->
        <v-row>
            <v-col v-for="setting in settings" :key="setting.id" cols="12" md="6" lg="4">
                <v-card variant="outlined" class="setting-card"
                    :class="{ 'setting-card--selected': setting.isSelected }">
                    <v-card-text class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                            <h3 class="text-subtitle-1 font-weight-medium">
                                {{ setting.displayLabel }}
                            </h3>
                            <v-switch :model-value="setting.isSelected" :disabled="isUpdating" color="primary"
                                hide-details @update:model-value="handleToggle(setting)" />
                        </div>

                        <p v-if="setting.description" class="text-body-2 text-medium-emphasis mb-3">
                            {{ setting.description }}
                        </p>

                        <div class="d-flex align-center justify-space-between">
                            <v-chip size="small" variant="tonal" :color="setting.isSelected ? 'success' : 'default'">
                                {{ setting.isSelected ? 'Active' : 'Inactive' }}
                            </v-chip>

                            <div class="text-caption text-medium-emphasis">
                                {{ setting.language.toUpperCase() }}
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Empty State -->
        <div v-if="settings.length === 0 && !isLoading" class="text-center py-12">
            <v-icon :icon="tabConfig.icon" size="64" class="text-disabled mb-4" />
            <h3 class="text-h6 text-disabled mb-2">
                No {{ tabConfig.title }} Settings
            </h3>
            <p class="text-body-2 text-medium-emphasis">
                No {{ tabConfig.title.toLowerCase() }} settings are currently available.
            </p>
        </div>
    </div>
</template>

<style scoped>
.setting-card {
    transition: all 0.2s ease;
    border-radius: 8px;
    height: 100%;
}

.setting-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.setting-card--selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.setting-card--selected:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>