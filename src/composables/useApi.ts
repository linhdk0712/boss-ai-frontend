import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      error.value = err.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    execute
  }
}