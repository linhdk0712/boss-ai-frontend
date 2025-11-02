<template>
  <v-card class="configuration-card" elevation="2">
    <v-card-title class="d-flex align-center py-4">
      <v-icon class="me-2" size="20">mdi-cog-outline</v-icon>
      <span class="text-body-1 font-weight-medium">Content Configuration</span>
    </v-card-title>

    <v-card-text class="py-4">
      <v-form ref="configForm">
        <!-- Industry Selection -->
        <v-select v-model="industry" :items="activeIndustryOptions" label="Industry" item-title="displayLabel"
          item-value="value" :loading="loading" clearable prepend-inner-icon="mdi-domain" persistent-hint
          variant="outlined" density="compact" class="mb-3" />

        <!-- Content Type Selection -->
        <v-select v-model="contentType" :items="activeContentTypeOptions" label="Content Type" item-title="displayLabel"
          item-value="value" :loading="loading" clearable prepend-inner-icon="mdi-file-document-outline" persistent-hint
          variant="outlined" density="compact" class="mb-3" />

        <!-- Language Selection -->
        <v-select v-model="language" :items="activeLanguageOptions" label="Language" item-title="displayLabel"
          item-value="value" :loading="loading" clearable prepend-inner-icon="mdi-translate" persistent-hint
          variant="outlined" density="compact" class="mb-3" />

        <!-- Tone Selection -->
        <v-select v-model="tone" :items="activeToneOptions" label="Tone" item-title="displayLabel" item-value="value"
          :loading="loading" clearable prepend-inner-icon="mdi-emoticon-outline" persistent-hint variant="outlined"
          density="compact" class="mb-3" />

        <!-- Target Audience Selection -->
        <v-select v-model="targetAudience" :items="activeTargetAudienceOptions" label="Target Audience"
          item-title="displayLabel" item-value="value" :loading="loading" clearable
          prepend-inner-icon="mdi-account-group-outline" persistent-hint variant="outlined" density="compact" />
      </v-form>

      <!-- Error Display -->
      <v-alert v-if="error" type="error" variant="tonal" class="mt-4" closable @click:close="clearError">
        <v-alert-title>Configuration Error</v-alert-title>
        {{ error }}
      </v-alert>

      <!-- Loading Skeleton -->
      <div v-if="loading && !isConfigLoaded" class="mt-4">
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" class="mb-2" />
        <v-skeleton-loader type="list-item-two-line" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useContentConfig } from '@/composables/useContentConfig'

// Props
interface Props {
  industry?: string
  contentType: string
  language: string
  tone?: string
  targetAudience?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  language: 'vi'
})

// Emits
const emit = defineEmits<{
  'update:industry': [value: string | undefined]
  'update:contentType': [value: string]
  'update:language': [value: string]
  'update:tone': [value: string | undefined]
  'update:targetAudience': [value: string | undefined]
}>()

// Composables
const {
  activeIndustryOptions,
  activeContentTypeOptions,
  activeLanguageOptions,
  activeToneOptions,
  activeTargetAudienceOptions,
  loading,
  error,
  isConfigLoaded,
  loadAllConfigs,
  getDefaultLanguage
} = useContentConfig()

// Computed properties for v-model
const industry = computed({
  get: () => props.industry,
  set: (value) => emit('update:industry', value)
})

const contentType = computed({
  get: () => props.contentType,
  set: (value) => emit('update:contentType', value)
})

const language = computed({
  get: () => props.language,
  set: (value) => emit('update:language', value)
})

const tone = computed({
  get: () => props.tone,
  set: (value) => emit('update:tone', value)
})

const targetAudience = computed({
  get: () => props.targetAudience,
  set: (value) => emit('update:targetAudience', value)
})



// Methods
const clearError = () => {
  // Error will be cleared by the composable
}

// Set default language when options are loaded
watch(isConfigLoaded, (loaded) => {
  if (loaded && !props.language) {
    const defaultLang = getDefaultLanguage()
    if (defaultLang) {
      emit('update:language', defaultLang.value)
    }
  }
})

// Load configuration on mount
onMounted(() => {
  loadAllConfigs()
})
</script>

<style scoped>
.configuration-card {
  border-radius: 8px;
  height: fit-content;
}

.v-card-title {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.875rem;
  font-weight: 500;
}

.v-card-text {
  padding: 1.5rem;
}

.v-card-actions {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
}

/* Improve form field spacing and appearance */
:deep(.v-field--variant-outlined) {
  --v-field-border-width: 1px;
}

:deep(.v-field--focused) {
  --v-field-border-width: 2px;
}

/* Compact density styling */
:deep(.v-field--density-compact .v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 0.875rem;
}

:deep(.v-field--density-compact .v-field__prepend-inner) {
  padding-top: 8px;
}

:deep(.v-messages) {
  font-size: 0.75rem;
  line-height: 1.2;
  margin-top: 4px;
}

:deep(.v-select__selection) {
  font-size: 0.875rem;
}
</style>