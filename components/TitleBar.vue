<template>
  <div>
    <v-app-bar app dark elevate-on-scroll :clipped-left="navigationClipped">
      <v-app-bar-nav-icon @click="toggleNavigationClipped" />
      <v-toolbar-title>NITNC-SA</v-toolbar-title>
    </v-app-bar>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { navigationStore } from '@/store'

@Component
export default class TitleBar extends Vue {
  get navigationClipped(): boolean {
    return navigationStore.isClipped
  }

  public toggleNavigationClipped(): void {
    navigationStore.toggleClip()
  }
}
</script>

<style scoped>

</style>
