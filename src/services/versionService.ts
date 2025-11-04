import { CONTENT } from '@/constants/apiEndpoints'
import { apiClient } from '@/plugins/axios'
import type {
    BaseResponse,
    PaginatedResponse,
    ContentVersion,
    ContentVersionComparison,
    VersionStatistics,
    VersionBranch,
    CreateVersionBranchRequest,
    VersionTagRequest
} from '@/types/content'

/**
 * Version Management Service
 * Handles API calls for content version management
 */
class VersionService {
    /**
     * Get version history for a content with pagination
     */
    async getVersionHistory(
        contentId: number,
        page = 0,
        size = 20
    ): Promise<BaseResponse<PaginatedResponse<ContentVersion>>> {
        const response = await apiClient.get(
            `${CONTENT.VERSIONS(contentId)}?page=${page}&size=${size}`
        )
        return response.data
    }

    /**
     * Get version history with custom sorting
     */
    async getVersionHistoryWithSorting(
        contentId: number,
        page = 0,
        size = 20,
        sortBy = 'version'
    ): Promise<BaseResponse<PaginatedResponse<ContentVersion>>> {
        const response = await apiClient.get(
            `${CONTENT.VERSION_SORTED(contentId)}?page=${page}&size=${size}&sortBy=${sortBy}`
        )
        return response.data
    }

    /**
     * Get a specific version by version number
     */
    async getVersion(contentId: number, versionNumber: number): Promise<BaseResponse<ContentVersion>> {
        const response = await apiClient.get(CONTENT.VERSION_BY_NUMBER(contentId, versionNumber))
        return response.data
    }

    /**
     * Revert content to a specific version
     */
    async revertToVersion(contentId: number, versionNumber: number): Promise<BaseResponse<ContentVersion>> {
        const response = await apiClient.post(CONTENT.VERSION_REVERT(contentId, versionNumber))
        return response.data
    }

    /**
     * Get version statistics for a content
     */
    async getVersionStatistics(contentId: number): Promise<BaseResponse<VersionStatistics>> {
        const response = await apiClient.get(CONTENT.VERSION_STATISTICS(contentId))
        return response.data
    }

    /**
     * Compare two content versions
     */
    async compareVersions(
        contentId: number,
        versionA: number,
        versionB: number
    ): Promise<BaseResponse<ContentVersionComparison>> {
        const response = await apiClient.get(
            `${CONTENT.VERSION_COMPARE(contentId)}?versionA=${versionA}&versionB=${versionB}`
        )
        return response.data
    }

    /**
     * Get side-by-side comparison for UI display
     */
    async getSideBySideComparison(
        contentId: number,
        versionA: number,
        versionB: number
    ): Promise<BaseResponse<Record<string, any>>> {
        const response = await apiClient.get(
            `${CONTENT.VERSION_COMPARE_SIDE_BY_SIDE(contentId)}?versionA=${versionA}&versionB=${versionB}`
        )
        return response.data
    }

    /**
     * Get all branches for a content
     */
    async getContentBranches(contentId: number): Promise<BaseResponse<VersionBranch[]>> {
        const response = await apiClient.get(CONTENT.VERSION_BRANCHES(contentId))
        return response.data
    }

    /**
     * Get all tags for a content
     */
    async getContentTags(contentId: number): Promise<BaseResponse<string[]>> {
        const response = await apiClient.get(CONTENT.VERSION_TAGS(contentId))
        return response.data
    }

    /**
     * Create a version branch from an existing version
     */
    async createVersionBranch(
        contentId: number,
        request: CreateVersionBranchRequest
    ): Promise<BaseResponse<ContentVersion>> {
        const response = await apiClient.post(`${CONTENT.VERSIONS(contentId)}/branch`, request)
        return response.data
    }

    /**
     * Tag and annotate a version
     */
    async tagVersion(
        contentId: number,
        versionNumber: number,
        request: VersionTagRequest
    ): Promise<BaseResponse<ContentVersion>> {
        const response = await apiClient.post(CONTENT.VERSION_TAG(contentId, versionNumber), request)
        return response.data
    }

    /**
     * Apply cleanup policies for a content
     */
    async applyCleanupPolicies(contentId: number): Promise<BaseResponse<void>> {
        const response = await apiClient.post(`${CONTENT.VERSIONS(contentId)}/cleanup`)
        return response.data
    }
}

export const versionService = new VersionService()