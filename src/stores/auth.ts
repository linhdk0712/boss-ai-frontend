import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { updateAbility } from '@/plugins/casl'
import type { UserInfo, LoginRequest, RegisterRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()

    // State
    const currentUser = ref<UserInfo | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Initialize user from localStorage
    const initializeAuth = () => {
        const storedUser = localStorage.getItem('userData')
        if (storedUser && authService.isAuthenticated()) {
            try {
                const user = JSON.parse(storedUser)
                currentUser.value = user
                updateAbility(user)
            } catch (e) {
                console.error('Failed to parse stored user data:', e)
                authService.clearTokens()
                updateAbility(null)
            }
        } else {
            updateAbility(null)
        }
    }

    // Getters
    const isAuthenticated = computed(() => {
        return !!currentUser.value && authService.isAuthenticated()
    })

    const isAdmin = computed(() => {
        return currentUser.value?.role === 'ADMIN'
    })

    const userDisplayName = computed(() => {
        if (!currentUser.value) return ''
        const { firstName, lastName, username } = currentUser.value
        if (firstName && lastName) {
            return `${firstName} ${lastName}`
        }
        return username
    })

    // Actions
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
                updateAbility(user)

                return true
            } else {
                error.value = response.errorMessage || 'Login failed'
                return false
            }
        } catch (err: any) {
            error.value = err.response?.data?.errorMessage || err.message || 'Login failed'
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
            error.value = err.response?.data?.errorMessage || err.message || 'Registration failed'
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
            error.value = err.response?.data?.errorMessage || err.message || 'Account activation failed'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const logout = async (): Promise<void> => {
        try {
            // Clear tokens and user data
            authService.clearTokens()
            currentUser.value = null
            error.value = null
            updateAbility(null)

            // Redirect to login page
            await router.push('/login')
        } catch (err) {
            console.error('Logout error:', err)
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
                updateAbility(user)

                return true
            }

            return false
        } catch (err) {
            console.error('Token refresh failed:', err)
            await logout()
            return false
        }
    }

    const clearError = () => {
        error.value = null
    }

    // Initialize on store creation
    initializeAuth()

    return {
        // State
        currentUser: readonly(currentUser),
        isLoading: readonly(isLoading),
        error: readonly(error),

        // Getters
        isAuthenticated,
        isAdmin,
        userDisplayName,

        // Actions
        login,
        register,
        activateUser,
        logout,
        refreshToken,
        clearError,
        initializeAuth
    }
})