<template>
  <div class="ai-providers-dashboard">
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">AI Provider Monitoring</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Monitor AI provider performance, costs, and health status
        </p>
      </div>
      <div class="d-flex gap-3">
        <VBtn color="primary" prepend-icon="tabler-refresh" @click="refreshDashboard" :loading="loading">
          Refresh
        </VBtn>
        <VBtn color="secondary" prepend-icon="tabler-settings" @click="openSettings">
          Settings
        </VBtn>
      </div>
    </div>

    <!-- Overall Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar size="44" rounded color="primary" variant="tonal" class="me-3">
              <VIcon icon="tabler-server" />
            </VAvatar>
            <div>
              <span class="text-sm text-medium-emphasis">Total Providers</span>
              <div class="text-h6 font-weight-medium">
                {{ overallStats?.totalProviders || 0 }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar size="44" rounded color="success" variant="tonal" class="me-3">
              <VIcon icon="tabler-check" />
            </VAvatar>
            <div>
              <span class="text-sm text-medium-emphasis">Available</span>
              <div class="text-h6 font-weight-medium">
                {{ overallStats?.availableProviders || 0 }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar size="44" rounded color="info" variant="tonal" class="me-3">
              <VIcon icon="tabler-percentage" />
            </VAvatar>
            <div>
              <span class="text-sm text-medium-emphasis">Avg Success Rate</span>
              <div class="text-h6 font-weight-medium">
                {{ formatPercentage(overallStats?.avgSuccessRate) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" sm="6" lg="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar size="44" rounded color="warning" variant="tonal" class="me-3">
              <VIcon icon="tabler-clock" />
            </VAvatar>
            <div>
              <span class="text-sm text-medium-emphasis">Avg Response Time</span>
              <div class="text-h6 font-weight-medium">
                {{ formatResponseTime(overallStats?.avgResponseTime) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Provider Status Cards -->
    <VRow class="mb-6">
      <VCol v-for="provider in providers" :key="provider.providerName" cols="12" md="6" lg="4">
        <VCard class="provider-card">
          <VCardText>
            <!-- Provider Header -->
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <VAvatar size="32" rounded :color="getProviderStatusColor(provider.healthStatus?.healthLevel)"
                  variant="tonal" class="me-3">
                  <VIcon :icon="getProviderIcon(provider.providerName)" />
                </VAvatar>
                <div>
                  <h6 class="text-h6 font-weight-medium">
                    {{ provider.providerName }}
                  </h6>
                  <span class="text-sm text-medium-emphasis">
                    {{ provider.healthStatus?.healthLevel || 'Unknown' }}
                  </span>
                </div>
              </div>
              <VChip :color="provider.isAvailable ? 'success' : 'error'" size="small" variant="tonal">
                {{ provider.isAvailable ? 'Online' : 'Offline' }}
              </VChip>
            </div>

            <!-- Provider Metrics -->
            <div class="provider-metrics">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-sm">Success Rate</span>
                <span class="text-sm font-weight-medium">
                  {{ formatPercentage(provider.metrics?.success_rate) }}
                </span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-sm">Response Time</span>
                <span class="text-sm font-weight-medium">
                  {{ formatResponseTime(provider.metrics?.avg_response_time) }}
                </span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-sm">Total Requests</span>
                <span class="text-sm font-weight-medium">
                  {{ formatNumber(provider.metrics?.total_requests) }}
                </span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-sm">Cost per Token</span>
                <span class="text-sm font-weight-medium">
                  ${{ provider.costPerToken?.toFixed(4) || '0.0000' }}
                </span>
              </div>
            </div>

            <!-- Recent Alerts -->
            <div v-if="provider.recentAlerts?.length > 0" class="mt-4">
              <h6 class="text-sm font-weight-medium mb-2">Recent Alerts</h6>
              <div class="alerts-list">
                <VChip v-for="(alert, index) in provider.recentAlerts.slice(0, 2)" :key="index"
                  :color="getAlertColor(alert.severity)" size="x-small" variant="tonal" class="me-1 mb-1">
                  {{ alert.type }}
                </VChip>
              </div>
            </div>
          </VCardText>

          <VCardActions>
            <VBtn size="small" variant="text" @click="viewProviderDetails(provider.providerName)">
              View Details
            </VBtn>
            <VBtn size="small" variant="text" @click="forceHealthCheck(provider.providerName)"
              :loading="healthCheckLoading[provider.providerName]">
              Health Check
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <!-- Cost Summary -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center">
            <VIcon icon="tabler-currency-dollar" class="me-2" />
            Cost Summary
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol v-for="(cost, providerName) in costSummary" :key="providerName" cols="12" sm="6" md="4">
                <div class="cost-item pa-4 rounded border">
                  <h6 class="text-h6 font-weight-medium mb-2">{{ providerName }}</h6>
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-sm">Daily Cost</span>
                    <span class="text-sm font-weight-medium">
                      ${{ cost.dailyCost?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-sm">Monthly Cost</span>
                    <span class="text-sm font-weight-medium">
                      ${{ cost.monthlyCost?.toFixed(2) || '0.00' }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-sm">Budget Usage</span>
                    <span class="text-sm font-weight-medium">
                      {{ formatPercentage(cost.dailyBudgetUsagePercent / 100) }}
                    </span>
                  </div>

                  <!-- Budget Warning -->
                  <VAlert v-if="cost.dailyBudgetExceeded || cost.monthlyBudgetExceeded" type="error" variant="tonal"
                    density="compact" class="mt-2">
                    Budget exceeded!
                  </VAlert>
                  <VAlert v-else-if="cost.dailyBudgetWarning || cost.monthlyBudgetWarning" type="warning"
                    variant="tonal" density="compact" class="mt-2">
                    Budget warning
                  </VAlert>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Provider Details Dialog -->
    <VDialog v-model="detailsDialog" max-width="800" scrollable>
      <VCard v-if="selectedProvider">
        <VCardTitle class="d-flex align-center">
          <VIcon :icon="getProviderIcon(selectedProvider.providerName)" class="me-2" />
          {{ selectedProvider.providerName }} Details
        </VCardTitle>

        <VCardText>
          <VTabs v-model="detailsTab">
            <VTab value="metrics">Metrics</VTab>
            <VTab value="alerts">Alerts</VTab>
            <VTab value="performance">Performance</VTab>
          </VTabs>

          <VTabsWindow v-model="detailsTab" class="mt-4">
            <VTabsWindowItem value="metrics">
              <div class="metrics-details">
                <VRow>
                  <VCol cols="6">
                    <div class="metric-item">
                      <span class="text-sm text-medium-emphasis">Success Rate</span>
                      <div class="text-h6">{{ formatPercentage(selectedProvider.metrics?.success_rate) }}</div>
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="metric-item">
                      <span class="text-sm text-medium-emphasis">Error Rate</span>
                      <div class="text-h6">{{ formatPercentage(selectedProvider.metrics?.error_rate) }}</div>
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="metric-item">
                      <span class="text-sm text-medium-emphasis">Avg Response Time</span>
                      <div class="text-h6">{{ formatResponseTime(selectedProvider.metrics?.avg_response_time) }}</div>
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="metric-item">
                      <span class="text-sm text-medium-emphasis">Total Requests</span>
                      <div class="text-h6">{{ formatNumber(selectedProvider.metrics?.total_requests) }}</div>
                    </div>
                  </VCol>
                </VRow>
              </div>
            </VTabsWindowItem>

            <VTabsWindowItem value="alerts">
              <div class="alerts-details">
                <div v-for="(alert, index) in selectedProvider.recentAlerts" :key="index"
                  class="alert-item d-flex align-center pa-3 mb-2 rounded border">
                  <VIcon :icon="getAlertIcon(alert.severity)" :color="getAlertColor(alert.severity)" class="me-3" />
                  <div class="flex-grow-1">
                    <div class="font-weight-medium">{{ alert.type }}</div>
                    <div class="text-sm text-medium-emphasis">{{ alert.message }}</div>
                    <div class="text-xs text-medium-emphasis">
                      {{ formatTimestamp(alert.timestamp) }}
                    </div>
                  </div>
                  <VChip :color="getAlertColor(alert.severity)" size="small" variant="tonal">
                    {{ alert.severity }}
                  </VChip>
                </div>
                <div v-if="selectedProvider.recentAlerts?.length === 0" class="text-center py-4">
                  <VIcon icon="tabler-check-circle" size="48" color="success" class="mb-2" />
                  <div class="text-medium-emphasis">No recent alerts</div>
                </div>
              </div>
            </VTabsWindowItem>

            <VTabsWindowItem value="performance">
              <div class="performance-details">
                <div class="text-center py-4">
                  <VIcon icon="tabler-chart-line" size="48" color="primary" class="mb-2" />
                  <div class="text-medium-emphasis">Performance charts coming soon</div>
                </div>
              </div>
            </VTabsWindowItem>
          </VTabsWindow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="detailsDialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
definePage({
  name: 'admin-ai-providers',
  meta: {
    title: 'AI Provider Monitoring',
    requiresAuth: true,
    action: 'read',
    subject: 'Admin'
  }
})

interface ProviderHealthStatus {
  healthLevel: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'DOWN'
  isAvailable: boolean
  consecutiveFailures: number
  currentResponseTime: number
  errorRate: number
  message: string
}

interface ProviderDashboardItem {
  providerName: string
  healthStatus: ProviderHealthStatus
  metrics: Record<string, any>
  recentAlerts: Array<{
    type: string
    severity: string
    message: string
    timestamp: number
  }>
  performanceTrend: any[]
  availabilityPercent: number
  isAvailable: boolean
  capabilities: any
  costPerToken: number
}

interface ProviderOverallStats {
  totalProviders: number
  availableProviders: number
  unavailableProviders: number
  overallAvailabilityPercent: number
  avgSuccessRate: number
  avgResponseTime: number
  avgQualityScore: number
  totalRequests: number
  alertCounts: Record<string, number>
}

interface ProviderCostSummary {
  providerName: string
  dailyCost: number
  monthlyCost: number
  totalCost: number
  dailyBudget: number
  monthlyBudget: number
  dailyBudgetUsagePercent: number
  monthlyBudgetUsagePercent: number
  dailyBudgetExceeded: boolean
  monthlyBudgetExceeded: boolean
  dailyBudgetWarning: boolean
  monthlyBudgetWarning: boolean
}

interface ProviderDashboard {
  providers: ProviderDashboardItem[]
  overallStats: ProviderOverallStats
  costSummary: Record<string, ProviderCostSummary>
  lastUpdated: string
}

// Reactive data
const loading = ref(false)
const providers = ref<ProviderDashboardItem[]>([])
const overallStats = ref<ProviderOverallStats | null>(null)
const costSummary = ref<Record<string, ProviderCostSummary>>({})
const detailsDialog = ref(false)
const selectedProvider = ref<ProviderDashboardItem | null>(null)
const detailsTab = ref('metrics')
const healthCheckLoading = ref<Record<string, boolean>>({})

// Load dashboard data
const loadDashboard = async () => {
  loading.value = true
  try {
    const response = await $fetch<{
      errorMessage: string
      data: ProviderDashboard
    }>('/api/v1/ai/providers/dashboard')

    if (response.data) {
      providers.value = response.data.providers
      overallStats.value = response.data.overallStats
      costSummary.value = response.data.costSummary
    }
  } catch (error) {
    // Handle error - show notification
  } finally {
    loading.value = false
  }
}

// Refresh dashboard
const refreshDashboard = () => {
  loadDashboard()
}

// Open settings (placeholder)
const openSettings = () => {
  // TODO: Implement settings dialog
}

// View provider details
const viewProviderDetails = (providerName: string) => {
  selectedProvider.value = providers.value.find(p => p.providerName === providerName) || null
  detailsDialog.value = true
  detailsTab.value = 'metrics'
}

// Force health check
const forceHealthCheck = async (providerName: string) => {
  healthCheckLoading.value[providerName] = true
  try {
    await $fetch(`/api/v1/ai/providers/health/check/${providerName}`, {
      method: 'POST'
    })
    // Refresh data after health check
    await loadDashboard()
  } catch (error) {
    // Handle health check error
  } finally {
    healthCheckLoading.value[providerName] = false
  }
}

// Utility functions
const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const formatResponseTime = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0ms'
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`
  }
  return `${Math.round(value)}ms`
}

const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0'
  return value.toLocaleString()
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const getProviderStatusColor = (healthLevel: string | undefined): string => {
  switch (healthLevel) {
    case 'HEALTHY': return 'success'
    case 'DEGRADED': return 'warning'
    case 'UNHEALTHY': return 'error'
    case 'DOWN': return 'error'
    default: return 'secondary'
  }
}

const getProviderIcon = (providerName: string): string => {
  switch (providerName.toLowerCase()) {
    case 'openai': return 'tabler-brand-openai'
    case 'claude': return 'tabler-robot'
    case 'gemini': return 'tabler-diamond'
    default: return 'tabler-cpu'
  }
}

const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL': return 'error'
    case 'HIGH': return 'error'
    case 'MEDIUM': return 'warning'
    case 'LOW': return 'info'
    default: return 'secondary'
  }
}

const getAlertIcon = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL': return 'tabler-alert-circle'
    case 'HIGH': return 'tabler-alert-triangle'
    case 'MEDIUM': return 'tabler-info-circle'
    case 'LOW': return 'tabler-info-circle'
    default: return 'tabler-info-circle'
  }
}

// Load data on mount
onMounted(() => {
  loadDashboard()
})

// Auto-refresh every 30 seconds
const refreshInterval = setInterval(() => {
  if (!loading.value) {
    loadDashboard()
  }
}, 30000)

// Cleanup interval on unmount
onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<style scoped>
.ai-providers-dashboard {
  padding: 24px;
}

.provider-card {
  height: 100%;
}

.provider-metrics {
  border-top: 1px solid rgb(var(--v-theme-surface-variant));
  padding-top: 16px;
}

.cost-item {
  background-color: rgb(var(--v-theme-surface));
}

.metric-item {
  text-align: center;
  padding: 16px;
}

.alert-item {
  background-color: rgb(var(--v-theme-surface));
}

.alerts-list {
  max-height: 60px;
  overflow: hidden;
}
</style>