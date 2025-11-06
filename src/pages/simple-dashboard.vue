<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePage({
    meta: {
        requiresAuth: true,
        action: 'read',
        subject: 'Dashboard',
        title: 'Simple Dashboard'
    }
})

const authStore = useAuthStore()
</script>

<template>
    <div>
        <VContainer>
            <VRow>
                <VCol cols="12">
                    <VAlert color="success" variant="tonal" class="mb-6">
                        <VIcon icon="tabler-dashboard" class="me-2" />
                        <strong>Simple Dashboard</strong> - Dashboard đơn giản không có lỗi
                    </VAlert>
                </VCol>
            </VRow>

            <VRow>
                <VCol cols="12" md="6">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-user" class="me-2" />
                            User Information
                        </VCardTitle>
                        <VCardText>
                            <VList>
                                <VListItem>
                                    <VListItemTitle>Username: {{ authStore.currentUser?.username }}</VListItemTitle>
                                </VListItem>
                                <VListItem>
                                    <VListItemTitle>Email: {{ authStore.currentUser?.email }}</VListItemTitle>
                                </VListItem>
                                <VListItem>
                                    <VListItemTitle>Role: {{ authStore.currentUser?.role }}</VListItemTitle>
                                </VListItem>
                                <VListItem>
                                    <VListItemTitle>Display Name: {{ authStore.userDisplayName }}</VListItemTitle>
                                </VListItem>
                            </VList>
                        </VCardText>
                    </VCard>
                </VCol>

                <VCol cols="12" md="6">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-chart-line" class="me-2" />
                            Quick Stats
                        </VCardTitle>
                        <VCardText>
                            <VRow>
                                <VCol cols="6">
                                    <div class="text-center">
                                        <div class="text-h4 text-primary">24</div>
                                        <div class="text-body-2">Total Projects</div>
                                    </div>
                                </VCol>
                                <VCol cols="6">
                                    <div class="text-center">
                                        <div class="text-h4 text-success">12</div>
                                        <div class="text-body-2">Completed</div>
                                    </div>
                                </VCol>
                                <VCol cols="6">
                                    <div class="text-center">
                                        <div class="text-h4 text-warning">8</div>
                                        <div class="text-body-2">In Progress</div>
                                    </div>
                                </VCol>
                                <VCol cols="6">
                                    <div class="text-center">
                                        <div class="text-h4 text-error">4</div>
                                        <div class="text-body-2">Pending</div>
                                    </div>
                                </VCol>
                            </VRow>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>

            <VRow>
                <VCol cols="12">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-link" class="me-2" />
                            Quick Navigation
                        </VCardTitle>
                        <VCardText>
                            <div class="d-flex flex-wrap gap-3">
                                <VBtn :to="{ name: 'dashboards-analytics' }" color="primary"
                                    prepend-icon="tabler-chart-pie-2">
                                    Analytics Dashboard
                                </VBtn>
                                <VBtn :to="{ name: 'content-index' }" color="secondary" prepend-icon="tabler-wand">
                                    Generate Content
                                </VBtn>
                                <VBtn :to="{ name: 'content-list' }" color="info" prepend-icon="tabler-list">
                                    My Content
                                </VBtn>
                                <VBtn :to="{ name: 'settings' }" color="warning" prepend-icon="tabler-settings">
                                    Settings
                                </VBtn>
                                <VBtn :to="{ name: 'test-navigation' }" color="error" prepend-icon="tabler-bug">
                                    Test Navigation
                                </VBtn>
                            </div>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>
    </div>
</template>