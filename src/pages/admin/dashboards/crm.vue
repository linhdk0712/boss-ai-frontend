<script setup lang="ts">
definePage({
    meta: {
        requiresAuth: true,
        role: 'ADMIN',
        action: 'manage',
        subject: 'Admin',
        title: 'Admin - CRM Dashboard'
    }
})
</script>

<template>
    <div>
        <VContainer>
            <VRow>
                <VCol cols="12">
                    <VAlert color="primary" variant="tonal" class="mb-4">
                        <VIcon icon="tabler-shield-check" class="me-2" />
                        <strong>Admin CRM Dashboard</strong> - Quản lý CRM dành cho Admin
                    </VAlert>
                </VCol>
            </VRow>

            <VRow>
                <VCol cols="12">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-users" class="me-2" />
                            Admin CRM Management
                        </VCardTitle>
                        <VCardText>
                            <p>Tính năng CRM management cho Admin sẽ được phát triển ở đây.</p>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>
    </div>
</template>