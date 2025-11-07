<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="primary">mdi-video-box</v-icon>
            Video Template Library
            <v-spacer />
            <v-btn v-if="showCreateButton" color="primary" variant="tonal" prepend-icon="mdi-plus"
                @click="$emit('create-template')">
                Create Template
            </v-btn>
        </v-card-title>

        <v-card-text>
            <!-- Search and Filters -->
            <v-row class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="searchQuery" label="Search templates" prepend-inner-icon="mdi-magnify"
                        variant="outlined" density="compact" clearable @update:model-value="handleSearch" />
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="selectedCategory" :items="categories" label="Category" variant="outlined"
                        density="compact" clearable @update:model-value="handleCategoryChange" />
                </v-col>
                <v-col cols="12" md="3">
                    <v-select v-model="viewMode" :items="viewModes" label="View" variant="outlined" density="compact" />
                </v-col>
            </v-row>

            <!-- Loading State -->
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <!-- Error State -->
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="clearError">
                {{ error }}
            </v-alert>

            <!-- Empty State -->
            <v-alert v-if="!loading && !hasTemplates" type="info" variant="tonal" class="mb-4">
                <v-alert-title>No Templates Found</v-alert-title>
                {{ searchQuery ? 'Try adjusting your search criteria.' : 'No video templates available yet.' }}
            </v-alert>

            <!-- Templates Grid View -->
            <v-row v-if="viewMode === 'grid' && hasTemplates">
                <v-col v-for="template in templates" :key="template.id" cols="12" sm="6" md="4" lg="3">
                    <v-card class="template-card" :class="{ 'selected': selectedTemplate?.id === template.id }" hover
                        @click="handleTemplateSelect(template)">
                        <!-- Template Preview -->
                        <div class="template-preview" :style="getPreviewStyle(template)">
                            <v-icon size="48" color="white">mdi-video</v-icon>
                        </div>

                        <v-card-title class="text-subtitle-1">
                            {{ template.name }}
                            <v-chip v-if="template.isSystemTemplate" size="x-small" color="primary" class="ms-2">
                                System
                            </v-chip>
                        </v-card-title>

                        <v-card-subtitle v-if="template.description" class="text-caption">
                            {{ truncateText(template.description, 60) }}
                        </v-card-subtitle>

                        <v-card-text>
                            <v-chip-group>
                                <v-chip v-if="template.category" size="small" variant="tonal">
                                    {{ template.category }}
                                </v-chip>
                                <v-chip v-if="template.styleName" size="small" variant="tonal">
                                    {{ template.styleName }}
                                </v-chip>
                                <v-chip v-if="template.aspectRatio" size="small" variant="tonal">
                                    {{ template.aspectRatio }}
                                </v-chip>
                            </v-chip-group>

                            <div class="mt-2 d-flex align-center justify-space-between">
                                <div class="text-caption">
                                    <v-icon size="small">mdi-star</v-icon>
                                    {{ template.averageRating?.toFixed(1) || '0.0' }}
                                </div>
                                <div class="text-caption">
                                    <v-icon size="small">mdi-eye</v-icon>
                                    {{ template.usageCount || 0 }} uses
                                </div>
                            </div>
                        </v-card-text>

                        <v-card-actions>
                            <v-btn size="small" variant="text" color="primary"
                                @click.stop="$emit('preview-template', template)">
                                Preview
                            </v-btn>
                            <v-spacer />
                            <v-btn size="small" variant="tonal" color="primary"
                                @click.stop="$emit('use-template', template)">
                                Use Template
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Templates List View -->
            <v-list v-if="viewMode === 'list' && hasTemplates">
                <v-list-item v-for="template in templates" :key="template.id"
                    :class="{ 'selected': selectedTemplate?.id === template.id }"
                    @click="handleTemplateSelect(template)">
                    <template #prepend>
                        <v-avatar :color="template.primaryColor || 'primary'" size="48">
                            <v-icon color="white">mdi-video</v-icon>
                        </v-avatar>
                    </template>

                    <v-list-item-title>
                        {{ template.name }}
                        <v-chip v-if="template.isSystemTemplate" size="x-small" color="primary" class="ms-2">
                            System
                        </v-chip>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="template.description">
                        {{ template.description }}
                    </v-list-item-subtitle>

                    <template #append>
                        <div class="d-flex align-center gap-2">
                            <v-chip size="small" variant="tonal">
                                {{ template.category || 'General' }}
                            </v-chip>
                            <v-chip size="small" variant="tonal">
                                <v-icon start size="small">mdi-star</v-icon>
                                {{ template.averageRating?.toFixed(1) || '0.0' }}
                            </v-chip>
                            <v-btn size="small" variant="text" color="primary"
                                @click.stop="$emit('preview-template', template)">
                                Preview
                            </v-btn>
                            <v-btn size="small" variant="tonal" color="primary"
                                @click.stop="$emit('use-template', template)">
                                Use
                            </v-btn>
                        </div>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useVideoTemplates } from '@/composables/useVideoTemplates'
import type { VideoTemplate } from '@/services/videoTemplateService'

// Props
const props = defineProps<{
    showCreateButton?: boolean
    initialCategory?: string
    initialViewMode?: 'grid' | 'list'
}>()

// Emits
const emit = defineEmits<{
    'create-template': []
    'preview-template': [template: VideoTemplate]
    'use-template': [template: VideoTemplate]
    'template-selected': [template: VideoTemplate | null]
}>()

// Composables
const {
    templates,
    selectedTemplate,
    loading,
    error,
    hasTemplates,
    loadPublicTemplates,
    loadTemplatesByCategory,
    searchTemplates,
    selectTemplate,
    clearError
} = useVideoTemplates()

// Local state
const searchQuery = ref('')
const selectedCategory = ref(props.initialCategory || '')
const viewMode = ref<'grid' | 'list'>(props.initialViewMode || 'grid')

// Data
const categories = [
    { title: 'All Categories', value: '' },
    { title: 'Business', value: 'business' },
    { title: 'Marketing', value: 'marketing' },
    { title: 'Social Media', value: 'social' },
    { title: 'Education', value: 'education' },
    { title: 'Product', value: 'product' }
]

const viewModes = [
    { title: 'Grid View', value: 'grid' },
    { title: 'List View', value: 'list' }
]

// Methods
const handleSearch = () => {
    if (searchQuery.value.trim()) {
        searchTemplates(searchQuery.value)
    } else {
        loadPublicTemplates()
    }
}

const handleCategoryChange = () => {
    if (selectedCategory.value) {
        loadTemplatesByCategory(selectedCategory.value)
    } else {
        loadPublicTemplates()
    }
}

const handleTemplateSelect = (template: VideoTemplate) => {
    selectTemplate(template)
    emit('template-selected', template)
}

const getPreviewStyle = (template: VideoTemplate) => {
    return {
        background: `linear-gradient(135deg, ${template.primaryColor || '#1E3A8A'}, ${template.secondaryColor || '#3B82F6'})`,
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
}

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
    if (selectedCategory.value) {
        loadTemplatesByCategory(selectedCategory.value)
    } else {
        loadPublicTemplates()
    }
})

// Watch for category changes from props
watch(() => props.initialCategory, (newCategory) => {
    if (newCategory) {
        selectedCategory.value = newCategory
        loadTemplatesByCategory(newCategory)
    }
})
</script>

<style scoped>
.template-card {
    transition: all 0.3s ease;
}

.template-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.template-card.selected {
    border: 2px solid rgb(var(--v-theme-primary));
}

.template-preview {
    border-radius: 4px 4px 0 0;
}

.v-list-item.selected {
    background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
