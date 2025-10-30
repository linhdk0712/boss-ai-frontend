<script setup lang="ts">
definePage({
    meta: {
        requiresAuth: true,
        role: 'ADMIN',
        action: 'manage',
        subject: 'Admin',
        title: 'Admin - Ecommerce Dashboard'
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
                        <strong>Admin Ecommerce Dashboard</strong> - Quản lý Ecommerce dành cho Admin
                    </VAlert>
                </VCol>
            </VRow>

            <VRow>
                <VCol cols="12">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-shopping-cart" class="me-2" />
                            Admin Ecommerce Management
                        </VCardTitle>
                        <VCardText>
                            <p>Tính năng Ecommerce management cho Admin sẽ được phát triển ở đây.</p>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>
    </div>
</template>