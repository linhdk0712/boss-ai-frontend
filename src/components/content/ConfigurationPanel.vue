<template>
  <v-card class="configuration-card" elevation="2">
    <v-card-title class="d-flex align-center py-4">
      <v-icon class="me-2" size="20">mdi-cog-outline</v-icon>
      <span class="text-body-1 font-weight-medium">Content Configuration</span>
    </v-card-title>

    <v-card-text class="py-4">
      <v-form ref="configForm">
        <!-- Industry Selection -->
        <v-select
          v-model="communicationGoal"
          :items="comConfig"
          label="Communication Goal"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-account-group-outline"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
          multiple
          chips
        />

        <v-select
          v-model="industry"
          :items="activeIndustryOptions"
          label="Industry"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-account-group-outline"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <v-select
          v-model="businessProfile"
          label="Business Profile"
          clearable
          variant="outlined"
          density="compact"
          class="mb-3"
          :items="businessProfileOptions"
          item-title="displayLabel"
          item-value="value"
          prepend-inner-icon="mdi-briefcase-outline"
        />

        <!-- Content Type Selection -->
        <!-- <v-select
          v-model="contentType"
          :items="activeContentTypeOptions"
          label="Content Type"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-file-document-outline"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        /> -->

        <!-- Language Selection -->
        <v-select
          v-model="language"
          :items="activeLanguageOptions"
          label="Language"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-translate"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <!-- Tone Selection -->
        <!-- <v-select
          v-model="tone"
          :items="activeToneOptions"
          label="Tone"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-emoticon-outline"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        /> -->

        <!-- Target Audience Selection -->
        <!-- <v-select
          v-model="targetAudience"
          :items="activeTargetAudienceOptions"
          label="Target Audience"
          item-title="displayLabel"
          item-value="value"
          :loading="loading"
          clearable
          prepend-inner-icon="mdi-account-group-outline"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        /> -->
      </v-form>

      <!-- Error Display -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="clearError"
      >
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
import { computed, onMounted } from "vue";
import { useContentConfig } from "@/composables/useContentConfig";

// Props - All fields are optional and undefined by default
interface Props {
  industry?: string;
  contentType?: string;
  language?: string;
  tone?: string;
  targetAudience?: string;
  disabled?: boolean;
  communicationGoal?: string[];
  businessProfile?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

// Emits - All emit undefined to keep consistency
const emit = defineEmits<{
  "update:industry": [value: string | undefined];
  "update:communication-goal": [value: string | undefined];
  "update:business-profile": [value: string | undefined];
  "update:language": [value: string | undefined];
}>();

// Composables
const {
  activeIndustryOptions,
  // activeContentTypeOptions,
  activeLanguageOptions,
  // activeToneOptions,
  // activeTargetAudienceOptions,
  loading,
  error,
  loadAllConfigs,
} = useContentConfig();
const comConfig = [
  { value: "view", displayLabel: "View" },
  { value: "comment", displayLabel: "Comment" },
  { value: "save", displayLabel: "Save" },
  { value: "booking", displayLabel: "Booking" },
];
const businessProfileOptions = [
  {
    displayLabel: "Người bán hàng & Kinh doanh cá nhân",
    value: "individual_sales",
  },
  {
    displayLabel: "Coach / Đào tạo / Chuyên gia",
    value: "coach_expert",
  },
  {
    displayLabel: "Doanh nghiệp nhỏ / Local business",
    value: "small_business",
  },
];
// Computed properties for v-model - All handled the same way
const industry = computed({
  get: () => props.industry,
  set: (value: string | undefined) => emit("update:industry", value),
});

const communicationGoal = computed({
  get: () => props.communicationGoal,
  set: (value: string | undefined) => emit("update:communication-goal", value),
});

const businessProfile = computed({
  get: () => props.businessProfile,
  set: (value: string | undefined) => emit("update:business-profile", value),
});

const language = computed({
  get: () => props.language,
  set: (value: string | undefined) => emit("update:language", value),
});

// Methods
const clearError = () => {
  // Error will be cleared by the composable
};

// Load configuration on mount
onMounted(async () => {
  await loadAllConfigs();
});
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
