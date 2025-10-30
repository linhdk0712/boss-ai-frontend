import { ref } from 'vue'

export function useErrorHandler() {
    const error = ref<string | null>(null)

    const handleApiError = (err: any): string => {
        let errorMessage = 'An unexpected error occurred'

        if (err.response?.status === 400) {
            errorMessage = err.response.data?.message || 'Invalid data provided'
        } else if (err.response?.status === 401) {
            errorMessage = 'Authentication failed. Please check your credentials.'
        } else if (err.response?.status === 403) {
            errorMessage = 'You do not have permission to perform this action'
        } else if (err.response?.status === 404) {
            errorMessage = 'The requested resource was not found'
        } else if (err.response?.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message
        } else if (err.message) {
            errorMessage = err.message
        }

        error.value = errorMessage
        return errorMessage
    }

    const clearError = () => {
        error.value = null
    }

    return {
        error: readonly(error),
        handleApiError,
        clearError
    }
}