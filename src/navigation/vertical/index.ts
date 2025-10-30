import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import others from './others'
import uiElements from './ui-elements'
import admin from './admin'
import type { VerticalNavItems } from '@layouts/types'

// Export both user and admin navigation
export const userNavigation = [...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others] as VerticalNavItems
export const adminNavigation = [...admin] as VerticalNavItems

// Default export for backward compatibility (user navigation)
export default userNavigation
