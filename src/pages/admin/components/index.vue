<script setup lang="ts">
definePage({
    meta: {
        requiresAuth: true,
        role: 'ADMIN',
        action: 'manage',
        subject: 'Admin',
        title: 'Admin - Components'
    }
})
</script>

<template>
    <div>
        <VContainer>
            <VRow>
                <VCol cols="12">
                    <VCard>
                        <VCardTitle>
                            <VIcon icon="tabler-shield-check" class="me-2" />
                            Admin - Components Management
                        </VCardTitle>
                        <VCardText>
                            <VAlert color="primary" variant="tonal" class="mb-4">
                                <VIcon icon="tabler-info-circle" class="me-2" />
                                Đây là trang quản lý components dành cho Admin
                            </VAlert>

                            <p>Tính năng quản lý components sẽ được phát triển ở đây.</p>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>
    </div>
</template>