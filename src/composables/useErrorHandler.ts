import { ref } from 'vue'

export function useErrorHandler() {
    const error = ref<string | null>(null)

    const handleApiError = (apiError: any) => {
        // console.error('API Error:', apiError)

        if (apiError.response?.data?.errorMessage) {
            error.value = apiError.response.data.errorMessage
        } else if (apiError.message) {
            error.value = apiError.message
        } else {
            error.value = 'An unexpected error occurred'
        }

        // You could also show a toast notification here
        // or emit an event to a global error handler
    }

    const clearError = () => {
        error.value = null
    }

    return {
        error,
        handleApiError,
        clearError
    }
}