<template>
    <v-card class="content-card" :class="{ 'content-card--hover': !loading }" elevation="2">
        <!-- Card Header -->
        <v-card-title class="d-flex align-center">
            <div class="flex-grow-1">
                <h3 class="text-h6 text-truncate">{{ content.title }}</h3>
                <div class="d-flex align-center mt-1">
                    <v-chip :color="getContentTypeColor(content.contentType)" size="small" variant="tonal" class="me-2">
                        {{ getContentTypeLabel(content.contentType) }}
                    </v-chip>

                    <v-chip :color="getLanguageColor(content.language)" size="small" variant="tonal">
                        {{ getLanguageLabel(content.language) }}
                    </v-chip>
                </div>
            </div>

            <!-- Actions Menu -->
            <v-menu>
                <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                </template>

                <v-list>
                    <v-list-item prepend-icon="mdi-eye" title="View" @click="$emit('view', content)" />
                    <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="$emit('edit', content)" />
                    <v-list-item prepend-icon="mdi-refresh" title="Regenerate" @click="$emit('regenerate', content)" />
                    <v-divider />
                    <v-list-item prepend-icon="mdi-delete" title="Delete" class="text-error"
                        @click="$emit('delete', content)" />
                </v-list>
            </v-menu>
        </v-card-title>

        <!-- Content Preview -->
        <v-card-text>
            <!-- Original Content -->
            <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">Original Input:</div>
                <p class="text-body-2 content-preview">
                    {{ truncateText(content.content, 100) }}
                </p>
            </div>

            <!-- Generated Content -->
            <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">Generated Content:</div>
                <p class="text-body-2 content-preview generated-content">
                    {{ truncateText(content.generatedContent, 150) }}
                </p>
            </div>

            <!-- Statistics -->
            <v-row class="mt-2">
                <v-col cols="6">
                    <div class="text-center">
                        <div class="text-h6 text-primary">{{ content.wordCount }}</div>
                        <div class="text-caption">Words</div>
                    </div>
                </v-col>
                <v-col cols="6">
                    <div class="text-center">
                        <div class="text-h6 text-secondary">{{ content.tokensUsed }}</div>
                        <div class="text-caption">Tokens</div>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>

        <!-- Card Footer -->
        <v-card-actions class="pt-0">
            <div class="d-flex align-center w-100">
                <!-- Creation Date -->
                <div class="text-caption text-medium-emphasis">
                    <v-icon size="small" class="me-1">mdi-calendar</v-icon>
                    {{ formatDate(content.createdAt) }}
                </div>

                <v-spacer />

                <!-- Status -->
                <v-chip :color="getStatusColor(content.status)" size="small" variant="tonal">
                    <v-icon start size="small">{{ getStatusIcon(content.status) }}</v-icon>
                    {{ content.status }}
                </v-chip>
            </div>
        </v-card-actions>

        <!-- Quick Actions -->
        <v-card-actions class="pt-0">
            <v-btn variant="text" size="small" prepend-icon="mdi-eye" @click="$emit('view', content)">
                View
            </v-btn>

            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="$emit('edit', content)">
                Edit
            </v-btn>

            <v-spacer />

            <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary"
                @click="$emit('regenerate', content)">
                Regenerate
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { useContentConfig } from '@/composables/useContentConfig'
import type { ContentGenerationDto } from '@/types/content'

// Props
interface Props {
    content: ContentGenerationDto
    loading?: boolean
}

withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
defineEmits<{
    view: [content: ContentGenerationDto]
    edit: [content: ContentGenerationDto]
    delete: [content: ContentGenerationDto]
    regenerate: [content: ContentGenerationDto]
}>()

// Composables
const { findOptionByValue } = useContentConfig()

// Methods
const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const getContentTypeLabel = (value: string): string => {
    const option = findOptionByValue('contentType', value)
    return option?.displayLabel || value
}

const getLanguageLabel = (value: string): string => {
    const option = findOptionByValue('language', value)
    return option?.displayLabel || value
}

const getContentTypeColor = (contentType: string): string => {
    const colorMap: Record<string, string> = {
        'blog-post': 'primary',
        'social-media': 'secondary',
        'email': 'info',
        'product-description': 'success',
        'ad-copy': 'warning',
        'press-release': 'error',
        default: 'grey'
    }
    return colorMap[contentType] || colorMap.default
}

const getLanguageColor = (language: string): string => {
    const colorMap: Record<string, string> = {
        'vi': 'success',
        'en': 'primary',
        'zh': 'warning',
        'ja': 'info',
        'ko': 'secondary',
        default: 'grey'
    }
    return colorMap[language] || colorMap.default
}

const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
        case 'success':
        case 'completed':
            return 'success'
        case 'processing':
        case 'generating':
            return 'warning'
        case 'error':
        case 'failed':
            return 'error'
        default:
            return 'info'
    }
}

const getStatusIcon = (status: string): string => {
    switch (status?.toLowerCase()) {
        case 'success':
        case 'completed':
            return 'mdi-check-circle'
        case 'processing':
        case 'generating':
            return 'mdi-loading'
        case 'error':
        case 'failed':
            return 'mdi-alert-circle'
        default:
            return 'mdi-information'
    }
}
</script>

<style scoped>
.content-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
}

.content-card--hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.content-preview {
    line-height: 1.4;
    color: rgb(var(--v-theme-on-surface-variant));
}

.generated-content {
    background-color: rgb(var(--v-theme-surface-variant));
    padding: 8px;
    border-radius: 4px;
    border-left: 3px solid rgb(var(--v-theme-primary));
}

.v-card-title {
    padding-bottom: 8px;
}

.v-card-text {
    flex-grow: 1;
}

.v-card-actions {
    padding-top: 8px;
}

.text-h6 {
    font-weight: 600;
}

.text-caption {
    font-size: 0.75rem;
    opacity: 0.8;
}

.v-chip {
    font-size: 0.7rem;
    height: 20px;
}

.v-btn {
    text-transform: none;
}

.text-error {
    color: rgb(var(--v-theme-error)) !important;
}
</style>