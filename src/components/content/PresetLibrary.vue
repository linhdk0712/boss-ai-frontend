<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-bookmark-multiple</v-icon>
            My Presets
            <v-spacer />
            <v-btn variant="text" icon="mdi-close" size="small" @click="$emit('close')" />
        </v-card-title>

        <v-card-text>
            <!-- Search and Filters -->
            <v-row class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="searchQuery" placeholder="Search presets..." prepend-inner-icon="mdi-magnify"
                        variant="outlined" density="comfortable" clearable hide-details />
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="selectedContentType" :items="contentTypeOptions" label="Content Type"
                        variant="outlined" density="comfortable" clearable hide-details />
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="sortBy" :items="sortOptions" label="Sort By" variant="outlined"
                        density="comfortable" hide-details />
                </v-col>
            </v-row>

            <!-- Action Buttons -->
            <div class="d-flex gap-2 mb-4">
                <v-btn variant="outlined" prepend-icon="mdi-upload" size="small" @click="handleImport">
                    Import
                </v-btn>
                <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileSelect" />
            </div>

            <!-- Loading State -->
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <!-- Error Alert -->
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
                {{ error }}
            </v-alert>

            <!-- Empty State -->
            <v-alert v-if="!loading && filteredPresets.length === 0" type="info" variant="tonal" class="mb-4">
                <div class="d-flex align-center">
                    <v-icon class="me-2">mdi-information</v-icon>
                    <div>
                        <div class="font-weight-medium">No presets found</div>
                        <div class="text-caption">
                            <template v-if="searchQuery || selectedContentType">
                                Try adjusting your filters
                            </template>
                            <template v-else>
                                Save your first preset to get started
                            </template>
                        </div>
                    </div>
                </div>
            </v-alert>

            <!-- Presets List -->
            <v-list v-if="!loading && filteredPresets.length > 0" class="preset-list">
                <v-list-item v-for="preset in filteredPresets" :key="preset.id" class="preset-item"
                    :class="{ 'default-preset': preset.isDefault }">
                    <template #prepend>
                        <v-avatar :color="preset.isDefault ? 'primary' : 'grey-lighten-1'" size="40">
                            <v-icon>{{ preset.isDefault ? 'mdi-star' : 'mdi-bookmark' }}</v-icon>
                        </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-medium">
                        {{ preset.name }}
                        <v-chip v-if="preset.isDefault" size="x-small" color="primary" class="ms-2">
                            Default
                        </v-chip>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="preset.description" class="text-wrap">
                        {{ preset.description }}
                    </v-list-item-subtitle>

                    <v-list-item-subtitle class="mt-1">
                        <v-chip size="x-small" variant="tonal" class="me-1">
                            {{ preset.configuration.contentType }}
                        </v-chip>
                        <v-chip size="x-small" variant="tonal" class="me-1">
                            {{ preset.configuration.language }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis">
                            Used {{ preset.usageCount }} times
                        </span>
                    </v-list-item-subtitle>

                    <template #append>
                        <div class="d-flex gap-1">
                            <v-btn icon="mdi-play" size="small" variant="tonal" color="primary"
                                @click="$emit('apply', preset)">
                                <v-icon>mdi-play</v-icon>
                                <v-tooltip activator="parent" location="top">Apply Preset</v-tooltip>
                            </v-btn>

                            <v-menu>
                                <template #activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
                                </template>

                                <v-list density="compact">
                                    <v-list-item v-if="!preset.isDefault" prepend-icon="mdi-star"
                                        @click="$emit('set-default', preset.id)">
                                        <v-list-item-title>Set as Default</v-list-item-title>
                                    </v-list-item>

                                    <v-list-item prepend-icon="mdi-pencil" @click="$emit('edit', preset)">
                                        <v-list-item-title>Edit</v-list-item-title>
                                    </v-list-item>

                                    <v-list-item prepend-icon="mdi-share-variant" @click="$emit('share', preset)">
                                        <v-list-item-title>Share</v-list-item-title>
                                    </v-list-item>

                                    <v-list-item prepend-icon="mdi-download" @click="$emit('export', preset.id)">
                                        <v-list-item-title>Export</v-list-item-title>
                                    </v-list-item>

                                    <v-divider />

                                    <v-list-item prepend-icon="mdi-delete" class="text-error"
                                        @click="handleDeleteClick(preset)">
                                        <v-list-item-title>Delete</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-error">
                    <v-icon class="me-2">mdi-alert</v-icon>
                    Delete Preset?
                </v-card-title>

                <v-card-text>
                    Are you sure you want to delete the preset "{{ presetToDelete?.name }}"? This action cannot be
                    undone.
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showDeleteDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="error" @click="confirmDelete">
                        Delete
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import type { UserPreset } from '@/types/preset'

const props = defineProps({
    presets: {
        type: Array as PropType<UserPreset[]>,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String as PropType<string | null>,
        default: null
    }
})

const emit = defineEmits<{
    'close': []
    'apply': [preset: UserPreset]
    'edit': [preset: UserPreset]
    'delete': [id: number]
    'set-default': [id: number]
    'share': [preset: UserPreset]
    'export': [id: number]
    'import': [file: File]
}>()

const searchQuery = ref('')
const selectedContentType = ref<string | undefined>()
const sortBy = ref('lastUsedAt')
const showDeleteDialog = ref(false)
const presetToDelete = ref<UserPreset | null>(null)
const fileInput = ref<HTMLInputElement>()

const sortOptions = [
    { title: 'Recently Used', value: 'lastUsedAt' },
    { title: 'Most Used', value: 'usageCount' },
    { title: 'Name', value: 'name' },
    { title: 'Date Created', value: 'createdAt' }
]

const contentTypeOptions = computed(() => {
    const types = new Set(props.presets.map(p => p.configuration.contentType))
    return Array.from(types).sort().map(type => ({ title: type, value: type }))
})

const filteredPresets = computed(() => {
    let filtered = [...props.presets]

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
                return aValue > bValue ? 1 : -1
            case 'usageCount':
                return b.usageCount - a.usageCount
            case 'lastUsedAt':
                aValue = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0
                bValue = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0
                return bValue - aValue
            case 'createdAt':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            default:
                return 0
        }
    })

    return filtered
})

const handleDeleteClick = (preset: UserPreset) => {
    presetToDelete.value = preset
    showDeleteDialog.value = true
}

const confirmDelete = () => {
    if (presetToDelete.value) {
        emit('delete', presetToDelete.value.id)
        showDeleteDialog.value = false
        presetToDelete.value = null
    }
}

const handleImport = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        emit('import', file)
        // Reset input
        target.value = ''
    }
}
</script>

<style scoped>
.preset-list {
    max-height: 600px;
    overflow-y: auto;
}

.preset-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 12px;
}

.preset-item.default-preset {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.preset-item:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.preset-item.default-preset:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
