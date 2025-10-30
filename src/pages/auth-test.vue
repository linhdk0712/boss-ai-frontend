<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePage({
    meta: {
        layout: 'blank',
        public: true,
    },
})

const authStore = useAuthStore()

const testLogin = async () => {
    const success = await authStore.login({
        username: 'admin',
        password: 'admin123'
    })

    if (success) {
        console.log('Login successful!')
    } else {
        console.log('Login failed:', authStore.error)
    }
}

const testRegister = async () => {
    const success = await authStore.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
    })

    if (success) {
        console.log('Registration successful!')
    } else {
        console.log('Registration failed:', authStore.error)
    }
}
</script>

<template>
    <div class="pa-8">
        <h1>Authentication System Test</h1>

        <div class="mt-4">
            <h2>Current Status</h2>
            <p><strong>Authenticated:</strong> {{ authStore.isAuthenticated }}</p>
            <p><strong>User:</strong> {{ authStore.currentUser?.username || 'None' }}</p>
            <p><strong>Role:</strong> {{ authStore.currentUser?.role || 'None' }}</p>
            <p><strong>Loading:</strong> {{ authStore.isLoading }}</p>
            <p><strong>Error:</strong> {{ authStore.error || 'None' }}</p>
        </div>

        <div class="mt-4">
            <h2>Test Actions</h2>
            <VBtn class="mr-2 mb-2" color="primary" @click="testLogin" :loading="authStore.isLoading">
                Test Login
            </VBtn>

            <VBtn class="mr-2 mb-2" color="secondary" @click="testRegister" :loading="authStore.isLoading">
                Test Register
            </VBtn>

            <VBtn class="mr-2 mb-2" color="error" @click="authStore.logout">
                Logout
            </VBtn>
        </div>

        <div class="mt-4">
            <h2>Navigation Links</h2>
            <VBtn class="mr-2 mb-2" variant="outlined" :to="{ name: 'login' }">
                Login Page
            </VBtn>

            <VBtn class="mr-2 mb-2" variant="outlined" :to="{ name: 'register' }">
                Register Page
            </VBtn>

            <VBtn class="mr-2 mb-2" variant="outlined" :to="{ name: 'dashboard' }">
                Dashboard
            </VBtn>
        </div>
    </div>
</template>