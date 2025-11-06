import { FLOW } from '@/constants/apiEndpoints'
import { apiClient } from '@/plugins/axios'
import type {
    BaseResponse,
    N8nNodeRunDto,
    N8nNodeRunFilter,
    N8nNodeRunStatistics,
    PaginatedN8nNodeRunResponse
} from '@/types/flow'

/**
 * Flow Service
 * Handles API calls for N8N node run management and monitoring
 */
class FlowService {
    /**
     * Get N8N node runs for the authenticated user
     */
    async getNodeRuns(params?: {
        page?: number
        size?: number
        userId?: number
    } & N8nNodeRunFilter): Promise<BaseResponse<N8nNodeRunDto[]>> {
        const queryParams = new URLSearchParams()

        if (params?.page !== undefined) queryParams.append('page', params.page.toString())
        if (params?.size !== undefined) queryParams.append('size', params.size.toString())
        if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString())
        if (params?.status?.length) queryParams.append('status', params.status.join(','))
        if (params?.workflowId) queryParams.append('workflowId', params.workflowId)
        if (params?.nodeType) queryParams.append('nodeType', params.nodeType)
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
        if (params?.search) queryParams.append('search', params.search)

        const url = queryParams.toString() ? `${FLOW.BASE}?${queryParams}` : FLOW.BASE
        const response = await apiClient.get(url)
        return response.data
    }

    /**
     * Get paginated N8N node runs
     */
    async getPaginatedNodeRuns(params?: {
        page?: number
        size?: number
        userId?: number
    } & N8nNodeRunFilter): Promise<BaseResponse<PaginatedN8nNodeRunResponse>> {
        const queryParams = new URLSearchParams()

        if (params?.page !== undefined) queryParams.append('page', params.page.toString())
        if (params?.size !== undefined) queryParams.append('size', params.size.toString())
        if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString())
        if (params?.status?.length) queryParams.append('status', params.status.join(','))
        if (params?.workflowId) queryParams.append('workflowId', params.workflowId)
        if (params?.nodeType) queryParams.append('nodeType', params.nodeType)
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
        if (params?.search) queryParams.append('search', params.search)

        const url = queryParams.toString() ? `${FLOW.BASE}/paginated?${queryParams}` : `${FLOW.BASE}/paginated`
        const response = await apiClient.get(url)
        return response.data
    }

    /**
     * Get N8N node run statistics
     */
    async getNodeRunStatistics(params?: {
        userId?: number
        dateFrom?: string
        dateTo?: string
    }): Promise<BaseResponse<N8nNodeRunStatistics>> {
        const queryParams = new URLSearchParams()

        if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString())
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

        const url = queryParams.toString() ? `${FLOW.BASE}/statistics?${queryParams}` : `${FLOW.BASE}/statistics`
        const response = await apiClient.get(url)
        return response.data
    }

    /**
     * Get specific N8N node run by ID
     */
    async getNodeRunById(id: number): Promise<BaseResponse<N8nNodeRunDto>> {
        const response = await apiClient.get(`${FLOW.BASE}/${id}`)
        return response.data
    }

    /**
     * Retry failed N8N node run
     */
    async retryNodeRun(id: number): Promise<BaseResponse<N8nNodeRunDto>> {
        const response = await apiClient.post(`${FLOW.BASE}/${id}/retry`)
        return response.data
    }

    /**
     * Cancel running N8N node run
     */
    async cancelNodeRun(id: number): Promise<BaseResponse<void>> {
        const response = await apiClient.post(`${FLOW.BASE}/${id}/cancel`)
        return response.data
    }
}

export const flowService = new FlowService()