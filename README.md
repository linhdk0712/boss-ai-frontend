# Boss AI Frontend

A modern Vue.js 3 admin dashboard built with TypeScript, Vuetify, and Vite for the Boss AI content automation platform.

## 🚀 Technology Stack

- **Framework**: Vue.js 3 with Composition API
- **UI Library**: Vuetify 3.8.5 (Material Design)
- **Build Tool**: Vite 6.3.5
- **Language**: TypeScript
- **State Management**: Pinia 3.0.2
- **Routing**: Vue Router 4.5.1 (file-based routing)
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT with CASL permissions
- **Internationalization**: Vue I18n 9.13.1
- **Icons**: Iconify with custom build system (Tabler, MDI, Font Awesome)

## 📁 Project Structure

```
src/
├── @core/              # Framework components, composables, utils
├── components/         # Application-specific components
├── pages/             # File-based routing pages
├── views/             # Complex view components
├── composables/       # Reusable composition functions
├── constants/         # API endpoints and app constants
├── plugins/           # Vue plugins and configurations
├── navigation/        # Menu definitions
├── assets/           # Static assets and styles
└── utils/            # Utility functions
```

## 🔧 Development Setup

### Prerequisites
- Node.js (Latest LTS version)
- **pnpm** (recommended package manager for this project)

### Installation

```bash
# Install dependencies (includes automatic icon build)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Preview production build
pnpm preview

# Build icon CSS bundle (manual)
pnpm build:icons

# Initialize MSW for API mocking
pnpm msw:init
```

#### Build Process Details
- **Automatic Setup**: `pnpm install` automatically runs `build:icons` and `msw:init`
- **Icon Generation**: Creates `src/plugins/iconify/icons.css` with optimized icon styles
- **MSW Integration**: Sets up Mock Service Worker for API development

### TypeScript Configuration

The project uses strict TypeScript configuration with enhanced import capabilities:

- **Strict Mode**: Full TypeScript strict mode enabled for type safety
- **Synthetic Default Imports**: `allowSyntheticDefaultImports: true` enables cleaner import syntax for CommonJS modules
- **ES Module Interop**: `esModuleInterop: true` provides better compatibility between ES modules and CommonJS
- **Path Mapping**: Comprehensive path aliases for clean imports (`@/`, `@core/`, `@layouts/`, etc.)
- **Vue 3 Support**: Optimized for Vue 3 with Composition API and `<script setup>` syntax

## 🔐 API Integration

### Centralized API Endpoints

All API endpoints are centrally managed in `src/constants/apiEndpoints.ts`:

```typescript
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ACTIVATE: '/auth/user-active',
    REFRESH: '/auth/refresh',
  },

  // User Management
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
} as const
```

### API Response Structure

All API responses follow the `BaseResponse<T>` format that matches the backend structure:

```typescript
// BaseResponse interface (matches backend)
interface BaseResponse<T = any> {
  errorCode: string      // "SUCCESS" for successful operations
  errorMessage: string   // Human-readable message
  data: T               // Actual response data
}

// Example successful login response
{
  "errorCode": "SUCCESS",
  "errorMessage": "Login successful",
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 86400,
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "emailVerified": true,
      "profilePictureUrl": "https://example.com/avatar.jpg"
    }
  }
}

// Example error response
{
  "errorCode": "VALIDATION_ERROR",
  "errorMessage": "Invalid input data",
  "data": null
}
```

### API Service Pattern

Services are organized by resource with proper TypeScript typing:

```typescript
// Example: userService.ts
import apiClient from '@/plugins/axios'
import { USERS } from '@/constants/apiEndpoints'
import type { BaseResponse } from '@/types/auth'

class UserService {
  async getUsers(): Promise<BaseResponse<User[]>> {
    const response = await apiClient.get(USERS.BASE)
    return response.data
  }

  async createUser(userData: CreateUserRequest): Promise<BaseResponse<User>> {
    const response = await apiClient.post(USERS.BASE, userData)
    return response.data
  }
}

export const userService = new UserService()
```

### Import Syntax

With `allowSyntheticDefaultImports` enabled, you can use cleaner import syntax:

```typescript
// ✅ Preferred - Clean default import syntax
import axios from 'axios'
import lodash from 'lodash'

// ✅ Also supported - Named imports
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// ✅ Path aliases work seamlessly
import { userService } from '@/services/userService'
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
```

### Authentication Flow

#### Centralized Authentication Management
- **Pinia Store Integration**: All authentication state managed through `useAuthStore()`
- **JWT Token Management**: Automatic token refresh and secure storage via `authService`
- **CASL Permissions**: Automatic ability updates on authentication state changes
- **Reactive State**: Components automatically update when authentication state changes

#### Authentication Features
- **Login/Logout**: Centralized authentication actions with proper cleanup
- **Account Activation**: Email-based activation with token verification
- **Token Refresh**: Automatic JWT token refresh with fallback to logout
- **User Profile Management**: Profile picture support via `profilePictureUrl` field
- **Error Handling**: Centralized error management with user-friendly messages
- **Loading States**: Built-in loading indicators for all authentication operations

#### Migration from Cookies
The application has migrated from cookie-based authentication to Pinia store management:

```typescript
// Old approach (deprecated)
const userData = useCookie('userData')
const logout = () => {
  useCookie('accessToken').value = null
  // Manual cleanup...
}

// New approach (recommended)
const authStore = useAuthStore()
const userData = computed(() => authStore.currentUser)
const logout = () => authStore.logout() // Handles all cleanup
```

## 🎨 Icon System (Iconify)

### Icon Bundle Configuration

The project uses a sophisticated Iconify icon bundling system that generates optimized CSS for icons. The configuration is managed in `src/plugins/iconify/build-icons.ts`:

#### Supported Icon Sets
- **Tabler Icons**: Complete icon set with stroke-width optimization (1.5px)
- **Material Design Icons (MDI)**: Selective icons including `close-circle`, `language-javascript`, `language-typescript`
- **Font Awesome**: Selective icons including `circle`

#### Build Process
```bash
# Generate icon CSS bundle
pnpm build:icons

# Automatically runs during postinstall
pnpm install  # Triggers build:icons automatically
```

#### Icon Usage in Components
```vue
<template>
  <!-- Use CSS classes generated by the build process -->
  <i class="tabler-home" />
  <i class="mdi-close-circle" />
  <i class="fa-circle" />
</template>
```

#### Adding New Icons
1. **From existing icon sets**: Add icon names to the `json` configuration in `build-icons.ts`
2. **Custom SVG icons**: Place SVG files in a directory and configure the `svg` section
3. **New icon sets**: Add new `@iconify-json/*` packages and configure in `json` section

#### Icon Optimization Features
- **Stroke width normalization**: Tabler icons automatically use 1.5px stroke width
- **CSS mask mode**: Icons use CSS masks for better performance and theming
- **Tree shaking**: Only selected icons are included in the bundle
- **SVGO optimization**: All icons are optimized for minimal file size

## 🧩 Navigation & UI Composables

### Conditional Navigation

The application includes a sophisticated conditional navigation system that adapts the sidebar based on the current route:

```typescript
// src/composables/useConditionalNavigation.ts
export function useConditionalNavigation(defaultNavItems: VerticalNavItems) {
  const route = useRoute()

  // Analytics-only navigation for clean interface
  const analyticsOnlyNav: VerticalNavItems = [
    {
      title: 'Analytics Dashboard',
      icon: { icon: 'tabler-chart-pie-2' },
      to: 'dashboards-analytics',
      action: 'read',
      subject: 'Dashboard',
    },
  ]

  const conditionalNavItems = computed(() => {
    // Show minimal navigation on analytics dashboard
    if (route.name === 'dashboards-analytics') {
      return analyticsOnlyNav
    }
    
    // Show full navigation elsewhere
    return defaultNavItems
  })

  return {
    conditionalNavItems,
    isAnalyticsRoute: computed(() => route.name === 'dashboards-analytics'),
  }
}
```

#### Features
- **Route-Based Navigation**: Automatically switches navigation items based on current route
- **Clean Analytics Interface**: Shows only Analytics Dashboard link when on analytics page
- **Reactive Updates**: Navigation updates automatically when route changes
- **TypeScript Support**: Full type safety with VerticalNavItems interface
- **CASL Integration**: Supports permission-based navigation items

#### Usage in Layout Components
```vue
<script setup lang="ts">
import { useConditionalNavigation } from '@/composables/useConditionalNavigation'
import { defaultNavigationItems } from '@/navigation/vertical'

const { conditionalNavItems, isAnalyticsRoute } = useConditionalNavigation(defaultNavigationItems)
</script>

<template>
  <v-navigation-drawer>
    <v-list>
      <v-list-item
        v-for="item in conditionalNavItems"
        :key="item.to"
        :to="item.to"
      >
        <v-icon>{{ item.icon.icon }}</v-icon>
        {{ item.title }}
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
```

## 🎨 Component Development

### Vue 3 Composition API

All components use the Composition API with `<script setup>` syntax:

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
const formData = ref({})

const handleSave = async () => {
  isLoading.value = true
  try {
    emit('save', formData.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-actions>
      <v-btn @click="emit('cancel')">Cancel</v-btn>
      <v-btn 
        :disabled="disabled || isLoading"
        :loading="isLoading"
        color="primary"
        @click="handleSave"
      >
        Save
      </v-btn>
    </v-card-actions>
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

## 🗂️ State Management

### Pinia Store Architecture

Using Pinia with Composition API pattern for centralized state management:

#### Authentication Store (Primary)
```typescript
export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<UserInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value && authService.isAuthenticated())
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')
  const userDisplayName = computed(() => {
    const { firstName, lastName, username } = currentUser.value || {}
    return firstName && lastName ? `${firstName} ${lastName}` : username
  })

  // Actions
  const login = async (credentials: LoginRequest) => {
    // Centralized login logic with token management
  }
  
  const logout = async () => {
    // Centralized logout with cleanup and navigation
    authService.clearTokens()
    currentUser.value = null
    updateAbility(null)
    await router.push('/login')
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated,
    isAdmin,
    userDisplayName,
    login,
    logout,
    // ... other actions
  }
})
```

#### Generic Store Pattern
```typescript
export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const isLoading = ref(false)

  // Getters
  const userCount = computed(() => users.value.length)

  // Actions
  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await userService.getUsers()
      users.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    userCount,
    fetchUsers
  }
})
```

### Store Integration in Components

#### Modern Approach (Pinia Store)
```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Reactive computed properties
const userData = computed(() => authStore.currentUser)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Centralized actions
const handleLogout = async () => {
  await authStore.logout() // Handles all cleanup automatically
}
</script>
```

#### Legacy Cookie Support (Deprecated)
The application maintains backward compatibility with cookie-based authentication but all new components should use the Pinia store approach.

## 🛣️ Routing & Authentication

### File-Based Routing

Automatic route generation from file structure:

- `src/pages/dashboard.vue` → `/dashboard`
- `src/pages/users/[id].vue` → `/users/:id`
- `src/pages/admin/users/index.vue` → `/admin/users`
- `src/pages/admin/dashboards/analytics.vue` → `/admin/dashboards/analytics` (admin analytics dashboard)
- `src/pages/activate.vue` → `/activate` (account activation page)
- `src/pages/login.vue` → `/login` (authentication page)
- `src/pages/register.vue` → `/register` (user registration page)

### Authentication Guards

Comprehensive route protection with multiple layers of security:

#### Route Meta Properties
```typescript
// Route configuration examples
{
  path: '/login',
  meta: { unauthenticatedOnly: true }  // Only for logged-out users
}

{
  path: '/admin/dashboard',
  meta: { requiresAuth: true, role: 'ADMIN' }  // Admin-only route
}

{
  path: '/admin/dashboards/analytics',
  meta: { 
    requiresAuth: true, 
    role: 'ADMIN',
    action: 'manage',
    subject: 'Admin',
    title: 'Admin Analytics Dashboard'
  }  // Admin-only analytics with CASL permissions
}

{
  path: '/404',
  meta: { public: true }  // Public access
}

{
  path: '/dashboards/analytics',
  meta: { 
    requiresAuth: true,
    action: 'read',
    subject: 'Dashboard',
    title: 'Analytics Dashboard'
  }  // CASL permission-based access
}
```

#### Guard Features
- **Public Routes**: Accessible without authentication (404, maintenance pages)
- **Protected Routes**: Require valid JWT authentication
- **Role-Based Access**: Admin vs User route separation
- **Unauthenticated-Only**: Login/register pages redirect authenticated users
- **Return Path Preservation**: Saves intended destination for post-login redirect
- **CASL Integration**: Fine-grained permission control beyond roles
- **Performance Optimized**: CASL checks only run on routes with specific permission requirements
- **Dashboard Permissions**: Granular access control for dashboard pages (e.g., Analytics Dashboard with `read:Dashboard` permission)

#### Authentication Flow
1. **Unauthenticated Access**: Redirects to `/login?to=/intended-path`
2. **Authenticated on Login**: Redirects to role-appropriate dashboard
   - Admin users → `/dashboards/analytics` (with access to admin-specific dashboards)
   - Regular users → `/dashboards/analytics`
3. **Role Mismatch**: Graceful redirect to appropriate dashboard (no error pages)
4. **Permission Denied**: Shows `/not-authorized` or redirects to login
5. **Performance Optimization**: CASL permission checks only run when routes define specific `action` and `subject` meta properties

#### Store Integration
- **Pinia Auth Store**: Primary authentication state management
- **Cookie Fallback**: Backward compatibility with cookie-based auth
- **Auto-Initialization**: Loads user data from localStorage on page refresh
- **Token Management**: Automatic JWT token attachment and refresh

## 🎯 Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Asset Optimization**: WebP images, SVG icons
- **Caching**: HTTP cache headers and service worker support
- **Debouncing**: User input optimization with VueUse

## ♿ Accessibility

- WCAG AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## 🔍 Development Tools

- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Vite**: Fast development and build
- **Vue DevTools**: Component debugging

## 📱 Responsive Design

Built with Vuetify's responsive breakpoint system:

- Mobile-first approach
- Flexible grid system
- Adaptive navigation
- Touch-friendly interactions

## 🌐 Internationalization

Multi-language support with Vue I18n:

```typescript
// In templates
{{ $t('common.save') }}

// In script setup
const { t } = useI18n()
const message = t('user.welcome')
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Docker Support

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

## 📚 Documentation

### Authentication & Security
- [Authentication Store Migration](../.kiro/docs/authentication-store-migration.md) - **NEW**: Cookie to Pinia migration guide
- [Profile Picture Implementation](../.kiro/docs/profile-picture-implementation.md) - **NEW**: Profile picture support in AuthResponse
- [User Avatar Fix](../.kiro/docs/user-avatar-fix.md) - Avatar display implementation
- [API Authentication Guide](../.kiro/docs/api-authentication.md)
- [Frontend Routing & Authentication](../.kiro/docs/frontend-routing-authentication.md)
- [Account Activation Flow](../.kiro/docs/account-activation-flow.md)

### Dashboard & Permissions
- [Dashboard Permissions Implementation](../.kiro/docs/dashboard-permissions-implementation.md)
- [Admin Dashboard Implementation](../.kiro/docs/admin-dashboard-implementation.md)
- [CASL Performance Optimization](../.kiro/docs/casl-performance-optimization.md)

### Development Standards
- [Frontend Development Standards](../.kiro/steering/frontend-standards.md)
- [Component Guidelines](../.kiro/steering/frontend-guidelines.md)
- [TypeScript Configuration](../.kiro/docs/typescript-configuration.md)
- [Iconify System](../.kiro/docs/iconify-system.md)

## 🤝 Contributing

1. Follow the established naming conventions
2. Use TypeScript for all new code
3. Write components with Composition API
4. Add proper error handling
5. Include accessibility features
6. Test on multiple devices/browsers

## 📄 License

This project is part of the Boss AI platform.
