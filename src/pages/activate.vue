<script setup lang="ts">
// Vue composables are auto-imported, no need to import explicitly
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from '@/stores/auth'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({
    meta: {
        layout: 'blank',
        unauthenticatedOnly: true,
    },
})

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const isActivating = ref(false)
const activationStatus = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref('')

// Get token from query params
const activationToken = computed(() => route.query.token as string)

// Activate user on component mount
onMounted(async () => {
    if (!activationToken.value) {
        activationStatus.value = 'error'
        errorMessage.value = 'Invalid activation link. No token provided.'
        return
    }

    isActivating.value = true

    try {
        const success = await authStore.activateUser(activationToken.value)

        if (success) {
            activationStatus.value = 'success'
        } else {
            activationStatus.value = 'error'
            errorMessage.value = authStore.error || 'Account activation failed'
        }
    } catch (error) {
        activationStatus.value = 'error'
        errorMessage.value = 'An unexpected error occurred during activation'
    } finally {
        isActivating.value = false
    }
})

const goToLogin = () => {
    router.push('/login')
}

const goToRegister = () => {
    router.push('/register')
}
</script>

<template>
    <RouterLink to="/">
        <div class="auth-logo d-flex align-center gap-x-3">
            <VNodeRenderer :nodes="themeConfig.app.logo" />
            <h1 class="auth-title">
                {{ themeConfig.app.title }}
            </h1>
        </div>
    </RouterLink>

    <VRow no-gutters class="auth-wrapper bg-surface">
        <VCol md="8" class="d-none d-md-flex">
            <div class="position-relative bg-background w-100 me-0">
                <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 6.25rem;">
                    <VImg max-width="613" :src="authThemeImg" class="auth-illustration mt-16 mb-2" />
                </div>

                <img class="auth-footer-mask" :src="authThemeMask" alt="auth-footer-mask" height="280" width="100">
            </div>
        </VCol>

        <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center">
            <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-4">
                <VCardText class="text-center">
                    <!-- Loading State -->
                    <div v-if="isActivating">
                        <VProgressCircular indeterminate color="primary" size="64" class="mb-4" />
                        <h4 class="text-h4 mb-2">
                            Activating Your Account
                        </h4>
                        <p class="text-body-1">
                            Please wait while we activate your account...
                        </p>
                    </div>

                    <!-- Success State -->
                    <div v-else-if="activationStatus === 'success'">
                        <VIcon icon="tabler-circle-check" size="64" color="success" class="mb-4" />
                        <h4 class="text-h4 mb-2 text-success">
                            Account Activated Successfully! 🎉
                        </h4>
                        <p class="text-body-1 mb-6">
                            Your account has been activated successfully. You can now log in to your account.
                        </p>
                        <VBtn color="primary" variant="elevated" block @click="goToLogin">
                            Go to Login
                        </VBtn>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="activationStatus === 'error'">
                        <VIcon icon="tabler-circle-x" size="64" color="error" class="mb-4" />
                        <h4 class="text-h4 mb-2 text-error">
                            Activation Failed
                        </h4>
                        <p class="text-body-1 mb-6">
                            {{ errorMessage }}
                        </p>
                        <div class="d-flex flex-column gap-3">
                            <VBtn color="primary" variant="elevated" @click="goToRegister">
                                Register Again
                            </VBtn>
                            <VBtn variant="outlined" @click="goToLogin">
                                Back to Login
                            </VBtn>
                        </div>
                    </div>
                </VCardText>
            </VCard>
        </VCol>
    </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>