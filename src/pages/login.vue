<script setup lang="ts">
import type { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm } from '@/types/auth'

const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)

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

// Form state
const isPasswordVisible = ref(false)
const refVForm = ref<VForm>()

const loginForm = ref<LoginForm>({
  username: '',
  password: '',
  rememberMe: false,
})

// Computed
const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

// Methods
const handleLogin = async () => {
  try {
    const success = await authStore.login({
      username: loginForm.value.username,
      password: loginForm.value.password,
    })

    if (success) {
      // Wait for auth store to be fully updated
      await nextTick()

      // Redirect based on user role or return path
      let redirectPath = '/dashboards/analytics' // Default for regular users

      if ((route as any).query?.to) {
        redirectPath = String((route as any).query.to)
      } else if (authStore.isAdmin) {
        redirectPath = '/admin/dashboards/analytics'
      }

      await router.replace(redirectPath)
    }
  } catch (error) {
    // Handle navigation error
  }
}

const onSubmit = async () => {
  try {
    const validation = await refVForm.value?.validate()
    if (validation?.valid) {
      await handleLogin()
    }
  } catch (error) {
    // Handle form validation error
  }
}

// Clear error when user starts typing
watch(() => loginForm.value.username, () => {
  if (error.value) {
    authStore.clearError()
  }
}, { flush: 'post' })

watch(() => loginForm.value.password, () => {
  if (error.value) {
    authStore.clearError()
  }
}, { flush: 'post' })
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
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize"> {{ themeConfig.app.title }} </span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>
        <VCardText>
          <!-- Error Alert -->
          <VAlert v-if="error" color="error" variant="tonal" class="mb-4">
            {{ error }}
          </VAlert>

          <VAlert color="primary" variant="tonal">
            <p class="text-sm mb-2">
              Demo Admin: <strong>admin</strong> / Pass: <strong>admin123</strong>
            </p>
            <p class="text-sm mb-0">
              Demo User: <strong>user</strong> / Pass: <strong>user123</strong>
            </p>
          </VAlert>
        </VCardText>
        <VCardText>
          <VForm ref="refVForm" @submit.prevent="onSubmit">
            <VRow>
              <!-- username -->
              <VCol cols="12">
                <AppTextField v-model="loginForm.username" label="Username" placeholder="Enter your username" autofocus
                  :disabled="isLoading" :rules="[(v: string) => !!v || 'Username is required']" />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField v-model="loginForm.password" label="Password" placeholder="············"
                  :rules="[(v: string) => !!v || 'Password is required']"
                  :type="isPasswordVisible ? 'text' : 'password'" :disabled="isLoading" autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox v-model="loginForm.rememberMe" label="Remember me" :disabled="isLoading" />
                  <RouterLink class="text-primary ms-2 mb-1" :to="{ name: 'forgot-password' }">
                    Forgot Password?
                  </RouterLink>
                </div>

                <VBtn block type="submit" :loading="isLoading" :disabled="isLoading">
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol cols="12" class="text-center">
                <span>New on our platform?</span>
                <RouterLink class="text-primary ms-1" :to="{ name: 'register' }">
                  Create an account
                </RouterLink>
              </VCol>
              <VCol cols="12" class="d-flex align-center">
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol cols="12" class="text-center">
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
