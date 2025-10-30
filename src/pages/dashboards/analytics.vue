<script setup lang="ts">
import AnalyticsAverageDailySales from '@/views/dashboards/analytics/AnalyticsAverageDailySales.vue'
import AnalyticsEarningReportsWeeklyOverview from '@/views/dashboards/analytics/AnalyticsEarningReportsWeeklyOverview.vue'
import AnalyticsMonthlyCampaignState from '@/views/dashboards/analytics/AnalyticsMonthlyCampaignState.vue'
import AnalyticsProjectTable from '@/views/dashboards/analytics/AnalyticsProjectTable.vue'
import AnalyticsSalesByCountries from '@/views/dashboards/analytics/AnalyticsSalesByCountries.vue'
import AnalyticsSalesOverview from '@/views/dashboards/analytics/AnalyticsSalesOverview.vue'
import AnalyticsSourceVisits from '@/views/dashboards/analytics/AnalyticsSourceVisits.vue'
import AnalyticsSupportTracker from '@/views/dashboards/analytics/AnalyticsSupportTracker.vue'
import AnalyticsTotalEarning from '@/views/dashboards/analytics/AnalyticsTotalEarning.vue'
import AnalyticsWebsiteAnalytics from '@/views/dashboards/analytics/AnalyticsWebsiteAnalytics.vue'

// Page meta configuration - accessible for USER role
definePage({
  meta: {
    requiresAuth: true,
    action: 'read',
    subject: 'Dashboard',
    title: 'User Analytics Dashboard'
  }
})
</script>

<template>
  <div>
    <!-- User Header -->
    <VRow class="mb-6">
      <VCol cols="12">
        <VAlert color="success" variant="tonal" class="mb-4">
          <VIcon icon="tabler-user-check" class="me-2" />
          <strong>User Analytics Dashboard</strong> - Chào mừng bạn đến với dashboard phân tích
        </VAlert>
      </VCol>
    </VRow>

    <!-- Analytics Content -->
    <VRow class="match-height">
      <!-- 👉 Website analytics -->
      <VCol cols="12" md="6">
        <AnalyticsWebsiteAnalytics />
      </VCol>

      <!-- 👉 Average Daily Sales -->
      <VCol cols="12" md="3" sm="6">
        <AnalyticsAverageDailySales />
      </VCol>

      <!-- 👉 Sales Overview -->
      <VCol cols="12" md="3" sm="6">
        <AnalyticsSalesOverview />
      </VCol>

      <!-- 👉 Earning Reports Weekly Overview -->
      <VCol cols="12" md="6">
        <AnalyticsEarningReportsWeeklyOverview />
      </VCol>

      <!-- 👉 Support Tracker -->
      <VCol cols="12" md="6">
        <AnalyticsSupportTracker />
      </VCol>

      <!-- 👉 Sales by Countries -->
      <VCol cols="12" sm="6" lg="4">
        <AnalyticsSalesByCountries />
      </VCol>

      <!-- 👉 Total Earning -->
      <VCol cols="12" sm="6" lg="4">
        <AnalyticsTotalEarning />
      </VCol>

      <!-- 👉 Monthly Campaign State -->
      <VCol cols="12" sm="6" lg="4">
        <AnalyticsMonthlyCampaignState />
      </VCol>

      <!-- 👉 Source Visits -->
      <VCol cols="12" sm="6" lg="4">
        <AnalyticsSourceVisits />
      </VCol>

      <!-- 👉 Project Table -->
      <VCol cols="12" lg="8">
        <AnalyticsProjectTable />
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss";
</style>
