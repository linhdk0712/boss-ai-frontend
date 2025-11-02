import type { BaseResponse } from '@/types/auth'
import type { AxiosResponse } from 'axios'
import axios from 'axios'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
    timeout: 120000, // 2 minutes default timeout (increased for long-running operations like content generation)
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle errors and refresh token
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (refreshToken) {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/auth/refresh`,
                        { refreshToken }
                    )

                    const { data } = response.data as BaseResponse<{ accessToken: string }>
                    localStorage.setItem('accessToken', data.accessToken)

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
                    return axios(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('userData')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

// Export for use in services
export { apiClient }

// Plugin registration function
export default function (app: any) {
    // Make apiClient available globally if needed
    app.config.globalProperties.$http = apiClient
}