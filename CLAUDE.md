# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Boss AI Frontend is a Vue 3 admin dashboard built with TypeScript, Vuetify, and Vite. This is a content automation platform with sophisticated authentication, role-based access control, and a modern component architecture.

**Tech Stack**: Vue 3 (Composition API), TypeScript, Vuetify 3, Pinia, Vue Router, Vite, CASL (permissions)

## Common Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Production build
pnpm preview            # Preview production build
pnpm typecheck          # Run TypeScript type checking
pnpm lint               # Run ESLint with auto-fix

# Icon System
pnpm build:icons        # Build icon CSS bundle (auto-runs on install)

# MSW (Mock Service Worker)
pnpm msw:init          # Initialize MSW (auto-runs on install)
```

**Important**: This project uses **pnpm** as the package manager, not npm or yarn.

## Architecture Overview

### Auto-Import System

The project uses **unplugin-auto-import** and **unplugin-vue-components** for automatic imports:

- **Vue APIs**: `ref`, `computed`, `watch`, etc. are auto-imported
- **Composables**: Everything in `src/composables/`, `src/@core/composable/`, `src/utils/` is auto-imported
- **Components**: All components in `src/@core/components`, `src/views/demos`, `src/components` are auto-imported
- **Router**: Vue Router composables (`useRouter`, `useRoute`) are auto-imported
- **VueUse**: All VueUse composables are auto-imported
- **Pinia**: Pinia composables are auto-imported

**You do NOT need to import these manually** - they are available globally in components.

### File-Based Routing

Routes are automatically generated from `src/pages/` structure:

- `src/pages/dashboard.vue` → `/dashboard`
- `src/pages/users/[id].vue` → `/users/:id` (dynamic route)
- `src/pages/admin/dashboards/analytics.vue` → `/admin/dashboards/analytics`
- Route names are kebab-case (e.g., `dashboards-analytics`)

**Naming convention**: Use kebab-case for page files, PascalCase for components.

### Authentication & State Management

**Critical**: The application uses **Pinia store** for authentication state, NOT cookies.

#### Auth Store Pattern (Primary - Use This)

```typescript
// In components
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)

// Actions
await authStore.login(credentials)
await authStore.logout()  // Handles all cleanup automatically
```

#### Cookie Pattern (Legacy - Backward Compatibility Only)

The app maintains cookie support for backward compatibility, but **all new code should use the Pinia store**.

### API Integration

#### Centralized API Endpoints

All endpoints are defined in `src/constants/apiEndpoints.ts`:

```typescript
import { AUTH, USERS } from '@/constants/apiEndpoints'

// Usage
const response = await apiClient.post(AUTH.LOGIN, credentials)
const users = await apiClient.get(USERS.BASE)
```

**Always use these constants** - never hardcode API paths.

#### API Response Structure

All responses follow this format:

```typescript
interface BaseResponse<T> {
  errorCode: string      // "SUCCESS" for successful operations
  errorMessage: string   // Human-readable message
  data: T               // Actual response data
}
```

#### API Client (Axios)

The API client at `src/plugins/axios.ts` includes:

- **Automatic JWT attachment**: Reads from `localStorage.getItem('accessToken')`
- **Automatic token refresh**: Intercepts 401 responses and refreshes tokens
- **Base URL**: Uses `VITE_API_BASE_URL` env var, defaults to `http://localhost:8080/api/v1`

**Important**: Use `import apiClient from '@/plugins/axios'` for all API calls.

#### Service Layer Pattern

Create services for each resource:

```typescript
// src/services/userService.ts
import apiClient from '@/plugins/axios'
import { USERS } from '@/constants/apiEndpoints'
import type { BaseResponse, User } from '@/types'

class UserService {
  async getUsers(): Promise<BaseResponse<User[]>> {
    const response = await apiClient.get(USERS.BASE)
    return response.data
  }
}

export const userService = new UserService()
```

### Route Guards & Permissions

Route guards in `src/plugins/1.router/guards.ts` handle:

1. **Public routes**: `meta: { public: true }` - accessible without auth
2. **Protected routes**: `meta: { requiresAuth: true }` - requires authentication
3. **Role-based access**: `meta: { role: 'ADMIN' }` - requires specific role
4. **Unauthenticated-only**: `meta: { unauthenticatedOnly: true }` - login/register pages
5. **CASL permissions**: `meta: { action: 'read', subject: 'Dashboard' }` - granular permissions

**Path Enforcement**:
- Admin users: Access `/admin/**` paths only
- Regular users: Access non-admin paths only
- Automatic redirection if wrong path pattern is accessed

**Performance Note**: CASL permission checks only run when routes define specific `action` and `subject` meta properties.

### CASL Permissions

CASL provides fine-grained permission control beyond roles:

```typescript
// src/plugins/casl/ability.ts
// Admin: Full access (action: 'manage', subject: 'all')
// User: Limited access (action: 'read', subject: 'Dashboard', etc.)

// In route meta
meta: {
  action: 'read',
  subject: 'Dashboard'
}

// In components (auto-imported)
const ability = useAbility()
if (ability.can('read', 'Dashboard')) {
  // Show dashboard
}
```

### Icon System (Iconify)

The project uses a custom Iconify build system that generates CSS for icons.

#### Configuration

Edit `src/plugins/iconify/build-icons.ts`:

```typescript
json: [
  '@iconify-json/tabler/icons.json',  // All Tabler icons
  {
    filename: '@iconify-json/mdi/icons.json',
    icons: ['close-circle', 'language-javascript']  // Selective MDI icons
  }
]
```

#### Usage in Components

```vue
<template>
  <i class="tabler-home" />
  <i class="mdi-close-circle" />
</template>
```

**Important**:
- Run `pnpm build:icons` after modifying icon configuration
- Icons use CSS mask mode for better performance and theming
- Tabler icons are automatically normalized to 1.5px stroke width

### TypeScript Configuration

Key settings:

- **Strict mode enabled**: All strict TypeScript checks are on
- **Path aliases**: Extensive path mapping (`@/`, `@core/`, `@layouts/`, etc.)
- **Synthetic imports**: `allowSyntheticDefaultImports: true` - enables clean import syntax
- **ES Module interop**: `esModuleInterop: true` - better module compatibility

Use path aliases consistently:

```typescript
import { useAuthStore } from '@/stores/auth'
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import { useAbility } from '@/plugins/casl'
```

### Component Development

All components use Composition API with `<script setup>`:

```vue
<script setup lang="ts">
interface Props {
  title: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const isLoading = ref(false)
</script>

<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-btn
      :disabled="disabled || isLoading"
      :loading="isLoading"
      @click="emit('save', data)"
    >
      Save
    </v-btn>
  </v-card>
</template>
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.vue | `UserCard.vue` |
| Pages | kebab-case.vue | `user-profile.vue` |
| Composables | useCamelCase.ts | `useApi.ts` |
| Stores | usePascalStore.ts | `useUserStore.ts` |
| Services | camelCaseService.ts | `authService.ts` |

### Conditional Navigation

The app uses `useConditionalNavigation` composable for route-specific navigation:

```typescript
// src/composables/useConditionalNavigation.ts
const { conditionalNavItems, isAnalyticsRoute } = useConditionalNavigation(defaultNavItems)

// Shows minimal navigation on analytics dashboard
// Shows full navigation elsewhere
```

## Key Patterns & Best Practices

### Authentication Flow

1. **Login**: `authStore.login()` → stores tokens in localStorage → updates Pinia state → updates CASL abilities
2. **Token Refresh**: Axios interceptor automatically handles 401 responses
3. **Logout**: `authStore.logout()` → clears localStorage → clears Pinia state → resets CASL → redirects to `/login`
4. **Initialization**: Auth store auto-initializes from localStorage on page load

### Pinia Store Pattern

```typescript
// stores/myStore.ts
export const useMyStore = defineStore('myStore', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)

  // Getters
  const itemCount = computed(() => items.value.length)

  // Actions
  const fetchItems = async () => {
    isLoading.value = true
    try {
      const response = await itemService.getItems()
      items.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  return {
    items: readonly(items),
    isLoading: readonly(isLoading),
    itemCount,
    fetchItems
  }
})
```

### Error Handling

API errors follow the `BaseResponse` format. Always check `errorCode`:

```typescript
const response = await authService.login(credentials)
if (response.errorCode === 'SUCCESS') {
  // Success
} else {
  // Handle error: response.errorMessage
}
```

### Environment Variables

Create `.env` files for environment-specific config:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Access via `import.meta.env.VITE_API_BASE_URL`

## Common Pitfalls

1. **Don't use cookies for auth state** - Use `useAuthStore()` instead
2. **Don't hardcode API endpoints** - Use `src/constants/apiEndpoints.ts`
3. **Don't forget to run `pnpm build:icons`** after changing icon config
4. **Don't manually import auto-imported APIs** - Vue composables, router, etc. are global
5. **Don't mix admin and user paths** - Route guards enforce `/admin/**` for admins
6. **Don't check CASL permissions unnecessarily** - Only routes with specific `action`/`subject` meta trigger checks

## Project Structure

```
src/
├── @core/              # Framework-level components, composables, utils
├── @layouts/           # Layout components and plugins
├── components/         # Application-specific components
├── composables/        # Reusable composition functions (auto-imported)
├── constants/          # API endpoints, app constants
├── layouts/            # Application layouts
├── navigation/         # Menu definitions (vertical, horizontal)
├── pages/              # File-based routing pages
├── plugins/            # Vue plugins (axios, router, i18n, casl, iconify)
├── services/           # API service layer
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (auto-imported)
└── views/              # Complex view components
```

## Development Workflow

1. **Start dev server**: `pnpm dev`
2. **Create pages** in `src/pages/` (routes auto-generated)
3. **Define API endpoints** in `src/constants/apiEndpoints.ts`
4. **Create services** in `src/services/` for API calls
5. **Use auth store** for authentication state
6. **Add route guards** via meta properties for access control
7. **Run type checking** before committing: `pnpm typecheck`
8. **Lint code**: `pnpm lint`

## Testing

Currently no test framework is configured. When adding tests:
- Use Vitest for unit tests
- Use Playwright or Cypress for E2E tests
- Follow the naming pattern: `*.spec.ts` or `*.test.ts`
