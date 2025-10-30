// Vuetify component type declarations

declare module 'vuetify/components/VForm' {
    import type { DefineComponent } from 'vue'

    export interface VForm {
        validate(): Promise<{ valid: boolean }>
        reset(): void
        resetValidation(): void
    }

    const VForm: DefineComponent<{}, {}, any>
    export { VForm }
}

declare module 'vuetify/components' {
    export * from 'vuetify/components/VForm'
}