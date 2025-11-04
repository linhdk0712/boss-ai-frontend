import { ref, computed, type Ref } from 'vue'
import { versionService } from '@/services/versionService'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type {
    ContentVersion,
    ContentVersionComparison,
    VersionStatistics,
    VersionBranch,
    CreateVersionBranchRequest,
    VersionTagRequest,
    PaginatedResponse
} from '@/types/content'

export function useContentVersioning(contentId?: Ref<number> | number) {
    const { handleApiError } = useErrorHandler()

    // Reactive state
    const versions = ref<ContentVersion[]>([])
    const currentVersion = ref<ContentVersion | null>(null)
    const versionComparison = ref<ContentVersionComparison | null>(null)
    const versionStatistics = ref<VersionStatistics | null>(null)
    const branches = ref<VersionBranch[]>([])
    const tags = ref<string[]>([])
    const sideBySideComparison = ref<Record<string, any> | null>(null)

    // Loading states
    const isLoadingVersions = ref(false)
    const isLoadingComparison = ref(false)
    const isLoadingStatistics = ref(false)
    const isReverting = ref(false)
    const isCreatingBranch = ref(false)
    const isTagging = ref(false)

    // Pagination
    const currentPage = ref(0)
    const pageSize = ref(20)
    const totalVersions = ref(0)
    const totalPages = ref(0)

    // Computed properties
    const contentIdValue = computed(() => {
        return typeof contentId === 'number' ? contentId : contentId?.value
    })

    const latestVersion = computed(() => {
        return versions.value.find(v => v.isLatestVersion) || versions.value[0]
    })

    const hasMultipleVersions = computed(() => {
        return versions.value.length > 1
    })

    const canCompareVersions = computed(() => {
        return versions.value.length >= 2
    })

    // Methods
    const loadVersionHistory = async (page = 0, size = 20, sortBy = 'version') => {
        if (!contentIdValue.value) return

        try {
            isLoadingVersions.value = true
            const response = await versionService.getVersionHistoryWithSorting(
                contentIdValue.value,
                page,
                size,
                sortBy
            )

            if (response.errorCode === 'SUCCESS') {
                versions.value = response.data.data
                currentPage.value = response.data.pagination.page
                pageSize.value = response.data.pagination.size
                totalVersions.value = response.data.pagination.total
                totalPages.value = response.data.pagination.totalPages
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isLoadingVersions.value = false
        }
    }

    const loadVersion = async (versionNumber: number) => {
        if (!contentIdValue.value) return

        try {
            const response = await versionService.getVersion(contentIdValue.value, versionNumber)

            if (response.errorCode === 'SUCCESS') {
                currentVersion.value = response.data
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        }

        return null
    }

    const revertToVersion = async (versionNumber: number) => {
        if (!contentIdValue.value) return null

        try {
            isReverting.value = true
            const response = await versionService.revertToVersion(contentIdValue.value, versionNumber)

            if (response.errorCode === 'SUCCESS') {
                // Refresh version history after revert
                await loadVersionHistory(currentPage.value, pageSize.value)
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isReverting.value = false
        }

        return null
    }

    const loadVersionStatistics = async () => {
        if (!contentIdValue.value) return

        try {
            isLoadingStatistics.value = true
            const response = await versionService.getVersionStatistics(contentIdValue.value)

            if (response.errorCode === 'SUCCESS') {
                versionStatistics.value = response.data
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isLoadingStatistics.value = false
        }
    }

    const compareVersions = async (versionA: number, versionB: number) => {
        if (!contentIdValue.value) return null

        try {
            isLoadingComparison.value = true
            const response = await versionService.compareVersions(contentIdValue.value, versionA, versionB)

            if (response.errorCode === 'SUCCESS') {
                versionComparison.value = response.data
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isLoadingComparison.value = false
        }

        return null
    }

    const getSideBySideComparison = async (versionA: number, versionB: number) => {
        if (!contentIdValue.value) return null

        try {
            const response = await versionService.getSideBySideComparison(
                contentIdValue.value,
                versionA,
                versionB
            )

            if (response.errorCode === 'SUCCESS') {
                sideBySideComparison.value = response.data
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        }

        return null
    }

    const loadBranches = async () => {
        if (!contentIdValue.value) return

        try {
            const response = await versionService.getContentBranches(contentIdValue.value)

            if (response.errorCode === 'SUCCESS') {
                branches.value = response.data
            }
        } catch (error: any) {
            handleApiError(error)
        }
    }

    const loadTags = async () => {
        if (!contentIdValue.value) return

        try {
            const response = await versionService.getContentTags(contentIdValue.value)

            if (response.errorCode === 'SUCCESS') {
                tags.value = response.data
            }
        } catch (error: any) {
            handleApiError(error)
        }
    }

    const createBranch = async (request: CreateVersionBranchRequest) => {
        if (!contentIdValue.value) return null

        try {
            isCreatingBranch.value = true
            const response = await versionService.createVersionBranch(contentIdValue.value, request)

            if (response.errorCode === 'SUCCESS') {
                // Refresh branches after creation
                await loadBranches()
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isCreatingBranch.value = false
        }

        return null
    }

    const tagVersion = async (versionNumber: number, request: VersionTagRequest) => {
        if (!contentIdValue.value) return null

        try {
            isTagging.value = true
            const response = await versionService.tagVersion(contentIdValue.value, versionNumber, request)

            if (response.errorCode === 'SUCCESS') {
                // Refresh tags and version history after tagging
                await Promise.all([
                    loadTags(),
                    loadVersionHistory(currentPage.value, pageSize.value)
                ])
                return response.data
            }
        } catch (error: any) {
            handleApiError(error)
        } finally {
            isTagging.value = false
        }

        return null
    }

    const applyCleanupPolicies = async () => {
        if (!contentIdValue.value) return

        try {
            await versionService.applyCleanupPolicies(contentIdValue.value)
            // Refresh version history after cleanup
            await loadVersionHistory(currentPage.value, pageSize.value)
        } catch (error: any) {
            handleApiError(error)
        }
    }

    // Pagination methods
    const nextPage = async () => {
        if (currentPage.value < totalPages.value - 1) {
            await loadVersionHistory(currentPage.value + 1, pageSize.value)
        }
    }

    const previousPage = async () => {
        if (currentPage.value > 0) {
            await loadVersionHistory(currentPage.value - 1, pageSize.value)
        }
    }

    const goToPage = async (page: number) => {
        if (page >= 0 && page < totalPages.value) {
            await loadVersionHistory(page, pageSize.value)
        }
    }

    return {
        // State
        versions,
        currentVersion,
        versionComparison,
        versionStatistics,
        branches,
        tags,
        sideBySideComparison,

        // Loading states
        isLoadingVersions,
        isLoadingComparison,
        isLoadingStatistics,
        isReverting,
        isCreatingBranch,
        isTagging,

        // Pagination
        currentPage,
        pageSize,
        totalVersions,
        totalPages,

        // Computed
        latestVersion,
        hasMultipleVersions,
        canCompareVersions,

        // Methods
        loadVersionHistory,
        loadVersion,
        revertToVersion,
        loadVersionStatistics,
        compareVersions,
        getSideBySideComparison,
        loadBranches,
        loadTags,
        createBranch,
        tagVersion,
        applyCleanupPolicies,

        // Pagination methods
        nextPage,
        previousPage,
        goToPage
    }
}