<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useAbility } from '@casl/vue'

definePage({
    meta: {
        requiresAuth: true,
        title: 'Test Navigation'
    }
})

const authStore = useAuthStore()
const ability = useAbility()

// Test CASL permissions
const canReadDashboard = computed(() => ability.can('read', 'Dashboard'))
const canManageDashboard = computed(() => ability.can('manage', 'Dashboard'))
const canReadContent = computed(() => ability.can('read', 'Content'))
const canManageContent = computed(() => ability.can('manage', 'Content'))
const canReadSettings = computed(() => ability.can('read', 'Settings'))
const canReadJobQueue = computed(() => ability.can('read', 'JobQueue'))
</script>

<template>
    <div>
        <VContainer>
            <VRow>
                <VCol cols="12">
                    <VCard>
                        <VCardTitle>Navigation Test Page</VCardTitle>
                        <VCardText>
                            <div class="mb-4">
                                <h3>User Information</h3>
                                <p><strong>Username:</strong> {{ authStore.currentUser?.username }}</p>
                                <p><strong>Role:</strong> {{ authStore.currentUser?.role }}</p>
                                <p><strong>Is Authenticated:</strong> {{ authStore.isAuthenticated }}</p>
                            </div>

                            <div class="mb-4">
                                <h3>CASL Permissions</h3>
                                <VList>
                                    <VListItem>
                                        <VListItemTitle>Can Read Dashboard: {{ canReadDashboard }}</VListItemTitle>
                                    </VListItem>
                                    <VListItem>
                                        <VListItemTitle>Can Manage Dashboard: {{ canManageDashboard }}</VListItemTitle>
                                    </VListItem>
                                    <VListItem>
                                        <VListItemTitle>Can Read Content: {{ canReadContent }}</VListItemTitle>
                                    </VListItem>
                                    <VListItem>
                                        <VListItemTitle>Can Manage Content: {{ canManageContent }}</VListItemTitle>
                                    </VListItem>
                                    <VListItem>
                                        <VListItemTitle>Can Read Settings: {{ canReadSettings }}</VListItemTitle>
                                    </VListItem>
                                    <VListItem>
                                        <VListItemTitle>Can Read JobQueue: {{ canReadJobQueue }}</VListItemTitle>
                                    </VListItem>
                                </VList>
                            </div>

                            <div class="mb-4">
                                <h3>Navigation Links</h3>
                                <VBtn :to="{ name: 'dashboards-analytics' }" class="me-2 mb-2" color="primary">
                                    Analytics Dashboard
                                </VBtn>
                                <VBtn :to="{ name: 'content-index' }" class="me-2 mb-2" color="secondary">
                                    Generate Content
                                </VBtn>
                                <VBtn :to="{ name: 'content-list' }" class="me-2 mb-2" color="info">
                                    My Content
                                </VBtn>
                                <VBtn :to="{ name: 'settings' }" class="me-2 mb-2" color="warning">
                                    Settings
                                </VBtn>
                            </div>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>
    </div>
</template>