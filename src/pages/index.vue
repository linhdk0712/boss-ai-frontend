<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePage({
    meta: {
        requiresAuth: true,
    },
})

const authStore = useAuthStore()
const router = useRouter()

// Redirect based on user role
onMounted(() => {
    if (authStore.isAuthenticated) {
        const redirectPath = authStore.isAdmin ? '/admin/dashboards/analytics' : '/dashboards/analytics'
        router.replace(redirectPath)
    }
})
</script>

<template>
    <div class="d-flex align-center justify-center" style="min-height: 100vh;">
        <VProgressCircular indeterminate color="primary" size="64" />
    </div>
</template>