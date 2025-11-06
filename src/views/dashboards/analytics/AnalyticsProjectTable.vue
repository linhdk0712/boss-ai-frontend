<script setup lang="ts">
// Define ProjectAnalytics interface locally
interface ProjectAnalytics {
  id: number
  name: string
  project: string
  leader: string
  team: string[]
  extraMembers?: number
  progress: number
  logo: string
}

const projectTableHeaders = [
  { title: 'PROJECT', key: 'project' },
  { title: 'LEADER', key: 'leader' },
  { title: 'Team', key: 'team', sortable: false },
  { title: 'PROGRESS', key: 'progress' },
  { title: 'Action', key: 'Action', sortable: false },
]

const search = ref('')

const itemsPerPage = ref(5)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Mock data for now to avoid API errors
const projectsData = ref({
  projects: [
    {
      id: 1,
      name: 'Sample Project',
      project: 'Web Development',
      leader: 'John Doe',
      team: ['/images/avatars/1.png', '/images/avatars/2.png'],
      extraMembers: 2,
      progress: 75,
      logo: '/images/logos/react.png'
    },
    {
      id: 2,
      name: 'Mobile App',
      project: 'React Native',
      leader: 'Jane Smith',
      team: ['/images/avatars/3.png', '/images/avatars/4.png'],
      extraMembers: 1,
      progress: 60,
      logo: '/images/logos/vue.png'
    },
    {
      id: 3,
      name: 'E-commerce Platform',
      project: 'Full Stack Development',
      leader: 'Mike Johnson',
      team: ['/images/avatars/5.png', '/images/avatars/6.png', '/images/avatars/7.png'],
      extraMembers: 3,
      progress: 90,
      logo: '/images/logos/angular.png'
    }
  ],
  totalProjects: 3
})

const updateOptions = (options: any) => {
  if (options.sortBy && options.sortBy.length > 0) {
    sortBy.value = options.sortBy[0]?.key
    orderBy.value = options.sortBy[0]?.order
  }
}

const projects = computed((): ProjectAnalytics[] => {
  return projectsData.value?.projects || []
})

const totalProjects = computed(() => {
  return projectsData.value?.totalProjects || 0
})

const moreList = [
  { title: 'Download', value: 'Download' },
  { title: 'Delete', value: 'Delete' },
  { title: 'View', value: 'View' },
]
</script>

<template>
  <VCard v-if="projects && projects.length > 0">
    <VCardItem class="project-header d-flex flex-wrap justify-space-between gap-4">
      <VCardTitle>Project List</VCardTitle>

      <template #append>
        <div style="inline-size: 250px;">
          <VTextField v-model="search" placeholder="Search Project" />
        </div>
      </template>
    </VCardItem>

    <VDivider />

    <!-- SECTION Table -->
    <VDataTableServer v-model:items-per-page="itemsPerPage" v-model:page="page" :items="projects"
      :items-length="totalProjects" item-value="id" :headers="projectTableHeaders" class="text-no-wrap" show-select
      @update:options="updateOptions">
      <!-- projects -->
      <template #item.project="{ item }">
        <div class="d-flex align-center gap-x-3" style="padding-block: 7px;">
          <VAvatar :size="34" :image="item.logo" />
          <div>
            <h6 class="text-h6 text-no-wrap">
              {{ item.name }}
            </h6>
            <div class="text-body-2">
              {{ item.project }}
            </div>
          </div>
        </div>
      </template>

      <template #item.leader="{ item }">
        <div class="text-base text-high-emphasis">
          {{ item.leader }}
        </div>
      </template>

      <!-- Team -->
      <template #item.team="{ item }">
        <div class="d-flex">
          <div class="v-avatar-group">
            <VAvatar v-for="(data, index) in item.team" :key="index" size="26">
              <VImg :src="data" />
            </VAvatar>
            <VAvatar v-if="item.extraMembers" :color="$vuetify.theme.current.dark ? '#373b50' : '#eeedf0'" :size="26">
              <div class="text-caption text-high-emphasis">
                +{{ item.extraMembers }}
              </div>
            </VAvatar>
          </div>
        </div>
      </template>

      <!-- Progress -->
      <template #item.progress="{ item }">
        <div class="d-flex align-center gap-3">
          <div class="flex-grow-1">
            <VProgressLinear :height="6" :model-value="item.progress" color="primary" rounded />
          </div>
          <div class="text-body-1 text-high-emphasis">
            {{ item.progress }}%
          </div>
        </div>
      </template>

      <!-- Action -->
      <template #item.Action>
        <MoreBtn :menu-list="moreList" />
      </template>

      <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
      <template #bottom>
        <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalProjects" />
      </template>
    </VDataTableServer>
    <!-- !SECTION -->
  </VCard>

  <!-- Fallback when no projects -->
  <VCard v-else>
    <VCardItem>
      <VCardTitle>Project List</VCardTitle>
    </VCardItem>
    <VDivider />
    <VCardText class="text-center py-8">
      <VIcon icon="tabler-folder-x" size="48" class="mb-4" />
      <div class="text-h6 mb-2">No Projects Found</div>
      <div class="text-body-2">There are no projects to display at the moment.</div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.project-header .v-card-item__append {
  padding-inline-start: 0;
}
</style>
