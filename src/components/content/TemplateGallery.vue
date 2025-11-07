<template>
    <v-card class="template-gallery">
        <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-view-grid</v-icon>
            <span>Template Gallery</span>
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
        </v-card-title>

        <v-card-text>
            <!-- Search and Filters -->
            <v-row class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="Search templates"
                        variant="outlined" density="compact" clearable hide-details
                        @update:model-value="handleSearch" />
                </v-col>
                <v-col cols="12" md="6">
                    <v-btn variant="outlined" prepend-icon="mdi-filter" @click="showFilters = !showFilters">
                        Filters
                        <v-badge v-if="activeFiltersCount > 0" :content="activeFiltersCount" color="primary" inline />
                    </v-btn>
                    <v-btn v-if="activeFiltersCount > 0" variant="text" class="ms-2" @click="clearFilters">
                        Clear All
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Filter Panel -->
            <v-expand-transition>
                <v-card v-if="showFilters" variant="tonal" class="mb-4">
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" md="3">
                                <v-select v-model="selectedCategory" :items="categories" label="Category"
                                    variant="outlined" density="compact" clearable hide-details />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-select v-model="selectedIndustry" :items="industries" label="Industry"
                                    variant="outlined" density="compact" clearable hide-details />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-select v-model="selectedContentType" :items="contentTypes" label="Content Type"
                                    variant="outlined" density="compact" clearable hide-details />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-select v-model="minRating" :items="ratingOptions" label="Min Rating"
                                    variant="outlined" density="compact" clearable hide-details />
                            </v-col>
                        </v-row>
                        <v-row v-if="allTags.length > 0" class="mt-2">
                            <v-col cols="12">
                                <v-chip-group v-model="selectedTags" column multiple>
                                    <v-chip v-for="tag in allTags" :key="tag" :value="tag" filter variant="outlined">
                                        {{ tag }}
                                    </v-chip>
                                </v-chip-group>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-expand-transition>

            <!-- Loading State -->
            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <!-- Error State -->
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
                {{ error }}
            </v-alert>

            <!-- Tabs for Different Views -->
            <v-tabs v-model="activeTab" class="mb-4">
                <v-tab value="all">
                    <v-icon start>mdi-view-grid</v-icon>
                    All Templates
                </v-tab>
                <v-tab value="recommended">
                    <v-icon start>mdi-star</v-icon>
                    Recommended
                </v-tab>
                <v-tab value="popular">
                    <v-icon start>mdi-fire</v-icon>
                    Popular
                </v-tab>
            </v-tabs>

            <!-- Template Grid -->
            <v-window v-model="activeTab">
                <!-- All Templates -->
                <v-window-item value="all">
                    <v-row v-if="filteredTemplates.length > 0">
                        <v-col v-for="template in filteredTemplates" :key="template.id" cols="12" md="6" lg="4">
                            <TemplateCard :template="template" @select="handleSelectTemplate"
                                @preview="handlePreviewTemplate" @rate="handleRateTemplate" />
                        </v-col>
                    </v-row>
                    <v-alert v-else type="info" variant="tonal">
                        No templates found. Try adjusting your filters.
                    </v-alert>
                </v-window-item>

                <!-- Recommended Templates -->
                <v-window-item value="recommended">
                    <v-row v-if="recommendedTemplates.length > 0">
                        <v-col v-for="template in recommendedTemplates" :key="template.id" cols="12" md="6" lg="4">
                            <TemplateCard :template="template" @select="handleSelectTemplate"
                                @preview="handlePreviewTemplate" @rate="handleRateTemplate" />
                        </v-col>
                    </v-row>
                    <v-alert v-else type="info" variant="tonal">
                        No recommended templates available yet. Start using templates to get personalized
                        recommendations.
                    </v-alert>
                </v-window-item>

                <!-- Popular Templates -->
                <v-window-item value="popular">
                    <v-row v-if="popularTemplates.length > 0">
                        <v-col v-for="template in popularTemplates" :key="template.id" cols="12" md="6" lg="4">
                            <TemplateCard :template="template" @select="handleSelectTemplate"
                                @preview="handlePreviewTemplate" @rate="handleRateTemplate" />
                        </v-col>
                    </v-row>
                    <v-alert v-else type="info" variant="tonal">
                        No popular templates available.
                    </v-alert>
                </v-window-item>
            </v-window>
        </v-card-text>

        <!-- Template Preview Dialog -->
        <TemplatePreviewDialog v-model="showPreview" :template="previewTemplate" @apply="handleApplyTemplate"
            @rate="handleRateTemplate" />

        <!-- Rating Dialog -->
        <TemplateRatingDialog v-model="showRating" :template="ratingTemplate" @submit="handleSubmitRating" />
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTemplateManagement } from '@/composables/useTemplateManagement'
import type { ContentTemplate } from '@/services/templateService'
import TemplateCard from './TemplateCard.vue'
import TemplatePreviewDialog from './TemplatePreviewDialog.vue'
import TemplateRatingDialog from './TemplateRatingDialog.vue'

const emit = defineEmits<{
    close: []
    select: [template: ContentTemplate]
    apply: [template: ContentTemplate, customParams?: Record<string, any>]
}>()

const {
    templates,
    recommendedTemplates,
    popularTemplates,
    loading,
    error,
    searchQuery,
    selectedCategory,
    selectedIndustry,
    selectedContentType,
    selectedTags,
    minRating,
    filteredTemplates,
    categories,
    industries,
    contentTypes,
    allTags,
    loadTemplates,
    loadRecommendedTemplates,
    loadPopularTemplates,
    searchTemplates,
    rateTemplate,
    clearFilters: clearAllFilters,
} = useTemplateManagement()

const activeTab = ref('all')
const showFilters = ref(false)
const showPreview = ref(false)
const showRating = ref(false)
const previewTemplate = ref<ContentTemplate | null>(null)
const ratingTemplate = ref<ContentTemplate | null>(null)

const ratingOptions = [
    { title: '4+ Stars', value: 4 },
    { title: '3+ Stars', value: 3 },
    { title: '2+ Stars', value: 2 },
    { title: '1+ Stars', value: 1 },
]

const activeFiltersCount = computed(() => {
    let count = 0
    if (selectedCategory.value) count++
    if (selectedIndustry.value) count++
    if (selectedContentType.value) count++
    if (selectedTags.value.length > 0) count++
    if (minRating.value > 0) count++
    return count
})

const handleSearch = () => {
    if (searchQuery.value || activeFiltersCount.value > 0) {
        searchTemplates()
    } else {
        loadTemplates()
    }
}

const handleSelectTemplate = (template: ContentTemplate) => {
    emit('select', template)
}

const handlePreviewTemplate = (template: ContentTemplate) => {
    previewTemplate.value = template
    showPreview.value = true
}

const handleApplyTemplate = (template: ContentTemplate, customParams?: Record<string, any>) => {
    emit('apply', template, customParams)
    showPreview.value = false
}

const handleRateTemplate = (template: ContentTemplate) => {
    ratingTemplate.value = template
    showRating.value = true
}

const handleSubmitRating = async (rating: number, feedback?: string) => {
    if (ratingTemplate.value) {
        const success = await rateTemplate(ratingTemplate.value.id, rating, feedback)
        if (success) {
            showRating.value = false
            // Reload templates to reflect updated rating
            if (activeTab.value === 'all') {
                await loadTemplates()
            } else if (activeTab.value === 'recommended') {
                await loadRecommendedTemplates()
            } else if (activeTab.value === 'popular') {
                await loadPopularTemplates()
            }
        }
    }
}

const clearFilters = () => {
    clearAllFilters()
    loadTemplates()
}

// Watch for tab changes
watch(activeTab, async (newTab) => {
    if (newTab === 'recommended' && recommendedTemplates.value.length === 0) {
        await loadRecommendedTemplates()
    } else if (newTab === 'popular' && popularTemplates.value.length === 0) {
        await loadPopularTemplates()
    }
})

// Load templates on mount
onMounted(async () => {
    await loadTemplates()
})
</script>

<style scoped>
.template-gallery {
    max-height: 80vh;
    overflow-y: auto;
}
</style>
