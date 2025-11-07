<template>
    <v-menu offset-y>
        <template #activator="{ props }">
            <v-btn v-bind="props" :variant="variant" :color="color" :size="size" :prepend-icon="icon">
                {{ buttonText }}
                <v-icon end>mdi-chevron-down</v-icon>
            </v-btn>
        </template>

        <v-card min-width="300" max-width="400">
            <v-card-title class="text-subtitle-1 py-2">
                Quick Apply Preset
            </v-card-title>

            <v-divider />

            <!-- Loading State -->
            <v-progress-linear v-if="loading" indeterminate />

            <!-- Empty State -->
            <v-card-text v-if="!loading && presets.length === 0" class="text-center py-4">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">
                    mdi-bookmark-off
                </v-icon>
                <div class="text-body-2 text-medium-emphasis">
                    No presets available
                </div>
                <v-btn variant="text" size="small" class="mt-2" @click="$emit('manage-presets')">
                    Create Preset
                </v-btn>
            </v-card-text>

            <!-- Presets List -->
            <v-list v-if="!loading && presets.length > 0" density="compact" max-height="400" class="overflow-y-auto">
                <!-- Default Preset (if exists) -->
                <v-list-item v-if="defaultPreset" :value="defaultPreset.id" @click="handleApply(defaultPreset)"
                    class="default-preset-item">
                    <template #prepend>
                        <v-icon color="primary">mdi-star</v-icon>
                    </template>

                    <v-list-item-title class="font-weight-medium">
                        {{ defaultPreset.name }}
                        <v-chip size="x-small" color="primary" class="ms-1">Default</v-chip>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="defaultPreset.description" class="text-caption">
                        {{ truncate(defaultPreset.description, 50) }}
                    </v-list-item-subtitle>
                </v-list-item>

                <v-divider v-if="defaultPreset && otherPresets.length > 0" />

                <!-- Other Presets -->
                <v-list-item v-for="preset in otherPresets" :key="preset.id" :value="preset.id"
                    @click="handleApply(preset)">
                    <template #prepend>
                        <v-icon>mdi-bookmark</v-icon>
                    </template>

                    <v-list-item-title>{{ preset.name }}</v-list-item-title>

                    <v-list-item-subtitle v-if="preset.description" class="text-caption">
                        {{ truncate(preset.description, 50) }}
                    </v-list-item-subtitle>

                    <template #append>
                        <v-chip size="x-small" variant="tonal">
                            {{ preset.configuration.contentType }}
                        </v-chip>
                    </template>
                </v-list-item>

                <v-divider />

                <!-- Manage Presets Link -->
                <v-list-item @click="$emit('manage-presets')">
                    <template #prepend>
                        <v-icon>mdi-cog</v-icon>
                    </template>
                    <v-list-item-title class="text-primary">
                        Manage Presets
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { UserPreset } from '@/types/preset'

const props = defineProps({
    presets: {
        type: Array as PropType<UserPreset[]>,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    variant: {
        type: String as PropType<'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'>,
        default: 'outlined'
    },
    color: {
        type: String,
        default: undefined
    },
    size: {
        type: String as PropType<'x-small' | 'small' | 'default' | 'large' | 'x-large'>,
        default: 'default'
    },
    icon: {
        type: String,
        default: 'mdi-bookmark'
    },
    buttonText: {
        type: String,
        default: 'Apply Preset'
    }
})

const emit = defineEmits<{
    'apply': [preset: UserPreset]
    'manage-presets': []
}>()

const defaultPreset = computed(() =>
    props.presets.find(p => p.isDefault)
)

const otherPresets = computed(() =>
    props.presets.filter(p => !p.isDefault).slice(0, 5) // Show max 5 other presets
)

const handleApply = (preset: UserPreset) => {
    emit('apply', preset)
}

const truncate = (text: string, length: number): string => {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}
</script>

<style scoped>
.default-preset-item {
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.default-preset-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
