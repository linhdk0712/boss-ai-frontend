<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <h1>Content Generation Debug</h1>

                <!-- Simple textarea test -->
                <v-card class="mb-4">
                    <v-card-title>Simple Textarea Test</v-card-title>
                    <v-card-text>
                        <v-textarea v-model="simpleText" label="Simple Test" placeholder="Type here to test..."
                            variant="outlined" rows="3" />
                        <p>Value: {{ simpleText }}</p>
                    </v-card-text>
                </v-card>

                <!-- Form state debug -->
                <v-card class="mb-4">
                    <v-card-title>Form State Debug</v-card-title>
                    <v-card-text>
                        <pre>{{ JSON.stringify(debugForm, null, 2) }}</pre>
                    </v-card-text>
                </v-card>

                <!-- Configuration test -->
                <v-card class="mb-4">
                    <v-card-title>Configuration Test</v-card-title>
                    <v-card-text>
                        <v-select v-model="debugForm.contentType" :items="contentTypes" label="Content Type"
                            variant="outlined" />
                        <v-select v-model="debugForm.language" :items="languages" label="Language" variant="outlined" />
                    </v-card-text>
                </v-card>

                <!-- Content input test -->
                <v-card>
                    <v-card-title>Content Input Test</v-card-title>
                    <v-card-text>
                        <v-textarea v-model="debugForm.content" label="Content Ideas"
                            placeholder="Enter your content ideas..." variant="outlined" rows="6" counter="2000"
                            :rules="[rules.required, rules.maxLength(2000)]" />

                        <div class="mt-4">
                            <p><strong>Content Length:</strong> {{ debugForm.content.length }}</p>
                            <p><strong>Is Valid:</strong> {{ isValid }}</p>
                            <p><strong>Can Generate:</strong> {{ canGenerate }}</p>
                        </div>

                        <v-btn color="primary" :disabled="!canGenerate" @click="testGenerate" class="mt-4">
                            Test Generate
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Simple test data
const simpleText = ref('')

// Debug form
const debugForm = ref({
    content: '',
    contentType: '',
    language: 'vi'
})

// Test options
const contentTypes = [
    { title: 'Blog Post', value: 'blog' },
    { title: 'Social Media', value: 'social' },
    { title: 'Email', value: 'email' }
]

const languages = [
    { title: 'Vietnamese', value: 'vi' },
    { title: 'English', value: 'en' }
]

// Validation rules
const rules = {
    required: (value: string) => !!value?.trim() || 'This field is required',
    maxLength: (max: number) => (value: string) =>
        !value || value.length <= max || `Maximum ${max} characters allowed`
}

// Computed properties
const isValid = computed(() => {
    return debugForm.value.content.trim().length > 0 &&
        debugForm.value.contentType.length > 0 &&
        debugForm.value.language.length > 0
})

const canGenerate = computed(() => {
    return isValid.value && debugForm.value.content.length <= 2000
})

// Methods
const testGenerate = () => {
    console.log('Test generate clicked!')
    console.log('Form data:', debugForm.value)
    alert('Generate test successful! Check console for details.')
}

// Page metadata
definePage({
    name: 'content-debug',
    meta: {
        title: 'Content Debug',
        requiresAuth: true
    }
})
</script>