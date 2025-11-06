<template>
    <v-dialog v-model="modelValue" :max-width="maxWidth" :persistent="persistent" :scrim="true">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon :color="getIconColor()" :size="iconSize" class="mr-3">
                    {{ getIcon() }}
                </v-icon>
                <div class="flex-grow-1">
                    <h3 class="text-h6">{{ title }}</h3>
                    <p v-if="subtitle" class="text-caption text-medium-emphasis mb-0">
                        {{ subtitle }}
                    </p>
                </div>
                <v-btn v-if="!persistent" icon="mdi-close" variant="text" size="small" @click="handleCancel" />
            </v-card-title>

            <v-divider />

            <v-card-text class="py-4">
                <!-- Main message -->
                <div class="mb-4">
                    <p class="text-body-1">{{ message }}</p>
                </div>

                <!-- Warning/Info content -->
                <div v-if="warning || info" class="mb-4">
                    <v-alert :type="warning ? 'warning' : 'info'" variant="tonal" density="compact">
                        <template #title>
                            {{ warning ? 'Warning' : 'Information' }}
                        </template>
                        {{ warning || info }}
                    </v-alert>
                </div>

                <!-- Details list -->
                <div v-if="details && details.length > 0" class="mb-4">
                    <h4 class="text-subtitle-2 mb-2">Details:</h4>
                    <v-list density="compact" class="bg-grey-lighten-5 rounded">
                        <v-list-item v-for="(detail, index) in details" :key="index" :prepend-icon="detail.icon"
                            class="text-body-2">
                            <v-list-item-title>{{ detail.text }}</v-list-item-title>
                            <v-list-item-subtitle v-if="detail.subtitle">
                                {{ detail.subtitle }}
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </div>

                <!-- Affected items -->
                <div v-if="affectedItems && affectedItems.length > 0" class="mb-4">
                    <h4 class="text-subtitle-2 mb-2">
                        {{ affectedItemsTitle || 'Affected Items' }} ({{ affectedItems.length }}):
                    </h4>
                    <v-chip-group column>
                        <v-chip v-for="item in affectedItems.slice(0, maxVisibleItems)" :key="item.id" size="small"
                            variant="tonal" :color="getItemColor(item)">
                            <v-icon v-if="item.icon" start size="small">
                                {{ item.icon }}
                            </v-icon>
                            {{ item.name || item.id }}
                        </v-chip>
                        <v-chip v-if="affectedItems.length > maxVisibleItems" size="small" variant="outlined"
                            color="grey">
                            +{{ affectedItems.length - maxVisibleItems }} more
                        </v-chip>
                    </v-chip-group>
                </div>

                <!-- Input field for confirmation -->
                <div v-if="requiresConfirmation" class="mb-4">
                    <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
                        <template #title>
                            Confirmation Required
                        </template>
                        Type <strong>{{ confirmationText }}</strong> to confirm this action.
                    </v-alert>
                    <v-text-field v-model="confirmationInput" :label="`Type '${confirmationText}' to confirm`"
                        variant="outlined" density="compact" :error="confirmationError"
                        :error-messages="confirmationError ? `Please type '${confirmationText}' exactly` : undefined"
                        @input="confirmationError = false" />
                </div>

                <!-- Checkbox confirmations -->
                <div v-if="checkboxes && checkboxes.length > 0" class="mb-4">
                    <div v-for="(checkbox, index) in checkboxes" :key="index" class="mb-2">
                        <v-checkbox v-model="checkboxStates[index]" :label="checkbox.label"
                            :color="checkbox.required ? 'error' : 'primary'" density="compact" hide-details />
                        <p v-if="checkbox.description" class="text-caption text-medium-emphasis ml-8 mt-1">
                            {{ checkbox.description }}
                        </p>
                    </div>
                </div>

                <!-- Progress indicator (when action is in progress) -->
                <div v-if="loading" class="mb-4">
                    <v-alert type="info" variant="tonal" density="compact">
                        <template #title>
                            {{ loadingTitle || 'Processing...' }}
                        </template>
                        <div class="d-flex align-center mt-2">
                            <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
                            <span class="text-body-2">
                                {{ loadingMessage || 'Please wait while we process your request.' }}
                            </span>
                        </div>
                    </v-alert>
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <!-- Primary action button -->
                <v-btn :color="getConfirmButtonColor()" :variant="getConfirmButtonVariant()" :prepend-icon="confirmIcon"
                    :loading="loading" :disabled="!canConfirm" @click="handleConfirm">
                    {{ confirmText }}
                </v-btn>

                <!-- Secondary action button -->
                <v-btn v-if="secondaryAction" :color="secondaryAction.color || 'secondary'" variant="text"
                    :prepend-icon="secondaryAction.icon" :disabled="loading" @click="handleSecondaryAction">
                    {{ secondaryAction.text }}
                </v-btn>

                <!-- Cancel button -->
                <v-btn variant="text" :disabled="loading" @click="handleCancel">
                    {{ cancelText }}
                </v-btn>

                <v-spacer />

                <!-- Additional info -->
                <div v-if="additionalInfo" class="text-caption text-medium-emphasis">
                    {{ additionalInfo }}
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface AffectedItem {
    id: string | number
    name?: string
    icon?: string
    status?: string
}

interface Detail {
    text: string
    subtitle?: string
    icon?: string
}

interface Checkbox {
    label: string
    description?: string
    required?: boolean
}

interface SecondaryAction {
    text: string
    icon?: string
    color?: string
    action: () => void
}

interface Props {
    modelValue: boolean
    type?: 'info' | 'warning' | 'error' | 'success' | 'destructive'
    title: string
    subtitle?: string
    message: string
    warning?: string
    info?: string
    details?: Detail[]
    affectedItems?: AffectedItem[]
    affectedItemsTitle?: string
    maxVisibleItems?: number
    confirmText?: string
    cancelText?: string
    confirmIcon?: string
    requiresConfirmation?: boolean
    confirmationText?: string
    checkboxes?: Checkbox[]
    loading?: boolean
    loadingTitle?: string
    loadingMessage?: string
    secondaryAction?: SecondaryAction
    persistent?: boolean
    maxWidth?: string | number
    iconSize?: string | number
    additionalInfo?: string
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
    (e: 'secondary-action'): void
}

const props = withDefaults(defineProps<Props>(), {
    type: 'info',
    maxVisibleItems: 5,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    requiresConfirmation: false,
    confirmationText: 'CONFIRM',
    persistent: false,
    maxWidth: 600,
    iconSize: 'large'
})

const emit = defineEmits<Emits>()

// Local state
const confirmationInput = ref('')
const confirmationError = ref(false)
const checkboxStates = ref<boolean[]>([])

// Computed
const modelValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const canConfirm = computed(() => {
    // Check confirmation text if required
    if (props.requiresConfirmation && confirmationInput.value !== props.confirmationText) {
        return false
    }

    // Check required checkboxes
    if (props.checkboxes) {
        const requiredCheckboxes = props.checkboxes
            .map((checkbox, index) => ({ checkbox, index }))
            .filter(({ checkbox }) => checkbox.required)

        if (requiredCheckboxes.some(({ index }) => !checkboxStates.value[index])) {
            return false
        }
    }

    return !props.loading
})

// Watch for dialog open/close to reset state
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        confirmationInput.value = ''
        confirmationError.value = false
        checkboxStates.value = new Array(props.checkboxes?.length || 0).fill(false)
    }
})

// Methods
const getIcon = (): string => {
    switch (props.type) {
        case 'warning':
            return 'mdi-alert'
        case 'error':
        case 'destructive':
            return 'mdi-alert-circle'
        case 'success':
            return 'mdi-check-circle'
        case 'info':
        default:
            return 'mdi-information'
    }
}

const getIconColor = (): string => {
    switch (props.type) {
        case 'warning':
            return 'warning'
        case 'error':
        case 'destructive':
            return 'error'
        case 'success':
            return 'success'
        case 'info':
        default:
            return 'info'
    }
}

const getConfirmButtonColor = (): string => {
    switch (props.type) {
        case 'destructive':
        case 'error':
            return 'error'
        case 'warning':
            return 'warning'
        case 'success':
            return 'success'
        case 'info':
        default:
            return 'primary'
    }
}

const getConfirmButtonVariant = (): string => {
    return props.type === 'destructive' || props.type === 'error' ? 'elevated' : 'elevated'
}

const getItemColor = (item: AffectedItem): string => {
    if (item.status) {
        switch (item.status) {
            case 'COMPLETED':
                return 'success'
            case 'FAILED':
                return 'error'
            case 'PROCESSING':
                return 'warning'
            case 'PENDING':
                return 'info'
            default:
                return 'grey'
        }
    }
    return 'primary'
}

const handleConfirm = () => {
    if (props.requiresConfirmation && confirmationInput.value !== props.confirmationText) {
        confirmationError.value = true
        return
    }

    emit('confirm')
}

const handleCancel = () => {
    emit('cancel')
}

const handleSecondaryAction = () => {
    if (props.secondaryAction?.action) {
        props.secondaryAction.action()
    }
    emit('secondary-action')
}
</script>

<style scoped>
.v-list-item {
    min-height: 32px;
}
</style>