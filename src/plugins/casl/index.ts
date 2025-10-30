import { createAbility, defaultAbility, type AppAbility } from './ability'
import { abilitiesPlugin } from '@casl/vue'
import type { App } from 'vue'
import type { UserInfo } from '@/types/auth'

// Global ability instance
let ability: AppAbility = defaultAbility

/**
 * Update ability based on user
 */
export const updateAbility = (user: UserInfo | null) => {
  const newAbility = createAbility(user)
  ability.update(newAbility.rules)
}

/**
 * Get current ability instance
 */
export const getAbility = () => ability

/**
 * Vue plugin installer
 */
export default function (app: App) {
  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true
  })
}

export { ability }
export * from './ability'