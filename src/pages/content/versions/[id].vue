<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { contentService } from '@/services/contentService'
import { useContentVersioning } from '@/composables/useContentVersioning'
import { useJobNotifications } from '@/composables/useJobNotifications'
import type { ContentGenerationDto, ContentVersion } from '@/types/content'
import VersionHistoryTimeline from '@/components/content/VersionHistoryTimeline.vue'
import VersionComparisonDialog from '@/components/content/VersionComparisonDialog.vue'
import VersionPerformanceMetrics from '@/components/content/VersionPerformanceMetrics.vue'
import JobNotificationToast from '@/components/content/JobNotificationToast.vue'

definePage({
    name: 'content-versions-id',
    meta: {
        title: 'Version Management',
        requiresAuth: true,
        action: 'read',
        subject: 'Content'
    }
})

// Router
const route = useRoute()
const router = useRouter()

// Content ID from route params
const contentId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ? parseInt(params.id) : 0
})

// Local state
const content = ref<ContentGenerationDto | null>(null)
const isLoadingContent = ref(false)
const showComparisonDialog = ref(false)
const selectedVersionA = ref<ContentVersion | null>(null)
const selectedVersionB = ref<ContentVersion | null>(null)
const selectedVersion = ref<ContentVersion | null>(null)
const showVersionDialog = ref(false)
const activeTab = ref('history')

// Composables
const {
    loadVersionStatistics
} = useContentVersioning(contentId)

const { currentToast, showToast, hideCurrentToast } = useJobNotifications()

// Methods
const loadContent = async () => {
    try {
        isLoadingContent.value = true
        const response = await contentService.getContentById(contentId.value)

        if (response.errorCode === 'SUCCESS') {
            content.value = response.data
        }
    } catch (error) {
        console.error('Failed to load content:', error)
    } finally {
        isLoadingContent.value = false
    }
}

const handleVersionSelected = (version: ContentVersion) => {
    selectedVersion.value = version
    showVersionDialog.value = true
}

const handleCompareVersions = (versionA: ContentVersion, versionB: ContentVersion) => {
    selectedVersionA.value = versionA
    selectedVersionB.value = versionB
    showComparisonDialog.value = true
}

const handleVersionReverted = () => {
    // Refresh content and statistics after revert
    loadContent()
    loadVersionStatistics()
}

const handleComparisonVersionSelected = (version: ContentVersion) => {
    selectedVersion.value = version
    showVersionDialog.value = true
    showComparisonDialog.value = false
}

const goBack = () => {
    router.push({ name: 'content-list' })
}

// Lifecycle
onMounted(() => {
    loadContent()
})
</script>

<template>
    <div class="version-management-page">
        <!-- Page Header -->
        <div class="d-flex align-center mb-6">
            <v-btn icon="tabler-arrow-left" variant="text" @click="goBack" />

            <div class="ml-4">
                <h1 class="text-h4">Version Management</h1>
                <p v-if="content" class="text-body-1 text-medium-emphasis mb-0">
                    {{ content.title || 'Untitled Content' }}
                </p>
            </div>

            <v-spacer />

            <!-- Content Info -->
            <div v-if="content" class="text-right">
                <v-chip color="primary" variant="tonal" class="mb-1">
                    {{ content.contentType }}
                </v-chip>
                <br>
                <span class="text-body-2 text-medium-emphasis">
                    Current: v{{ content.currentVersion }}
                </span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingContent" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
            <p class="text-body-2 mt-4">Loading content details...</p>
        </div>

        <!-- Content Not Found -->
        <div v-else-if="!content" class="text-center py-8">
            <v-icon size="64" color="error">tabler-file-x</v-icon>
            <h3 class="text-h6 mt-4">Content Not Found</h3>
            <p class="text-body-2 text-medium-emphasis">
                The requested content could not be found.
            </p>
            <v-btn color="primary" @click="goBack">
                Go Back
            </v-btn>
        </div>

        <!-- Main Content -->
        <div v-else>
            <!-- Tabs -->
            <v-tabs v-model="activeTab" class="mb-6">
                <v-tab value="history">
                    <v-icon start>tabler-history</v-icon>
                    Version History
                </v-tab>
                <v-tab value="metrics">
                    <v-icon start>tabler-chart-bar</v-icon>
                    Performance Metrics
                </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
                <!-- Version History Tab -->
                <v-tabs-window-item value="history">
                    <v-row>
                        <v-col cols="12">
                            <VersionHistoryTimeline :content-id="contentId" @version-selected="handleVersionSelected"
                                @compare-versions="handleCompareVersions" @version-reverted="handleVersionReverted" />
                        </v-col>
                    </v-row>
                </v-tabs-window-item>

                <!-- Performance Metrics Tab -->
                <v-tabs-window-item value="metrics">
                    <v-row>
                        <v-col cols="12">
                            <VersionPerformanceMetrics :content-id="contentId" :show-trends="true" />
                        </v-col>
                    </v-row>
                </v-tabs-window-item>
            </v-tabs-window>
        </div>

        <!-- Version Comparison Dialog -->
        <VersionComparisonDialog v-model="showComparisonDialog" :content-id="contentId"
            :version-a="selectedVersionA || undefined" :version-b="selectedVersionB || undefined"
            @version-selected="handleComparisonVersionSelected" />

        <!-- Version Details Dialog -->
        <v-dialog v-model="showVersionDialog" max-width="800">
            <v-card v-if="selectedVersion">
                <v-card-title class="d-flex align-center">
                    <v-icon class="me-2">tabler-file-text</v-icon>
                    Version {{ selectedVersion.versionNumber }} Details
                    <v-spacer />
                    <v-btn icon="tabler-x" variant="text" @click="showVersionDialog = false" />
                </v-card-title>

                <v-card-text>
                    <!-- Version Info -->
                    <div class="mb-4">
                        <v-row>
                            <v-col cols="12" md="6">
                                <div class="text-body-2 mb-2">
                                    <strong>Created:</strong> {{ new Date(selectedVersion.createdAt).toLocaleString() }}
                                </div>
                                <div class="text-body-2 mb-2">
                                    <strong>Author:</strong> {{ selectedVersion.createdByUsername || 'Unknown' }}
                                </div>
                                <div class="text-body-2 mb-2">
                                    <strong>AI Provider:</strong> {{ selectedVersion.aiProvider }} ({{
                                        selectedVersion.aiModel }})
                                </div>
                            </v-col>
                            <v-col cols="12" md="6">
                                <div v-if="selectedVersion.tokensUsed" class="text-body-2 mb-2">
                                    <strong>Tokens Used:</strong> {{ selectedVersion.tokensUsed }}
                                </div>
                                <div v-if="selectedVersion.generationCost" class="text-body-2 mb-2">
                                    <strong>Cost:</strong> ${{ selectedVersion.generationCost.toFixed(4) }}
                                </div>
                                <div v-if="selectedVersion.processingTimeMs" class="text-body-2 mb-2">
                                    <strong>Processing Time:</strong> {{ selectedVersion.processingTimeMs }}ms
                                </div>
                            </v-col>
                        </v-row>
                    </div>

                    <!-- Performance Scores -->
                    <div v-if="selectedVersion.qualityScore || selectedVersion.readabilityScore || selectedVersion.seoScore"
                        class="mb-4">
                        <h4 class="text-subtitle-1 mb-2">Performance Scores</h4>
                        <div class="d-flex flex-wrap gap-2">
                            <v-chip v-if="selectedVersion.qualityScore"
                                :color="selectedVersion.qualityScore >= 8 ? 'success' : selectedVersion.qualityScore >= 6 ? 'warning' : 'error'"
                                variant="tonal">
                                Quality: {{ selectedVersion.qualityScore.toFixed(1) }}
                            </v-chip>
                            <v-chip v-if="selectedVersion.readabilityScore"
                                :color="selectedVersion.readabilityScore >= 8 ? 'success' : selectedVersion.readabilityScore >= 6 ? 'warning' : 'error'"
                                variant="tonal">
                                Readability: {{ selectedVersion.readabilityScore.toFixed(1) }}
                            </v-chip>
                            <v-chip v-if="selectedVersion.seoScore"
                                :color="selectedVersion.seoScore >= 8 ? 'success' : selectedVersion.seoScore >= 6 ? 'warning' : 'error'"
                                variant="tonal">
                                SEO: {{ selectedVersion.seoScore.toFixed(1) }}
                            </v-chip>
                            <v-chip v-if="selectedVersion.overallScore"
                                :color="selectedVersion.overallScore >= 8 ? 'success' : selectedVersion.overallScore >= 6 ? 'warning' : 'error'"
                                variant="flat">
                                Overall: {{ selectedVersion.overallScore.toFixed(1) }}
                            </v-chip>
                        </div>
                    </div>

                    <!-- Content Preview -->
                    <div>
                        <h4 class="text-subtitle-1 mb-2">Content Preview</h4>
                        <v-card variant="outlined">
                            <v-card-text>
                                <div class="content-preview">
                                    {{ selectedVersion.content }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showVersionDialog = false">
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Notification Toast -->
        <JobNotificationToast :notification="currentToast" :show="showToast" :timeout="5000"
            @close="hideCurrentToast" />
    </div>
</template>

<style scoped>
.version-management-page {
    padding: 24px;
}

.content-preview {
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
}
</style>