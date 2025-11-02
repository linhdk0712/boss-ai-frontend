<template>
  <v-card class="content-form-card" elevation="2">
    <v-card-title class="d-flex align-center py-4">
      <v-icon class="me-2" size="20">mdi-auto-fix</v-icon>
      <span class="text-body-1 font-weight-medium">Content Generation</span>
    </v-card-title>

    <v-card-text class="py-4">
      <v-form ref="contentForm" @submit.prevent="handleGenerate">
        <!-- Title Input -->
        <VTextField v-model="title" label="Title (Optional)" :rules="[rules.maxLength(500)]" counter="500"
          prepend-inner-icon="mdi-format-title" hint="Optional title for your content" persistent-hint
          variant="outlined" :disabled="disabled" class="mb-3" />

        <!-- Content Input -->
        <VTextarea ref="textareaRef" v-model="content" label="Your Content Ideas"
          :rules="[rules.required, rules.maxLength(2000)]" counter="2000" rows="8" prepend-inner-icon="mdi-text"
          hint="Describe what content you want to generate" persistent-hint class="mb-3" :disabled="loading"
          :readonly="false" auto-grow clearable
          placeholder="Enter your content ideas here... Be specific about what you want to create." variant="outlined"
          @input="handleInput" />

        <!-- Character and Word Count Display -->
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-4">
          <span>Characters: {{ content.length }}</span>
          <span>Words: {{ wordCount }}</span>
        </div>

        <!-- Generate Button -->
        <VBtn color="primary" :loading="loading" :disabled="!canGenerate" @click="handleGenerate">
          <VIcon start>mdi-auto-fix</VIcon>
          Generate Content
        </VBtn>

        <!-- Helper message when button is disabled -->
        <v-alert v-if="!canGenerate && content.trim().length > 0" type="info" variant="tonal" class="mb-4">
          <v-alert-title>Ready to Generate!</v-alert-title>
          Please select Content Type and Language in the configuration panel to enable content generation.
        </v-alert>

        <!-- Generated Content Display -->
        <GeneratedContent v-if="generatedContent" :content="generatedContent" class="mb-4" />

        <!-- Action Buttons - only show for successful generation -->
        <ContentActions
          v-if="generatedContent && generatedContent.generatedContent && generatedContent.status !== 'FAILED'"
          :loading="loading" :can-save="canSave" :can-create-video="canCreateVideo" :saving="saving"
          :creating-video="creatingVideo" @save="handleSave" @create-video="handleCreateVideo" />
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
import type { ContentGenerateResponse } from '@/types/content'
import GeneratedContent from './GeneratedContent.vue'
import ContentActions from './ContentActions.vue'

// Props
interface Props {
  content: string
  title?: string
  generatedContent?: ContentGenerateResponse | null
  loading?: boolean
  saving?: boolean
  creatingVideo?: boolean
  canSave?: boolean
  canCreateVideo?: boolean
  error?: string | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  saving: false,
  creatingVideo: false,
  canSave: false,
  canCreateVideo: false,
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:content': [value: string]
  'update:title': [value: string]
  generate: []
  save: [title: string]
  'create-video': [title?: string]
}>()

// Form ref
const contentForm = ref()
const textareaRef = ref()

// Computed properties for v-model
const content = computed({
  get: () => props.content || '',
  set: (value) => {
    console.log('Content input changed:', value) // Debug log
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

// Validation computed
const canGenerate = computed(() => {
  const contentText = content.value || ''
  return contentText.trim().length > 0 &&
    contentText.length <= 2000 &&
    !props.loading
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
    emit('generate')
  }
}

const handleSave = () => {
  const saveTitle = title.value || `Generated Content ${new Date().toLocaleDateString()}`
  emit('save', saveTitle)
}



const handleCreateVideo = () => {
  const videoTitle = title.value || props.generatedContent?.title
  emit('create-video', videoTitle)
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
.content-form-card {
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

/* Compact generate button */
.generate-btn {
  height: 40px !important;
  font-size: 0.875rem;
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