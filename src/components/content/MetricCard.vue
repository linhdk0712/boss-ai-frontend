<template>
    <v-card variant="outlined" :color="color" class="h-100">
        <v-card-title class="d-flex align-center">
            <v-icon v-if="icon" class="me-2">{{ icon }}</v-icon>
            {{ title }}
        </v-card-title>

        <v-card-text>
            <div class="text-center">
                <div class="text-h4" :class="`text-${color}`">
                    {{ formatValue(value) }}
                </div>
                <div v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">
                    {{ subtitle }}
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
interface Props {
    title: string
    value: number
    icon?: string
    color?: string
    subtitle?: string
    decimals?: number
}

const props = withDefaults(defineProps<Props>(), {
    color: 'primary',
    decimals: 1
})

// Methods
const formatValue = (value: number) => {
    return value.toFixed(props.decimals)
}
</script>