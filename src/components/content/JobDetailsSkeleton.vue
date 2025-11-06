<template>
    <div class="job-details-skeleton">
        <!-- Header skeleton -->
        <div class="mb-6">
            <v-skeleton-loader type="heading" width="300" height="32" class="mb-2" />
            <v-skeleton-loader type="text" width="200" height="16" />
        </div>

        <!-- Job info cards -->
        <v-row class="mb-6">
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title>
                        <v-skeleton-loader type="text" width="120" height="20" />
                    </v-card-title>
                    <v-card-text>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="80" height="14" class="mb-1" />
                            <v-skeleton-loader type="text" width="150" height="16" />
                        </div>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="60" height="14" class="mb-1" />
                            <v-skeleton-loader type="chip" width="80" height="24" />
                        </div>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="90" height="14" class="mb-1" />
                            <v-skeleton-loader type="text" width="180" height="16" />
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title>
                        <v-skeleton-loader type="text" width="100" height="20" />
                    </v-card-title>
                    <v-card-text>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="70" height="14" class="mb-1" />
                            <v-skeleton-loader type="text" width="120" height="16" />
                        </div>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="100" height="14" class="mb-1" />
                            <v-skeleton-loader type="text" width="80" height="16" />
                        </div>
                        <div class="mb-3">
                            <v-skeleton-loader type="text" width="80" height="14" class="mb-1" />
                            <v-skeleton-loader type="text" width="60" height="16" />
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Parameters section -->
        <v-card class="mb-6">
            <v-card-title>
                <v-skeleton-loader type="text" width="100" height="20" />
            </v-card-title>
            <v-card-text>
                <div class="mb-3">
                    <v-skeleton-loader type="text" width="100%" height="16" class="mb-2" />
                    <v-skeleton-loader type="text" width="80%" height="16" class="mb-2" />
                    <v-skeleton-loader type="text" width="90%" height="16" class="mb-2" />
                    <v-skeleton-loader type="text" width="70%" height="16" />
                </div>
            </v-card-text>
        </v-card>

        <!-- Content section -->
        <v-card class="mb-6">
            <v-card-title>
                <div class="d-flex align-center justify-space-between w-100">
                    <v-skeleton-loader type="text" width="150" height="20" />
                    <div class="d-flex">
                        <v-skeleton-loader type="button" width="80" height="32" class="mr-2" />
                        <v-skeleton-loader type="button" width="100" height="32" />
                    </div>
                </div>
            </v-card-title>
            <v-card-text>
                <!-- Content preview -->
                <div class="content-skeleton">
                    <v-skeleton-loader type="paragraph" class="mb-4" />
                    <v-skeleton-loader type="paragraph" class="mb-4" />
                    <v-skeleton-loader type="paragraph" class="mb-4" />
                    <v-skeleton-loader type="text" width="60%" height="16" />
                </div>
            </v-card-text>
        </v-card>

        <!-- Execution logs section -->
        <v-card>
            <v-card-title>
                <v-skeleton-loader type="text" width="120" height="20" />
            </v-card-title>
            <v-card-text>
                <div class="logs-skeleton">
                    <div v-for="index in 5" :key="index" class="log-entry mb-2 pa-2 rounded"
                        :class="getLogEntryClass(index)">
                        <div class="d-flex align-center mb-1">
                            <v-skeleton-loader type="text" width="120" height="12" class="mr-2" />
                            <v-skeleton-loader type="chip" width="60" height="20" />
                        </div>
                        <v-skeleton-loader type="text" :width="getLogEntryWidth(index)" height="14" />
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Action buttons skeleton -->
        <div class="mt-6 d-flex justify-end">
            <v-skeleton-loader type="button" width="80" height="36" class="mr-2" />
            <v-skeleton-loader type="button" width="100" height="36" class="mr-2" />
            <v-skeleton-loader type="button" width="120" height="36" />
        </div>
    </div>
</template>

<script setup lang="ts">
// Methods for varied skeleton appearance
const getLogEntryClass = (index: number): string => {
    const classes = ['bg-grey-lighten-5', 'bg-blue-lighten-5', 'bg-green-lighten-5', 'bg-orange-lighten-5', 'bg-red-lighten-5']
    return classes[index % classes.length]
}

const getLogEntryWidth = (index: number): string => {
    const widths = ['90%', '70%', '85%', '60%', '95%']
    return widths[index % widths.length]
}
</script>

<style scoped>
.job-details-skeleton {
    animation: pulse 1.5s ease-in-out infinite;
}

.content-skeleton {
    min-height: 200px;
}

.logs-skeleton {
    min-height: 150px;
}

.log-entry {
    border: 1px solid rgb(var(--v-border-color));
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}
</style>