<template>
    <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-share-variant</v-icon>
                Share Preset
            </v-card-title>

            <v-card-text>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">Preset to Share</div>
                    <v-card variant="tonal" class="pa-3">
                        <div class="font-weight-medium">{{ preset?.name }}</div>
                        <div v-if="preset?.description" class="text-caption text-medium-emphasis mt-1">
                            {{ preset.description }}
                        </div>
                    </v-card>
                </div>

                <v-select v-model="selectedWorkspace" :items="workspaces" item-title="name" item-value="id"
                    label="Select Workspace" placeholder="Choose a workspace to share with..." variant="outlined"
                    density="comfortable" :rules="[rules.required]" class="mb-4">
                    <template #prepend-inner>
                        <v-icon>mdi-account-group</v-icon>
                    </template>

                    <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template #prepend>
                                <v-avatar size="32" color="primary" variant="tonal">
                                    <v-icon size="20">mdi-account-group</v-icon>
                                </v-avatar>
                            </template>

                            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ item.raw.memberCount }} members
                            </v-list-item-subtitle>
                        </v-list-item>
                    </template>
                </v-select>

                <v-alert type="info" variant="tonal" density="compact">
                    <div class="text-caption">
                        All members of the selected workspace will be able to view and use this preset.
                    </div>
                </v-alert>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="handleCancel" :disabled="sharing">
                    Cancel
                </v-btn>
                <v-btn color="primary" @click="handleShare" :loading="sharing" :disabled="!selectedWorkspace">
                    Share
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { UserPreset } from '@/types/preset'

interface Workspace {
    id: number
    name: string
    memberCount: number
}

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    preset: {
        type: Object as PropType<UserPreset | null>,
        default: null
    },
    workspaces: {
        type: Array as PropType<Workspace[]>,
        default: () => []
    },
    sharing: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'share': [workspaceId: number]
}>()

const selectedWorkspace = ref<number | null>(null)

const rules = {
    required: (v: any) => !!v || 'Please select a workspace'
}

const handleShare = () => {
    if (selectedWorkspace.value) {
        emit('share', selectedWorkspace.value)
    }
}

const handleCancel = () => {
    emit('update:modelValue', false)
    selectedWorkspace.value = null
}
</script>
