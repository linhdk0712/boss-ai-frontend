import apiClient from '@/plugins/axios'
import { AUTH } from '@/constants/apiEndpoints'
import type {
    BaseResponse,
    LoginRequest,
    RegisterRequest,
    UserActivationRequest,
    RefreshTokenRequest,
    AuthResponse
} from '@/types/auth'

class AuthService {
    async login(credentials: LoginRequest): Promise<BaseResponse<AuthResponse>> {
        const response = await apiClient.post(AUTH.LOGIN, credentials)
        return response.data
    }

    async register(userData: RegisterRequest): Promise<BaseResponse<void>> {
        const response = await apiClient.post(AUTH.REGISTER, userData)
        return response.data
    }

    async activateUser(activationData: UserActivationRequest): Promise<BaseResponse<void>> {
        const response = await apiClient.post(AUTH.ACTIVATE, activationData)
        return response.data
    }

    async refreshToken(refreshData: RefreshTokenRequest): Promise<BaseResponse<AuthResponse>> {
        const response = await apiClient.post(AUTH.REFRESH, refreshData)
        return response.data
    }

    // Local storage helpers
    setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
    }

    getAccessToken(): string | null {
        return localStorage.getItem('accessToken')
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken')
    }

    clearTokens(): void {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userData')
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken()
    }
}

export const authService = new AuthService()