<template>
    <div class="progress-indicator">
        <!-- Linear progress bar -->
        <div v-if="type === 'linear'" class="linear-progress">
            <div class="d-flex align-center justify-space-between mb-2">
                <div class="progress-info">
                    <span class="text-body-2 font-weight-medium">{{ title }}</span>
                    <span v-if="stage" class="text-caption text-medium-emphasis ml-2">
                        {{ stage }}
                    </span>
                </div>
                <div class="progress-stats">
                    <span class="text-caption">{{ Math.round(progress) }}%</span>
                    <span v-if="estimatedTimeRemaining" class="text-caption text-medium-emphasis ml-2">
                        {{ formatTimeRemaining(estimatedTimeRemaining) }} left
                    </span>
                </div>
            </div>

            <v-progress-linear :model-value="progress" :color="getProgressColor()" :bg-color="getBgColor()" height="8"
                rounded :indeterminate="indeterminate" :striped="striped" />

            <div v-if="message" class="mt-2">
                <span class="text-caption text-medium-emphasis">{{ message }}</span>
            </div>
        </div>

        <!-- Circular progress -->
        <div v-else-if="type === 'circular'" class="circular-progress text-center">
            <v-progress-circular :model-value="progress" :size="size" :width="width" :color="getProgressColor()"
                :indeterminate="indeterminate">
                <template v-if="!indeterminate">
                    <div class="progress-text">
                        <div class="text-h6 font-weight-bold">{{ Math.round(progress) }}%</div>
                        <div v-if="stage" class="text-caption">{{ stage }}</div>
                    </div>
                </template>
            </v-progress-circular>

            <div v-if="title" class="mt-3">
                <div class="text-body-2 font-weight-medium">{{ title }}</div>
                <div v-if="message" class="text-caption text-medium-emphasis mt-1">
                    {{ message }}
                </div>
                <div v-if="estimatedTimeRemaining" class="text-caption text-medium-emphasis mt-1">
                    {{ formatTimeRemaining(estimatedTimeRemaining) }} remaining
                </div>
            </div>
        </div>

        <!-- Step progress -->
        <div v-else-if="type === 'steps'" class="steps-progress">
            <div v-if="title" class="mb-4">
                <h4 class="text-subtitle-1 font-weight-medium">{{ title }}</h4>
                <p v-if="message" class="text-body-2 text-medium-emphasis mb-0">{{ message }}</p>
            </div>

            <v-stepper :model-value="currentStep" :items="steps" hide-actions flat :color="getProgressColor()">
                <template #item.icon="{ item, step }">
                    <v-icon v-if="step < currentStep" color="success" size="small">
                        mdi-check
                    </v-icon>
                    <v-icon v-else-if="step === currentStep" :color="getProgressColor()" size="small">
                        {{ item.icon || 'mdi-circle' }}
                    </v-icon>
                    <v-icon v-else color="grey-lighten-1" size="small">
                        mdi-circle-outline
                    </v-icon>
                </template>

                <template #item.title="{ item, step }">
                    <div :class="{
                        'text-medium-emphasis': step > currentStep,
                        'font-weight-medium': step <= currentStep
                    }">
                        {{ item.title }}
                        <div v-if="item.subtitle" class="text-caption text-medium-emphasis">
                            {{ item.subtitle }}
                        </div>
                    </div>
                </template>
            </v-stepper>

            <div v-if="estimatedTimeRemaining" class="mt-3 text-center">
                <span class="text-caption text-medium-emphasis">
                    Estimated time remaining: {{ formatTimeRemaining(estimatedTimeRemaining) }}
                </span>
            </div>
        </div>

        <!-- Skeleton loader -->
        <div v-else-if="type === 'skeleton'" class="skeleton-progress">
            <div class="d-flex align-center justify-space-between mb-2">
                <v-skeleton-loader type="text" width="150" height="16" />
                <v-skeleton-loader type="text" width="50" height="16" />
            </div>
            <v-skeleton-loader type="text" width="100%" height="8" class="rounded" />
            <div class="mt-2">
                <v-skeleton-loader type="text" width="200" height="12" />
            </div>
        </div>

        <!-- Pulse indicator for indeterminate operations -->
        <div v-else-if="type === 'pulse'" class="pulse-progress text-center">
            <div class="pulse-container">
                <div class="pulse-dot" :class="getProgressColor()"></div>
                <div class="pulse-ring" :class="getProgressColor()"></div>
            </div>

            <div v-if="title" class="mt-3">
                <div class="text-body-2 font-weight-medium">{{ title }}</div>
                <div v-if="message" class="text-caption text-medium-emphasis mt-1">
                    {{ message }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Step {
    title: string
    subtitle?: string
    icon?: string
    value: string
}

interface Props {
    type?: 'linear' | 'circular' | 'steps' | 'skeleton' | 'pulse'
    progress?: number
    title?: string
    message?: string
    stage?: string
    estimatedTimeRemaining?: number
    indeterminate?: boolean
    striped?: boolean
    size?: number
    width?: number
    color?: string
    steps?: Step[]
    currentStep?: number
}

const props = withDefaults(defineProps<Props>(), {
    type: 'linear',
    progress: 0,
    indeterminate: false,
    striped: false,
    size: 64,
    width: 4,
    color: 'primary',
    currentStep: 1
})

// Computed
const getProgressColor = (): string => {
    if (props.color) return props.color

    // Auto color based on progress
    if (props.progress >= 100) return 'success'
    if (props.progress >= 75) return 'info'
    if (props.progress >= 50) return 'warning'
    if (props.progress >= 25) return 'primary'
    return 'grey'
}

const getBgColor = (): string => {
    return `${getProgressColor()}-lighten-4`
}

// Methods
const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds < 1000) {
        return 'Less than a second'
    }

    const seconds = Math.floor(milliseconds / 1000)
    if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 60) {
        if (remainingSeconds === 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        }
        return `${minutes}m ${remainingSeconds}s`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    return `${hours}h ${remainingMinutes}m`
}
</script>

<style scoped>
.progress-indicator {
    width: 100%;
}

.linear-progress {
    width: 100%;
}

.circular-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.progress-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.steps-progress {
    width: 100%;
}

.pulse-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pulse-container {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pulse-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: rgb(var(--v-theme-primary));
    position: relative;
    z-index: 2;
}

.pulse-ring {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgb(var(--v-theme-primary));
    opacity: 0.3;
    animation: pulse-ring 2s ease-out infinite;
}

.pulse-dot.success {
    background-color: rgb(var(--v-theme-success));
}

.pulse-ring.success {
    border-color: rgb(var(--v-theme-success));
}

.pulse-dot.warning {
    background-color: rgb(var(--v-theme-warning));
}

.pulse-ring.warning {
    border-color: rgb(var(--v-theme-warning));
}

.pulse-dot.error {
    background-color: rgb(var(--v-theme-error));
}

.pulse-ring.error {
    border-color: rgb(var(--v-theme-error));
}

.pulse-dot.info {
    background-color: rgb(var(--v-theme-info));
}

.pulse-ring.info {
    border-color: rgb(var(--v-theme-info));
}

@keyframes pulse-ring {
    0% {
        transform: scale(0.3);
        opacity: 0.5;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}

.skeleton-progress {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}
</style>