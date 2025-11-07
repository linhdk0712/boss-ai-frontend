import { ref, computed, type Ref } from 'vue'
import { authService } from '@/services/authService'
import type {
    LoginRequest,
    RegisterRequest,
    UserActivationRequest,
    AuthResponse,
    UserInfo,
    AuthError
} from '@/types/auth'

export function useAuth() {

    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const currentUser: Ref<UserInfo | null> = ref(null)

    // Load user from localStorage on initialization
    const storedUser = localStorage.getItem('userData')
    if (storedUser) {
        try {
            currentUser.value = JSON.parse(storedUser)
        } catch (e) {
            // console.error('Failed to parse stored user data:', e)
            localStorage.removeItem('userData')
        }
    }

    const isAuthenticated = computed(() => {
        return !!currentUser.value && authService.isAuthenticated()
    })

    const isAdmin = computed(() => {
        return currentUser.value?.role === 'ADMIN'
    })

    const login = async (credentials: LoginRequest): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            const response = await authService.login(credentials)

            if (response.errorCode === 'SUCCESS' && response.data) {
                const { accessToken, refreshToken, user } = response.data

                // Store tokens and user data
                authService.setTokens(accessToken, refreshToken)
                localStorage.setItem('userData', JSON.stringify(user))
                currentUser.value = user

                return true
            } else {
                error.value = response.errorMessage || 'Login failed'
                return false
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.errorMessage || err.message || 'Login failed'
            error.value = errorMessage
            return false
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData: RegisterRequest): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            const response = await authService.register(userData)

            if (response.errorCode === 'SUCCESS') {
                return true
            } else {
                error.value = response.errorMessage || 'Registration failed'
                return false
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.errorMessage || err.message || 'Registration failed'
            error.value = errorMessage
            return false
        } finally {
            isLoading.value = false
        }
    }

    const activateUser = async (token: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            const response = await authService.activateUser({ token })

            if (response.errorCode === 'SUCCESS') {
                return true
            } else {
                error.value = response.errorMessage || 'Account activation failed'
                return false
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.errorMessage || err.message || 'Account activation failed'
            error.value = errorMessage
            return false
        } finally {
            isLoading.value = false
        }
    }

    const logout = async (): Promise<void> => {
        try {
            // Clear local storage and state
            authService.clearTokens()
            currentUser.value = null

            // Redirect to login page (handled by router guards)
            window.location.href = '/login'
        } catch (err) {
            // console.error('Logout error:', err)
        }
    }

    const refreshToken = async (): Promise<boolean> => {
        try {
            const refreshToken = authService.getRefreshToken()
            if (!refreshToken) {
                return false
            }

            const response = await authService.refreshToken({ refreshToken })

            if (response.errorCode === 'SUCCESS' && response.data) {
                const { accessToken, refreshToken: newRefreshToken, user } = response.data

                // Update tokens and user data
                authService.setTokens(accessToken, newRefreshToken)
                localStorage.setItem('userData', JSON.stringify(user))
                currentUser.value = user

                return true
            }

            return false
        } catch (err) {
            // console.error('Token refresh failed:', err)
            await logout()
            return false
        }
    }

    const getToken = (): string | null => {
        return authService.getAccessToken()
    }

    return {
        // State
        isLoading: readonly(isLoading),
        error: readonly(error),
        currentUser: readonly(currentUser),

        // Computed
        isAuthenticated,
        isAdmin,

        // Actions
        login,
        register,
        activateUser,
        logout,
        refreshToken,

        // Utilities
        getToken,
        clearError: () => { error.value = null }
    }
}