<template>
    <v-dialog :model-value="modelValue" max-width="800" @update:model-value="$emit('update:modelValue', $event)">
        <v-card v-if="template">
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-file-document-outline</v-icon>
                {{ template.name }}
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pt-4">
                <!-- Template Info -->
                <v-row class="mb-4">
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Category</div>
                        <div class="text-body-1">{{ template.category }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Content Type</div>
                        <div class="text-body-1">{{ template.contentType }}</div>
                    </v-col>
                    <v-col v-if="template.industry" cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Industry</div>
                        <div class="text-body-1">{{ template.industry }}</div>
                    </v-col>
                    <v-col v-if="template.targetAudience" cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Target Audience</div>
                        <div class="text-body-1">{{ template.targetAudience }}</div>
                    </v-col>
                </v-row>

                <!-- Description -->
                <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Description</div>
                    <p class="text-body-2">{{ template.description || 'No description available' }}</p>
                </div>

                <!-- Tags -->
                <div v-if="template.tags && template.tags.length > 0" class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-2">Tags</div>
                    <v-chip v-for="tag in template.tags" :key="tag" size="small" variant="outlined" class="me-1 mb-1">
                        {{ tag }}
                    </v-chip>
                </div>

                <!-- Stats -->
                <v-row class="mb-4">
                    <v-col cols="6" md="3">
                        <v-card variant="tonal">
                            <v-card-text class="text-center">
                                <div class="text-h6">{{ template.averageRating.toFixed(1) }}</div>
                                <div class="text-caption">Rating</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="6" md="3">
                        <v-card variant="tonal">
                            <v-card-text class="text-center">
                                <div class="text-h6">{{ template.usageCount }}</div>
                                <div class="text-caption">Uses</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="6" md="3">
                        <v-card variant="tonal">
                            <v-card-text class="text-center">
                                <div class="text-h6">{{ template.successRate.toFixed(0) }}%</div>
                                <div class="text-caption">Success Rate</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="6" md="3">
                        <v-card variant="tonal">
                            <v-card-text class="text-center">
                                <div class="text-h6">
                                    <v-icon v-if="template.isSystemTemplate" color="primary">mdi-star-circle</v-icon>
                                    <v-icon v-else>mdi-account</v-icon>
                                </div>
                                <div class="text-caption">{{ template.isSystemTemplate ? 'System' : 'User' }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Prompt Template Preview -->
                <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-2">Prompt Template</div>
                    <v-card variant="outlined">
                        <v-card-text>
                            <pre class="text-body-2" style="white-space: pre-wrap; word-wrap: break-word">{{
                                template.promptTemplate
                            }}</pre>
                        </v-card-text>
                    </v-card>
                </div>

                <!-- Default Parameters -->
                <div v-if="Object.keys(template.defaultParams).length > 0" class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-2">Default Parameters</div>
                    <v-expansion-panels>
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                <v-icon class="me-2">mdi-cog</v-icon>
                                View Parameters ({{ Object.keys(template.defaultParams).length }})
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-list density="compact">
                                    <v-list-item v-for="(value, key) in template.defaultParams" :key="key">
                                        <v-list-item-title class="text-caption font-weight-bold">{{ key
                                            }}</v-list-item-title>
                                        <v-list-item-subtitle class="text-caption">{{ formatParamValue(value)
                                            }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>

                <!-- Custom Parameters Form -->
                <v-expansion-panels v-model="showCustomParams">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <v-icon class="me-2">mdi-tune</v-icon>
                            Customize Parameters (Optional)
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-alert type="info" variant="tonal" class="mb-3">
                                You can override default parameters or add new ones. Leave empty to use defaults.
                            </v-alert>
                            <v-textarea v-model="customParamsJson" label="Custom Parameters (JSON)"
                                placeholder='{"key": "value"}' variant="outlined" rows="4" :error-messages="jsonError"
                                @update:model-value="validateJson" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>

            <v-divider />

            <v-card-actions>
                <v-btn variant="text" @click="$emit('rate', template)">
                    <v-icon start>mdi-star-outline</v-icon>
                    Rate Template
                </v-btn>
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)"> Cancel </v-btn>
                <v-btn color="primary" variant="flat" :disabled="!!jsonError" @click="handleApply">
                    <v-icon start>mdi-check</v-icon>
                    Apply Template
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContentTemplate } from '@/services/templateService'

const props = defineProps<{
    modelValue: boolean
    template: ContentTemplate | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    apply: [template: ContentTemplate, customParams?: Record<string, any>]
    rate: [template: ContentTemplate]
}>()

const showCustomParams = ref<number | undefined>(undefined)
const customParamsJson = ref('')
const jsonError = ref<string | null>(null)

const formatParamValue = (value: any): string => {
    if (typeof value === 'object') {
        return JSON.stringify(value)
    }
    return String(value)
}

const validateJson = () => {
    if (!customParamsJson.value.trim()) {
        jsonError.value = null
        return
    }

    try {
        JSON.parse(customParamsJson.value)
        jsonError.value = null
    } catch (e) {
        jsonError.value = 'Invalid JSON format'
    }
}

const handleApply = () => {
    if (!props.template) return

    let customParams: Record<string, any> | undefined

    if (customParamsJson.value.trim()) {
        try {
            customParams = JSON.parse(customParamsJson.value)
        } catch (e) {
            jsonError.value = 'Invalid JSON format'
            return
        }
    }

    emit('apply', props.template, customParams)
}

// Reset form when dialog closes
watch(
    () => props.modelValue,
    newValue => {
        if (!newValue) {
            customParamsJson.value = ''
            jsonError.value = null
            showCustomParams.value = undefined
        }
    }
)
</script>

<style scoped>
pre {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
}
</style>
