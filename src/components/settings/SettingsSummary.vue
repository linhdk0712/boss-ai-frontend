<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { SettingsCategory } from '@/types/settings'

const settingsStore = useSettingsStore()
const { getSelectedSummary, fetchAllSettings } = settingsStore

// Load data if not already loaded
onMounted(async () => {
    // Check if we have any data, if not, try to load it
    const summary = getSelectedSummary.value
    if (!summary || Object.values(summary).every(count => (count as number) === 0)) {
        try {
            await fetchAllSettings()
        } catch (error) {
            console.error('Failed to load settings summary:', error)
        }
    }
})

// Get total selected settings across all categories
const totalSelected = computed(() => {
    const summary = getSelectedSummary.value
    if (!summary) return 0

    return Object.values(summary).reduce((total, count) => (total as number) + (count as number), 0)
})

// Get category with most selections
const topCategory = computed(() => {
    const summary = getSelectedSummary.value
    if (!summary) return { category: '', count: 0 }

    let maxCount = 0
    let topCat = ''

    Object.entries(summary).forEach(([category, count]) => {
        const numCount = count as number
        if (numCount > maxCount) {
            maxCount = numCount
            topCat = category
        }
    })

    return { category: topCat, count: maxCount }
})

const getCategoryIcon = (category: string) => {
    switch (category) {
        case SettingsCategory.TONE: return 'tabler-mood-happy'
        case SettingsCategory.INDUSTRY: return 'tabler-building'
        case SettingsCategory.LANGUAGE: return 'tabler-language'
        case SettingsCategory.TARGET_AUDIENCE: return 'tabler-users'
        case SettingsCategory.CONTENT_TYPE: return 'tabler-file-text'
        default: return 'tabler-settings'
    }
}

const getCategoryLabel = (category: string) => {
    switch (category) {
        case SettingsCategory.TONE: return 'Tone'
        case SettingsCategory.INDUSTRY: return 'Industry'
        case SettingsCategory.LANGUAGE: return 'Language'
        case SettingsCategory.TARGET_AUDIENCE: return 'Target Audience'
        case SettingsCategory.CONTENT_TYPE: return 'Content Type'
        default: return category
    }
}
</script>

<template>
    <v-card variant="outlined" class="settings-summary">
        <v-card-title class="d-flex align-center">
            <v-icon icon="tabler-chart-pie" class="me-2" />
            Settings Summary
        </v-card-title>

        <v-card-text>
            <!-- Loading State -->
            <div v-if="!getSelectedSummary" class="text-center py-4">
                <v-progress-circular indeterminate size="24" />
                <div class="text-caption text-medium-emphasis mt-2">
                    Loading settings...
                </div>
            </div>

            <!-- Content -->
            <div v-else>
                <div class="d-flex align-center justify-space-between mb-4">
                    <div class="text-center">
                        <div class="text-h4 font-weight-bold text-primary">
                            {{ totalSelected }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            Total Active
                        </div>
                    </div>

                    <v-divider vertical />

                    <div class="text-center" v-if="topCategory.count > 0">
                        <div class="d-flex align-center justify-center mb-1">
                            <v-icon :icon="getCategoryIcon(topCategory.category)" size="20" class="me-1 text-success" />
                            <span class="text-body-2 font-weight-medium">
                                {{ getCategoryLabel(topCategory.category) }}
                            </span>
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ topCategory.count }} active
                        </div>
                    </div>

                    <div class="text-center" v-else>
                        <div class="text-body-2 text-medium-emphasis">
                            No settings active
                        </div>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div class="category-breakdown">
                    <div v-for="[category, count] in Object.entries(getSelectedSummary)" :key="category"
                        class="d-flex align-center justify-space-between py-1">
                        <div class="d-flex align-center">
                            <v-icon :icon="getCategoryIcon(category)" size="16" class="me-2 text-medium-emphasis" />
                            <span class="text-body-2">
                                {{ getCategoryLabel(category) }}
                            </span>
                        </div>

                        <v-chip size="x-small" :color="(count as number) > 0 ? 'success' : 'default'" variant="tonal">
                            {{ count }}
                        </v-chip>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.settings-summary {
    border-radius: 8px;
}

.category-breakdown {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-top: 16px;
}
</style>