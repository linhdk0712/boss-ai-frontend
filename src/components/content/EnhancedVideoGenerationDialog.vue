<template>
    <v-dialog :model-value="modelValue" max-width="900" persistent scrollable
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2" color="primary">mdi-video-plus</v-icon>
                Generate Video with Template
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" :disabled="loading" @click="handleClose" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-0">
                <v-stepper v-model="currentStep" alt-labels>
                    <v-stepper-header>
                        <v-stepper-item value="1" title="Select Template" />
                        <v-divider />
                        <v-stepper-item value="2" title="Customize" />
                        <v-divider />
                        <v-stepper-item value="3" title="Review & Generate" />
                    </v-stepper-header>

                    <v-stepper-window>
                        <!-- Step 1: Template Selection -->
                        <v-stepper-window-item value="1">
                            <div class="pa-4">
                                <VideoTemplateLibrary :show-create-button="false" @use-template="handleTemplateSelect"
                                    @template-selected="selectedTemplate = $event" />
                            </div>
                        </v-stepper-window-item>

                        <!-- Step 2: Customization -->
                        <v-stepper-window-item value="2">
                            <div class="pa-4">
                                <v-alert v-if="!selectedTemplate" type="warning" variant="tonal" class="mb-4">
                                    Please select a template first
                                </v-alert>

                                <div v-if="selectedTemplate">
                                    <!-- Template Info -->
                                    <v-card variant="outlined" class="mb-4">
                                        <v-card-title class="text-subtitle-1">
                                            Selected Template: {{ selectedTemplate.name }}
                                        </v-card-title>
                                        <v-card-text>
                                            <v-chip-group>
                                                <v-chip size="small" variant="tonal">{{ selectedTemplate.category
                                                    }}</v-chip>
                                                <v-chip size="small" variant="tonal">{{ selectedTemplate.styleName
                                                    }}</v-chip>
                                                <v-chip size="small" variant="tonal">{{ selectedTemplate.aspectRatio
                                                    }}</v-chip>
                                            </v-chip-group>
                                        </v-card-text>
                                    </v-card>

                                    <!-- Customization Options -->
                                    <v-row>
                                        <v-col cols="12">
                                            <v-text-field v-model="videoConfig.title" label="Video Title"
                                                variant="outlined" density="compact" :disabled="loading" />
                                        </v-col>

                                        <!-- Branding Customization -->
                                        <v-col cols="12">
                                            <h4 class="text-subtitle-2 mb-2">Branding (Optional)</h4>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="videoConfig.logoUrl" label="Logo URL"
                                                variant="outlined" density="compact" :disabled="loading"
                                                :placeholder="selectedTemplate.logoUrl" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-select v-model="videoConfig.logoPosition" :items="logoPositions"
                                                label="Logo Position" variant="outlined" density="compact"
                                                :disabled="loading" />
                                        </v-col>

                                        <!-- Color Customization -->
                                        <v-col cols="12" md="4">
                                            <v-text-field v-model="videoConfig.primaryColor" label="Primary Color"
                                                variant="outlined" density="compact" type="color" :disabled="loading" />
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field v-model="videoConfig.secondaryColor" label="Secondary Color"
                                                variant="outlined" density="compact" type="color" :disabled="loading" />
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field v-model="videoConfig.accentColor" label="Accent Color"
                                                variant="outlined" density="compact" type="color" :disabled="loading" />
                                        </v-col>

                                        <!-- Duration and Format -->
                                        <v-col cols="12">
                                            <h4 class="text-subtitle-2 mb-2">Duration & Format</h4>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-slider v-model="videoConfig.duration"
                                                :min="selectedTemplate.minDuration || 15"
                                                :max="selectedTemplate.maxDuration || 180" :step="5"
                                                label="Duration (seconds)" thumb-label :disabled="loading" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-select v-model="videoConfig.aspectRatio" :items="aspectRatios"
                                                label="Aspect Ratio" variant="outlined" density="compact"
                                                :disabled="loading" />
                                        </v-col>

                                        <!-- Voice and Audio -->
                                        <v-col cols="12">
                                            <h4 class="text-subtitle-2 mb-2">Voice & Audio</h4>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-switch v-model="videoConfig.voiceOverEnabled" label="Enable Voice Over"
                                                color="primary" :disabled="loading" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-switch v-model="videoConfig.backgroundMusicEnabled"
                                                label="Enable Background Music" color="primary" :disabled="loading" />
                                        </v-col>
                                        <v-col v-if="videoConfig.voiceOverEnabled" cols="12" md="6">
                                            <v-select v-model="videoConfig.voiceType" :items="voiceTypes"
                                                label="Voice Type" variant="outlined" density="compact"
                                                :disabled="loading" />
                                        </v-col>
                                        <v-col v-if="videoConfig.backgroundMusicEnabled" cols="12" md="6">
                                            <v-slider v-model="videoConfig.musicVolume" :min="0" :max="100"
                                                label="Music Volume" thumb-label :disabled="loading" />
                                        </v-col>
                                    </v-row>
                                </div>
                            </div>
                        </v-stepper-window-item>

                        <!-- Step 3: Review & Generate -->
                        <v-stepper-window-item value="3">
                            <div class="pa-4">
                                <v-alert type="info" variant="tonal" class="mb-4">
                                    <v-alert-title>Ready to Generate</v-alert-title>
                                    Review your configuration and click Generate to start video creation.
                                </v-alert>

                                <!-- Configuration Summary -->
                                <v-card variant="outlined" class="mb-4">
                                    <v-card-title class="text-subtitle-1">Configuration Summary</v-card-title>
                                    <v-card-text>
                                        <v-list density="compact">
                                            <v-list-item>
                                                <v-list-item-title>Template</v-list-item-title>
                                                <v-list-item-subtitle>{{ selectedTemplate?.name
                                                    }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title>Title</v-list-item-title>
                                                <v-list-item-subtitle>{{ videoConfig.title }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title>Duration</v-list-item-title>
                                                <v-list-item-subtitle>{{ videoConfig.duration }}
                                                    seconds</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title>Aspect Ratio</v-list-item-title>
                                                <v-list-item-subtitle>{{ videoConfig.aspectRatio
                                                    }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title>Voice Over</v-list-item-title>
                                                <v-list-item-subtitle>{{ videoConfig.voiceOverEnabled ? 'Enabled' :
                                                    'Disabled' }}</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title>Background Music</v-list-item-title>
                                                <v-list-item-subtitle>{{ videoConfig.backgroundMusicEnabled ? 'Enabled'
                                                    : 'Disabled' }}</v-list-item-subtitle>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                </v-card>

                                <!-- Processing Information -->
                                <v-alert type="warning" variant="tonal">
                                    <v-alert-title>Processing Time</v-alert-title>
                                    Video generation typically takes 3-10 minutes. You'll receive a notification when
                                    ready.
                                </v-alert>
                            </div>
                        </v-stepper-window-item>
                    </v-stepper-window>
                </v-stepper>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-btn v-if="currentStep > 1" variant="text" @click="currentStep--">
                    Back
                </v-btn>
                <v-spacer />
                <v-btn variant="text" :disabled="loading" @click="handleClose">
                    Cancel
                </v-btn>
                <v-btn v-if="currentStep < 3" color="primary" variant="tonal" :disabled="!canProceed"
                    @click="currentStep++">
                    Next
                </v-btn>
                <v-btn v-if="currentStep === 3" color="primary" variant="flat" :loading="loading"
                    :disabled="!canGenerate" @click="handleGenerate">
                    <v-icon start>mdi-video-plus</v-icon>
                    Generate Video
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VideoTemplateLibrary from './VideoTemplateLibrary.vue'
import type { VideoTemplate } from '@/services/videoTemplateService'

// Props
const props = defineProps<{
    modelValue: boolean
    contentId?: number
    contentText?: string
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'close': []
    'video-started': [config: any]
}>()

// State
const currentStep = ref(1)
const selectedTemplate = ref<VideoTemplate | null>(null)
const loading = ref(false)

const videoConfig = ref({
    title: '',
    logoUrl: '',
    logoPosition: 'top-right',
    primaryColor: '#1E3A8A',
    secondaryColor: '#3B82F6',
    accentColor: '#60A5FA',
    duration: 60,
    aspectRatio: '16:9',
    voiceOverEnabled: true,
    voiceType: 'neutral',
    backgroundMusicEnabled: false,
    musicVolume: 30
})

// Data
const logoPositions = [
    { title: 'Top Left', value: 'top-left' },
    { title: 'Top Right', value: 'top-right' },
    { title: 'Bottom Left', value: 'bottom-left' },
    { title: 'Bottom Right', value: 'bottom-right' },
    { title: 'Center', value: 'center' }
]

const aspectRatios = [
    { title: '16:9 (Landscape)', value: '16:9' },
    { title: '9:16 (Portrait)', value: '9:16' },
    { title: '1:1 (Square)', value: '1:1' },
    { title: '4:3 (Standard)', value: '4:3' }
]

const voiceTypes = [
    { title: 'Neutral', value: 'neutral' },
    { title: 'Male', value: 'male' },
    { title: 'Female', value: 'female' }
]

// Computed
const canProceed = computed(() => {
    if (currentStep.value === 1) {
        return selectedTemplate.value !== null
    }
    if (currentStep.value === 2) {
        return videoConfig.value.title.trim().length > 0
    }
    return true
})

const canGenerate = computed(() => {
    return selectedTemplate.value !== null && videoConfig.value.title.trim().length > 0
})

// Methods
const handleTemplateSelect = (template: VideoTemplate) => {
    selectedTemplate.value = template

    // Pre-fill configuration from template
    videoConfig.value = {
        ...videoConfig.value,
        title: videoConfig.value.title || `Video - ${template.name}`,
        logoUrl: template.logoUrl || '',
        logoPosition: template.logoPosition || 'top-right',
        primaryColor: template.primaryColor || '#1E3A8A',
        secondaryColor: template.secondaryColor || '#3B82F6',
        accentColor: template.accentColor || '#60A5FA',
        duration: template.defaultDuration || 60,
        aspectRatio: template.aspectRatio || '16:9',
        voiceOverEnabled: template.voiceOverEnabled ?? true,
        voiceType: template.voiceType || 'neutral',
        backgroundMusicEnabled: template.backgroundMusicEnabled ?? false,
        musicVolume: template.musicVolume || 30
    }

    currentStep.value = 2
}

const handleGenerate = () => {
    if (!selectedTemplate.value) return

    loading.value = true

    const generationConfig = {
        templateId: selectedTemplate.value.id,
        contentId: props.contentId,
        content: props.contentText,
        ...videoConfig.value
    }

    emit('video-started', generationConfig)

    // Reset after a delay
    setTimeout(() => {
        loading.value = false
        handleClose()
    }, 1000)
}

const handleClose = () => {
    if (!loading.value) {
        currentStep.value = 1
        selectedTemplate.value = null
        emit('close')
    }
}

// Watch for dialog open/close
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        currentStep.value = 1
    }
})
</script>

<style scoped>
.v-stepper {
    box-shadow: none;
}
</style>
