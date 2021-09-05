<template>
  <div>
    <v-app-bar app dark elevate-on-scroll>
      <v-app-bar-nav-icon @click="toggleDrawerState" />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
    </v-app-bar>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator'
import { navigationStore } from '@/store'

@Component
export default class TitleBar extends Vue {
  @Prop({ type: String, default: 'NITNC-SA' })
  title!: string;

  public toggleDrawerState(): void {
    navigationStore.toggleDrawerState()
  }
}
</script>

<style scoped>

</style>
