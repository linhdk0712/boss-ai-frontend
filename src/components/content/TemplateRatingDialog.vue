<template>
    <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
        <v-card v-if="template">
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-star</v-icon>
                Rate Template
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pt-4">
                <!-- Template Name -->
                <div class="text-h6 mb-4">{{ template.name }}</div>

                <!-- Current Rating -->
                <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">Current Rating</div>
                    <div class="d-flex align-center">
                        <v-rating :model-value="template.averageRating" readonly density="compact" color="warning"
                            half-increments />
                        <span class="ms-2 text-body-2">{{ template.averageRating.toFixed(1) }} ({{ template.usageCount
                            }} uses)</span>
                    </div>
                </div>

                <!-- Your Rating -->
                <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-2">Your Rating</div>
                    <v-rating v-model="rating" hover size="large" color="warning" active-color="warning" />
                    <div v-if="rating > 0" class="text-caption text-medium-emphasis mt-1">
                        {{ getRatingLabel(rating) }}
                    </div>
                </div>

                <!-- Feedback -->
                <v-textarea v-model="feedback" label="Feedback (Optional)"
                    placeholder="Share your thoughts about this template..." variant="outlined" rows="4" counter="500"
                    :rules="[v => !v || v.length <= 500 || 'Feedback must be 500 characters or less']" />

                <!-- Error Message -->
                <v-alert v-if="error" type="error" variant="tonal" class="mt-3" closable @click:close="error = null">
                    {{ error }}
                </v-alert>
            </v-card-text>

            <v-divider />

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)"> Cancel </v-btn>
                <v-btn color="primary" variant="flat" :disabled="rating === 0 || (feedback && feedback.length > 500)"
                    :loading="loading" @click="handleSubmit">
                    Submit Rating
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
    submit: [rating: number, feedback?: string]
}>()

const rating = ref(0)
const feedback = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const getRatingLabel = (value: number): string => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
    return labels[value] || ''
}

const handleSubmit = () => {
    if (rating.value === 0) {
        error.value = 'Please select a rating'
        return
    }

    if (feedback.value && feedback.value.length > 500) {
        error.value = 'Feedback must be 500 characters or less'
        return
    }

    emit('submit', rating.value, feedback.value || undefined)
}

// Reset form when dialog closes
watch(
    () => props.modelValue,
    newValue => {
        if (!newValue) {
            rating.value = 0
            feedback.value = ''
            error.value = null
            loading.value = false
        }
    }
)
</script>
