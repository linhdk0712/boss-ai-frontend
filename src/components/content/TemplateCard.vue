<template>
    <v-card class="template-card" hover @click="$emit('select', template)">
        <v-card-title class="d-flex align-center">
            <v-icon v-if="template.isSystemTemplate" class="me-2" color="primary">mdi-star-circle</v-icon>
            <span class="text-truncate">{{ template.name }}</span>
            <v-spacer />
            <v-chip v-if="template.isPublic" size="x-small" color="success" variant="flat">
                Public
            </v-chip>
        </v-card-title>

        <v-card-subtitle class="text-truncate">
            {{ template.category }} • {{ template.contentType }}
        </v-card-subtitle>

        <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-3" style="min-height: 60px">
                {{ truncateDescription(template.description) }}
            </p>

            <!-- Tags -->
            <div v-if="template.tags && template.tags.length > 0" class="mb-3">
                <v-chip v-for="tag in template.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined"
                    class="me-1 mb-1">
                    {{ tag }}
                </v-chip>
                <v-chip v-if="template.tags.length > 3" size="x-small" variant="text">
                    +{{ template.tags.length - 3 }}
                </v-chip>
            </div>

            <!-- Stats -->
            <v-row dense class="text-caption">
                <v-col cols="6">
                    <v-icon size="small" class="me-1">mdi-star</v-icon>
                    {{ template.averageRating.toFixed(1) }}
                </v-col>
                <v-col cols="6">
                    <v-icon size="small" class="me-1">mdi-account-multiple</v-icon>
                    {{ formatUsageCount(template.usageCount) }}
                </v-col>
                <v-col cols="6">
                    <v-icon size="small" class="me-1">mdi-check-circle</v-icon>
                    {{ template.successRate.toFixed(0) }}%
                </v-col>
                <v-col v-if="template.industry" cols="6">
                    <v-icon size="small" class="me-1">mdi-domain</v-icon>
                    {{ template.industry }}
                </v-col>
            </v-row>
        </v-card-text>

        <v-card-actions>
            <v-btn variant="text" size="small" prepend-icon="mdi-eye" @click.stop="$emit('preview', template)">
                Preview
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-star-outline" variant="text" size="small" @click.stop="$emit('rate', template)" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import type { ContentTemplate } from '@/services/templateService'

defineProps<{
    template: ContentTemplate
}>()

defineEmits<{
    select: [template: ContentTemplate]
    preview: [template: ContentTemplate]
    rate: [template: ContentTemplate]
}>()

const truncateDescription = (description?: string) => {
    if (!description) return 'No description available'
    return description.length > 100 ? description.substring(0, 100) + '...' : description
}

const formatUsageCount = (count: number) => {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k'
    }
    return count.toString()
}
</script>

<style scoped>
.template-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s;
}

.template-card:hover {
    transform: translateY(-4px);
}
</style>
