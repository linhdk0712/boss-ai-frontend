<template>
  <v-card variant="outlined" class="content-actions-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-lightning-bolt</v-icon>
      Actions
    </v-card-title>

    <v-card-text class="py-4">
      <v-row class="ga-3">
        <!-- Save Content Button -->
        <v-col cols="12" md="4">
          <v-btn class="save-btn" variant="flat" :loading="saving" :disabled="!canSave || loading" @click="handleSave"
            block>
            <v-icon start>mdi-content-save</v-icon>
            Save Content
          </v-btn>
        </v-col>

        <!-- Regenerate Button -->
        <v-col cols="12" md="4">
          <v-btn class="regenerate-btn" variant="flat" :loading="loading" :disabled="!canRegenerate || loading"
            @click="handleRegenerate" block>
            <v-icon start>mdi-refresh</v-icon>
            Regenerate
          </v-btn>
        </v-col>

        <!-- Create Video Button -->
        <v-col cols="12" md="4">
          <v-btn class="video-btn" variant="flat" :loading="creatingVideo" :disabled="!canCreateVideo || loading"
            @click="handleCreateVideo" block>
            <v-icon start>mdi-video-plus</v-icon>
            Create Video
          </v-btn>
        </v-col>
      </v-row>

      <!-- Action Descriptions -->
      <v-row class="mt-2">
        <v-col cols="12">
          <div class="text-caption text-medium-emphasis">
            <strong>Save:</strong> Add to your content library •
            <strong>Regenerate:</strong> Generate new variation •
            <strong>Video:</strong> Create video from content
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- Save Success Dialog -->
  <v-dialog v-model="saveSuccessDialog" max-width="400">
    <v-card>
      <v-card-title class="d-flex align-center text-success">
        <v-icon class="me-2">mdi-check-circle</v-icon>
        Content Saved!
      </v-card-title>

      <v-card-text>
        Your content has been successfully saved to your library.
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="success" variant="text" @click="saveSuccessDialog = false">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Video Success Dialog -->
  <v-dialog v-model="videoSuccessDialog" max-width="400">
    <v-card>
      <v-card-title class="d-flex align-center text-secondary">
        <v-icon class="me-2">mdi-video-check</v-icon>
        Video Creation Started!
      </v-card-title>

      <v-card-text>
        Your video generation workflow has been triggered. You'll be notified when it's ready.
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="videoSuccessDialog = false">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
interface Props {
  loading?: boolean
  saving?: boolean
  creatingVideo?: boolean
  canSave?: boolean
  canRegenerate?: boolean
  canCreateVideo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  saving: false,
  creatingVideo: false,
  canSave: false,
  canRegenerate: false,
  canCreateVideo: false
})

// Emits
const emit = defineEmits<{
  save: []
  regenerate: []
  'create-video': []
}>()

// Reactive state
const saveSuccessDialog = ref(false)
const videoSuccessDialog = ref(false)

// Methods
const handleSave = () => {
  emit('save')
}

const handleRegenerate = () => {
  emit('regenerate')
}

const handleCreateVideo = () => {
  emit('create-video')
}

// Watch for successful operations to show dialogs
watch(() => props.saving, (saving, wasSaving) => {
  if (wasSaving && !saving && props.canSave) {
    // Save operation completed successfully
    saveSuccessDialog.value = true
  }
})

watch(() => props.creatingVideo, (creating, wasCreating) => {
  if (wasCreating && !creating && props.canCreateVideo) {
    // Video creation completed successfully
    videoSuccessDialog.value = true
  }
})
</script>

<style scoped>
.content-actions-card {
  border-radius: 8px;
  overflow: hidden;
}

.v-card-title {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.875rem;
}

.v-btn {
  font-weight: 500;
  text-transform: none;
  height: 44px;
  border-radius: 8px;
}

/* Save Button - Green */
.save-btn {
  background-color: #28a745 !important;
  color: white !important;
}

.save-btn:hover {
  background-color: #218838 !important;
}

/* Regenerate Button - Purple */
.regenerate-btn {
  background-color: #6f42c1 !important;
  color: white !important;
}

.regenerate-btn:hover {
  background-color: #5a32a3 !important;
}

/* Video Button - Gray */
.video-btn {
  background-color: #6c757d !important;
  color: white !important;
}

.video-btn:hover {
  background-color: #545b62 !important;
}

.text-caption {
  line-height: 1.4;
}

.v-btn:disabled {
  opacity: 0.6 !important;
  background-color: #e9ecef !important;
  color: #6c757d !important;
}

.v-btn .v-icon {
  margin-right: 8px;
}
</style>