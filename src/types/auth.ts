// Base API Response type matching backend BaseResponse<T>
export interface BaseResponse<T = any> {
    errorCode: string
    errorMessage: string
    data: T
}

// Authentication Request Types
export interface LoginRequest {
    username: string
    password: string
}

export interface RegisterRequest {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
}

export interface UserActivationRequest {
    token: string
}

export interface RefreshTokenRequest {
    refreshToken: string
}

// Authentication Response Types
export interface UserInfo {
    id: number
    username: string
    email: string
    firstName?: string
    lastName?: string
    role: string
    emailVerified: boolean
    profilePictureUrl?: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    refreshExpiresIn: number
    user: UserInfo
}

// Form validation types
export interface LoginForm {
    username: string
    password: string
    rememberMe: boolean
}

export interface RegisterForm {
    username: string
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phoneNumber: string
    privacyPolicies: boolean
}

// Error types
export interface AuthError {
    field?: string
    message: string
    code?: string
}