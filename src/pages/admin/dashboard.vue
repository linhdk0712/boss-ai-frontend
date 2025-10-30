<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePage({
  meta: {
    requiresAuth: true,
    role: 'ADMIN',
  },
})

const authStore = useAuthStore()
const router = useRouter()

// Redirect admin to admin analytics dashboard
onMounted(() => {
  router.replace('/admin/dashboards/analytics')
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
              <h2>Admin Dashboard</h2>
            </VCardTitle>
            <VCardText>
              <VAlert
                color="info"
                variant="tonal"
                class="mb-4"
              >
                <VIcon icon="tabler-shield-check" />
                You have admin privileges
              </VAlert>
              
              <div class="mb-4">
                <h3>Admin Information</h3>
                <p><strong>Username:</strong> {{ authStore.currentUser?.username }}</p>
                <p><strong>Email:</strong> {{ authStore.currentUser?.email }}</p>
                <p><strong>Role:</strong> {{ authStore.currentUser?.role }}</p>
                <p><strong>Name:</strong> {{ authStore.userDisplayName }}</p>
                <p><strong>Email Verified:</strong> {{ authStore.currentUser?.emailVerified ? 'Yes' : 'No' }}</p>
              </div>

              <div class="mb-4">
                <h3>Admin Features</h3>
                <VList>
                  <VListItem>
                    <VListItemTitle>User Management</VListItemTitle>
                    <VListItemSubtitle>Manage system users</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>Content Management</VListItemTitle>
                    <VListItemSubtitle>Manage AI-generated content</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>System Settings</VListItemTitle>
                    <VListItemSubtitle>Configure system parameters</VListItemSubtitle>
                  </VListItem>
                </VList>
              </div>
            </VCardText>
            <VCardActions>
              <VBtn
                color="primary"
                variant="outlined"
                :to="{ name: 'dashboard' }"
              >
                User Dashboard
              </VBtn>
              <VSpacer />
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