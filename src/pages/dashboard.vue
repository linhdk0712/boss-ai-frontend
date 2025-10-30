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
  const redirectPath = authStore.isAdmin ? '/admin/dashboards/analytics' : '/dashboards/analytics'
  router.replace(redirectPath)
})

const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div>
    <VContainer>
      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <h2>Welcome to Dashboard</h2>
            </VCardTitle>
            <VCardText>
              <div class="mb-4">
                <h3>User Information</h3>
                <p><strong>Username:</strong> {{ authStore.currentUser?.username }}</p>
                <p><strong>Email:</strong> {{ authStore.currentUser?.email }}</p>
                <p><strong>Role:</strong> {{ authStore.currentUser?.role }}</p>
                <p><strong>Name:</strong> {{ authStore.userDisplayName }}</p>
                <p><strong>Email Verified:</strong> {{ authStore.currentUser?.emailVerified ? 'Yes' : 'No' }}</p>
              </div>
            </VCardText>
            <VCardActions>
              <VBtn
                color="error"
                @click="handleLogout"
              >
                Logout
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>