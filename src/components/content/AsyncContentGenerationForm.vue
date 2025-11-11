<template>
    <v-card class="async-content-form-card" elevation="2">
        <v-card-title class="d-flex align-center py-4">
            <v-icon class="me-2" size="20">mdi-auto-fix</v-icon>
            <span class="text-body-1 font-weight-medium">AI Content Generation</span>
            <v-spacer />
            <v-chip v-if="hasActiveJobs" color="primary" size="small" variant="tonal">
                {{ activeJobsCount }} generating
            </v-chip>
        </v-card-title>

        <v-card-text class="py-4">
            <v-form ref="contentForm" @submit.prevent="handleGenerate">
                <!-- Title Input -->
                <VTextField v-model="title" label="Title (Optional)" :rules="[rules.maxLength(500)]" counter="500"
                    prepend-inner-icon="mdi-format-title" hint="Optional title for your content" persistent-hint
                    variant="outlined" :disabled="disabled" class="mb-3" />

                <!-- Content Input -->
                <VTextarea ref="textareaRef" v-model="content" label="Your Content Ideas"
                    :rules="[rules.required, rules.maxLength(2000)]" counter="2000" rows="8"
                    prepend-inner-icon="mdi-text" hint="Describe what content you want to generate" persistent-hint
                    class="mb-3" :disabled="disabled" :readonly="false" auto-grow clearable
                    placeholder="Enter your content ideas here... Be specific about what you want to create."
                    variant="outlined" @input="handleInput" />

                <!-- Character and Word Count Display -->
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-4">
                    <span>Characters: {{ content.length }}</span>
                    <span>Words: {{ wordCount }}</span>
                </div>

                <!-- Generate Button -->
                <div class="generate-actions d-flex gap-2">
                    <VBtn color="primary" :loading="asyncGenerating" :disabled="!canGenerate"
                        @click="handleGenerate">
                        <VIcon start>mdi-auto-fix</VIcon>
                        Generate Content
                    </VBtn>

                    <VBtn v-if="hasActiveJobs" variant="outlined" color="primary" :disabled="!canGenerate"
                        @click="handleGenerateAnother">
                        <VIcon start>mdi-plus</VIcon>
                        Add to Queue
                    </VBtn>
                </div>

                <!-- Helper message when button is disabled -->
                <v-alert v-if="!canGenerate && content.trim().length > 0" type="info" variant="tonal" class="mt-3">
                    <v-alert-title>Ready to Generate!</v-alert-title>
                    Please select Content Type and Language in the configuration panel to enable content generation.
                </v-alert>

                <!-- Active Jobs Summary -->
                <div v-if="hasActiveJobs" class="active-jobs-summary mt-4">
                    <v-card variant="tonal" color="primary">
                        <v-card-text class="py-3">
                            <div class="d-flex align-center">
                                <v-icon icon="mdi-cog" class="me-2" />
                                <div class="flex-grow-1">
                                    <div class="text-body-2 font-weight-medium">
                                        {{ activeJobsCount }} job{{ activeJobsCount > 1 ? 's' : '' }} in progress
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ queueLength }} queued • {{ processingJobsCount }} processing
                                    </div>
                                </div>
                                <v-btn size="small" variant="text" @click="$emit('show-queue')">
                                    View Queue
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>

                <!-- Recent Completions -->
                <div v-if="recentCompletions.length > 0" class="recent-completions mt-4">
                    <div class="text-caption font-weight-medium text-medium-emphasis mb-2">
                        Recent Completions
                    </div>
                    <div class="completions-list">
                        <v-chip v-for="completion in recentCompletions.slice(0, 3)" :key="completion.id"
                            :color="completion.status === 'completed' ? 'success' : 'error'" size="small"
                            variant="tonal" class="me-2 mb-2" @click="$emit('view-result', completion)">
                            <v-icon start :icon="completion.status === 'completed' ? 'mdi-check' : 'mdi-alert'" />
                            {{ completion.type === 'content_generation' ? 'Content' : 'Video' }}
                        </v-chip>
                    </div>
                </div>
            </v-form>

            <!-- Error Display -->
            <v-alert v-if="error" type="error" variant="tonal" class="mt-4" closable @click:close="clearError">
                <v-alert-title>Generation Error</v-alert-title>
                {{ error }}
            </v-alert>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { AsyncJob } from '@/composables/useAsyncContentGeneration'

// Props
interface Props {
    content: string
    title?: string
    syncGenerating?: boolean
    asyncGenerating?: boolean
    error?: string | null
    disabled?: boolean
    activeJobs?: AsyncJob[]
    completedJobs?: AsyncJob[]
    queueLength?: number
    processingJobs?: AsyncJob[]
}

const props = withDefaults(defineProps<Props>(), {
    syncGenerating: false,
    asyncGenerating: false,
    disabled: false,
    activeJobs: () => [],
    completedJobs: () => [],
    queueLength: 0,
    processingJobs: () => []
})

// Emits
const emit = defineEmits<{
    'update:content': [value: string]
    'update:title': [value: string]
    'generate': [async: boolean]
    'show-queue': []
    'view-result': [job: AsyncJob]
}>()

// Form ref
const contentForm = ref()
const textareaRef = ref()

// Computed properties for v-model
const content = computed({
    get: () => props.content || '',
    set: (value) => {
        emit('update:content', value || '')
    }
})

const title = computed({
    get: () => props.title || '',
    set: (value) => emit('update:title', value || '')
})

// Word count calculation
const wordCount = computed(() => {
    if (!content.value) return 0
    return content.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

// Job-related computed properties
const hasActiveJobs = computed(() => props.activeJobs.length > 0)
const activeJobsCount = computed(() => props.activeJobs.length)
const processingJobsCount = computed(() => props.processingJobs.length)

const recentCompletions = computed(() => {
    return props.completedJobs
        .filter(job => job.completedAt && (Date.now() - job.completedAt) < 300000) // Last 5 minutes
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
})

// Validation computed
const canGenerate = computed(() => {
    const contentText = content.value || ''
    return contentText.trim().length > 0 &&
        contentText.length <= 2000 &&
        !props.syncGenerating &&
        !props.disabled
})

// Validation rules
const rules = {
    required: (value: string) => {
        const text = value || ''
        return !!text.trim() || 'This field is required'
    },
    maxLength: (max: number) => (value: string) => {
        const text = value || ''
        return text.length <= max || `Maximum ${max} characters allowed`
    }
}

// Methods
const handleGenerate = async () => {
    const { valid } = await contentForm.value.validate()
    if (valid) {
        emit('generate', true) // Always async mode
    }
}

const handleGenerateAnother = async () => {
    const { valid } = await contentForm.value.validate()
    if (valid) {
        emit('generate', true) // Always async mode
    }
}

const clearError = () => {
    // Error clearing will be handled by parent component
}

// Handle input changes for enhanced UX
const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    if (target) {
        // Additional input handling can be added here if needed
        // For now, v-model handles the value updates automatically
    }
}

watch(() => props.disabled, (disabled) => {
    if (!disabled && textareaRef.value) {
        nextTick(() => {
            textareaRef.value?.focus()
        })
    }
})

// Focus textarea on mount
onMounted(() => {
    if (!props.disabled) {
        nextTick(() => {
            textareaRef.value?.focus()
        })
    }
})
</script>

<style scoped>
.async-content-form-card {
    border-radius: 8px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.v-card-title {
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
    font-size: 0.875rem;
    font-weight: 500;
    flex-shrink: 0;
}

.v-card-text {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
}

:deep(.v-textarea .v-field__input) {
    font-family: inherit;
    line-height: 1.6;
    font-size: 0.875rem;
    min-height: 120px;
}

:deep(.v-text-field .v-field__input) {
    font-size: 0.875rem;
}

/* Compact field heights */
:deep(.v-field--density-compact .v-field__input) {
    padding-top: 8px;
    padding-bottom: 8px;
}

:deep(.v-field--density-compact .v-field__prepend-inner) {
    padding-top: 8px;
}

.text-caption {
    font-size: 0.75rem;
}

/* Improve form field appearance */
:deep(.v-field--variant-outlined) {
    --v-field-border-width: 1px;
}

:deep(.v-field--focused) {
    --v-field-border-width: 2px;
}

/* Better button styling */
:deep(.v-btn) {
    font-weight: 500;
}

/* Generate actions */
.generate-actions {
    flex-wrap: wrap;
}

/* Active jobs summary */
.active-jobs-summary :deep(.v-card) {
    border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

/* Recent completions */
.completions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.completions-list :deep(.v-chip) {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.completions-list :deep(.v-chip:hover) {
    transform: scale(1.05);
}

/* Improve textarea placeholder */
:deep(.v-field__input::placeholder) {
    color: rgba(var(--v-theme-on-surface), 0.6);
    opacity: 1;
}

/* Form spacing */
.v-form {
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>