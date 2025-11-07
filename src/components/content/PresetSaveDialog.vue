<template>
    <v-dialog :model-value="modelValue" max-width="600" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-content-save</v-icon>
                Save as Preset
            </v-card-title>

            <v-card-text>
                <v-form ref="formRef" @submit.prevent="handleSave">
                    <v-text-field v-model="presetName" label="Preset Name" placeholder="e.g., Blog Post Template"
                        :rules="[rules.required, rules.maxLength]" variant="outlined" density="comfortable" class="mb-4"
                        autofocus />

                    <v-textarea v-model="presetDescription" label="Description (Optional)"
                        placeholder="Describe what this preset is for..." :rules="[rules.descriptionMaxLength]"
                        variant="outlined" density="comfortable" rows="3" class="mb-4" />

                    <v-switch v-model="isDefault" label="Set as default preset" color="primary" density="comfortable"
                        class="mb-2" hide-details />

                    <v-alert v-if="isDefault" type="info" variant="tonal" density="compact" class="mt-2">
                        This preset will be automatically applied when you start a new content generation.
                    </v-alert>

                    <!-- Configuration Preview -->
                    <v-expansion-panels class="mt-4">
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                <v-icon class="me-2" size="20">mdi-eye</v-icon>
                                Preview Configuration
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-list density="compact">
                                    <v-list-item v-if="configuration.contentType">
                                        <template #prepend>
                                            <v-icon size="20">mdi-file-document</v-icon>
                                        </template>
                                        <v-list-item-title>Content Type</v-list-item-title>
                                        <v-list-item-subtitle>{{ configuration.contentType }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="configuration.language">
                                        <template #prepend>
                                            <v-icon size="20">mdi-translate</v-icon>
                                        </template>
                                        <v-list-item-title>Language</v-list-item-title>
                                        <v-list-item-subtitle>{{ configuration.language }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="configuration.industry">
                                        <template #prepend>
                                            <v-icon size="20">mdi-domain</v-icon>
                                        </template>
                                        <v-list-item-title>Industry</v-list-item-title>
                                        <v-list-item-subtitle>{{ configuration.industry }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="configuration.tone">
                                        <template #prepend>
                                            <v-icon size="20">mdi-message-text</v-icon>
                                        </template>
                                        <v-list-item-title>Tone</v-list-item-title>
                                        <v-list-item-subtitle>{{ configuration.tone }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="configuration.targetAudience">
                                        <template #prepend>
                                            <v-icon size="20">mdi-account-group</v-icon>
                                        </template>
                                        <v-list-item-title>Target Audience</v-list-item-title>
                                        <v-list-item-subtitle>{{ configuration.targetAudience }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="handleCancel" :disabled="saving">
                    Cancel
                </v-btn>
                <v-btn color="primary" @click="handleSave" :loading="saving">
                    Save Preset
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { PresetConfiguration } from '@/types/preset'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    configuration: {
        type: Object as PropType<PresetConfiguration>,
        required: true
    },
    saving: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'save': [data: { name: string; description?: string; isDefault: boolean }]
}>()

const formRef = ref()
const presetName = ref('')
const presetDescription = ref('')
const isDefault = ref(false)

const rules = {
    required: (v: string) => !!v || 'Preset name is required',
    maxLength: (v: string) => v.length <= 100 || 'Name must be less than 100 characters',
    descriptionMaxLength: (v: string) => !v || v.length <= 500 || 'Description must be less than 500 characters'
}

const handleSave = async () => {
    const { valid } = await formRef.value.validate()

    if (valid) {
        emit('save', {
            name: presetName.value,
            description: presetDescription.value || undefined,
            isDefault: isDefault.value
        })
    }
}

const handleCancel = () => {
    emit('update:modelValue', false)
    // Reset form
    presetName.value = ''
    presetDescription.value = ''
    isDefault.value = false
    formRef.value?.reset()
}
</script>
