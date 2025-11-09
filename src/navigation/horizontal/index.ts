import content from './content'
import dashboard from './dashboard'
import settings from './settings'
import type { HorizontalNavItems } from '@layouts/types'

// Only show AI Content Generation related menus
export default [...dashboard, ...content, ...settings] as HorizontalNavItems
