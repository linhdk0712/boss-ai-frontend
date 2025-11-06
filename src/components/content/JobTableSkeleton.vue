<template>
    <div class="job-table-skeleton">
        <!-- Table header skeleton -->
        <div class="skeleton-header mb-4">
            <v-row>
                <v-col cols="12" md="6">
                    <v-skeleton-loader type="text" width="200" height="24" />
                </v-col>
                <v-col cols="12" md="6" class="text-right">
                    <v-skeleton-loader type="button" width="120" height="36" />
                </v-col>
            </v-row>
        </div>

        <!-- Filters skeleton -->
        <div class="skeleton-filters mb-4">
            <v-card variant="outlined">
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="6" md="3">
                            <v-skeleton-loader type="text" width="80" height="16" class="mb-2" />
                            <v-skeleton-loader type="text" width="100%" height="40" />
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-skeleton-loader type="text" width="100" height="16" class="mb-2" />
                            <v-skeleton-loader type="text" width="100%" height="40" />
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-skeleton-loader type="text" width="90" height="16" class="mb-2" />
                            <v-skeleton-loader type="text" width="100%" height="40" />
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-skeleton-loader type="text" width="60" height="16" class="mb-2" />
                            <v-skeleton-loader type="text" width="100%" height="40" />
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>

        <!-- Table skeleton -->
        <v-card>
            <v-card-text class="pa-0">
                <!-- Table header -->
                <div class="table-header pa-4 border-b">
                    <v-row no-gutters>
                        <v-col cols="1">
                            <v-skeleton-loader type="text" width="30" height="16" />
                        </v-col>
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="80" height="16" />
                        </v-col>
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="60" height="16" />
                        </v-col>
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="90" height="16" />
                        </v-col>
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="70" height="16" />
                        </v-col>
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="100" height="16" />
                        </v-col>
                        <v-col cols="1">
                            <v-skeleton-loader type="text" width="50" height="16" />
                        </v-col>
                    </v-row>
                </div>

                <!-- Table rows -->
                <div v-for="index in rowCount" :key="index" class="table-row pa-4 border-b"
                    :class="{ 'bg-grey-lighten-5': index % 2 === 0 }">
                    <v-row no-gutters align="center">
                        <!-- Job ID -->
                        <v-col cols="1">
                            <v-skeleton-loader type="text" width="40" height="16" />
                        </v-col>

                        <!-- Content Type -->
                        <v-col cols="2">
                            <v-skeleton-loader type="chip" width="80" height="24" />
                        </v-col>

                        <!-- Status -->
                        <v-col cols="2">
                            <v-skeleton-loader type="chip" width="70" height="24" />
                        </v-col>

                        <!-- Created At -->
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="120" height="16" />
                        </v-col>

                        <!-- Duration -->
                        <v-col cols="2">
                            <v-skeleton-loader type="text" width="60" height="16" />
                        </v-col>

                        <!-- Progress -->
                        <v-col cols="2">
                            <div class="d-flex align-center">
                                <v-skeleton-loader type="text" width="80" height="8" class="mr-2" />
                                <v-skeleton-loader type="text" width="30" height="16" />
                            </div>
                        </v-col>

                        <!-- Actions -->
                        <v-col cols="1">
                            <div class="d-flex">
                                <v-skeleton-loader type="button" width="32" height="32" class="mr-1" />
                                <v-skeleton-loader type="button" width="32" height="32" class="mr-1" />
                                <v-skeleton-loader type="button" width="32" height="32" />
                            </div>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>

            <!-- Pagination skeleton -->
            <v-divider />
            <div class="pa-4">
                <v-row align="center">
                    <v-col cols="12" sm="6">
                        <v-skeleton-loader type="text" width="150" height="16" />
                    </v-col>
                    <v-col cols="12" sm="6" class="text-right">
                        <div class="d-flex justify-end align-center">
                            <v-skeleton-loader type="button" width="32" height="32" class="mr-2" />
                            <v-skeleton-loader type="text" width="80" height="16" class="mr-2" />
                            <v-skeleton-loader type="button" width="32" height="32" />
                        </div>
                    </v-col>
                </v-row>
            </div>
        </v-card>
    </div>
</template>

<script setup lang="ts">
interface Props {
    rowCount?: number
    showFilters?: boolean
}

withDefaults(defineProps<Props>(), {
    rowCount: 10,
    showFilters: true
})
</script>

<style scoped>
.job-table-skeleton {
    animation: pulse 1.5s ease-in-out infinite;
}

.table-header {
    background-color: rgb(var(--v-theme-surface-variant));
}

.table-row {
    min-height: 64px;
}

.border-b {
    border-bottom: 1px solid rgb(var(--v-border-color));
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