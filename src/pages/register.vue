<script setup lang="ts">
import type { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from '@/stores/auth'
import type { RegisterForm } from '@/types/auth'

import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const imageVariant = useGenerateImageVariant(authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark, true)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Form state
const refVForm = ref<VForm>()
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const showSuccessDialog = ref(false)

const registerForm = ref<RegisterForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  privacyPolicies: false,
})

// Computed
const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

// Validation rules
const passwordMatchRule = (value: string) => {
  return value === registerForm.value.password || 'Passwords do not match'
}

const privacyPolicyRule = (value: boolean) => {
  return value || 'You must agree to the privacy policy'
}

// Methods
const handleRegister = async () => {
  const success = await authStore.register({
    username: registerForm.value.username,
    email: registerForm.value.email,
    password: registerForm.value.password,
    firstName: registerForm.value.firstName,
    lastName: registerForm.value.lastName,
    phoneNumber: registerForm.value.phoneNumber,
  })

  if (success) {
    showSuccessDialog.value = true
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }: { valid: boolean }) => {
      if (isValid) {
        handleRegister()
      }
    })
}

const goToLogin = () => {
  showSuccessDialog.value = false
  router.push('/login')
}

// Clear error when user starts typing
watch(() => registerForm.value.username, () => {
  if (error.value) {
    authStore.clearError()
  }
})

watch(() => registerForm.value.email, () => {
  if (error.value) {
    authStore.clearError()
  }
})
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
        <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 100px;">
          <VImg max-width="500" :src="imageVariant" class="auth-illustration mt-16 mb-2" />
        </div>

        <img class="auth-footer-mask" :src="authThemeMask" alt="auth-footer-mask" height="280" width="100">
      </div>
    </VCol>

    <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-4">
        <VCardText>
          <h4 class="text-h4 mb-1">
            Adventure starts here 🚀
          </h4>
          <p class="mb-0">
            Make your app management easy and fun!
          </p>
        </VCardText>

        <VCardText>
          <!-- Error Alert -->
          <VAlert v-if="error" color="error" variant="tonal" class="mb-4">
            {{ error }}
          </VAlert>

          <VForm ref="refVForm" @submit.prevent="onSubmit">
            <VRow>
              <!-- Username -->
              <VCol cols="12">
                <AppTextField v-model="registerForm.username" :rules="[requiredValidator]" :disabled="isLoading"
                  autofocus label="Username" placeholder="Enter your username" />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField v-model="registerForm.email" :rules="[requiredValidator, emailValidator]"
                  :disabled="isLoading" label="Email" type="email" placeholder="johndoe@email.com" />
              </VCol>

              <!-- First Name -->
              <VCol cols="12" md="6">
                <AppTextField v-model="registerForm.firstName" :disabled="isLoading" label="First Name"
                  placeholder="John" />
              </VCol>

              <!-- Last Name -->
              <VCol cols="12" md="6">
                <AppTextField v-model="registerForm.lastName" :disabled="isLoading" label="Last Name"
                  placeholder="Doe" />
              </VCol>

              <!-- Phone Number -->
              <VCol cols="12">
                <AppTextField v-model="registerForm.phoneNumber" :disabled="isLoading" label="Phone Number (Optional)"
                  placeholder="+1234567890" />
              </VCol>

              <!-- Password -->
              <VCol cols="12">
                <AppTextField v-model="registerForm.password" :rules="[requiredValidator]" :disabled="isLoading"
                  label="Password" placeholder="············" :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password" :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" />
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField v-model="registerForm.confirmPassword" :rules="[requiredValidator, passwordMatchRule]"
                  :disabled="isLoading" label="Confirm Password" placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'" autocomplete="new-password"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
              </VCol>

              <!-- Privacy Policy -->
              <VCol cols="12">
                <div class="d-flex align-center my-6">
                  <VCheckbox id="privacy-policy" v-model="registerForm.privacyPolicies" :rules="[privacyPolicyRule]"
                    :disabled="isLoading" inline />
                  <VLabel for="privacy-policy" style="opacity: 1;">
                    <span class="me-1 text-high-emphasis">I agree to</span>
                    <a href="javascript:void(0)" class="text-primary">privacy policy & terms</a>
                  </VLabel>
                </div>

                <VBtn block type="submit" :loading="isLoading" :disabled="isLoading">
                  Sign up
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol cols="12" class="text-center text-base">
                <span class="d-inline-block">Already have an account?</span>
                <RouterLink class="text-primary ms-1 d-inline-block" :to="{ name: 'login' }">
                  Sign in instead
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

  <!-- Success Dialog -->
  <VDialog v-model="showSuccessDialog" max-width="500" persistent>
    <VCard>
      <VCardTitle class="text-h5 text-center pa-6">
        Registration Successful! 🎉
      </VCardTitle>
      <VCardText class="text-center">
        <VIcon icon="tabler-mail-check" size="64" color="success" class="mb-4" />
        <p class="text-body-1 mb-4">
          Your account has been created successfully!
        </p>
        <p class="text-body-2 text-medium-emphasis">
          Please check your email and click the activation link to activate your account before logging in.
        </p>
      </VCardText>
      <VCardActions class="justify-center pa-6">
        <VBtn color="primary" variant="elevated" @click="goToLogin">
          Go to Login
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
