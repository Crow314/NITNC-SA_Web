<template>
  <v-navigation-drawer v-model="drawerState" temporary app dark>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="title">NITNC-SA</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list nav dense>
      <v-list-item-group>
        <v-list-item v-for="(navigationItem, index) in navigationItems" :key="index">
          <v-list-item-title>{{ navigationItem.title }}</v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { navigationStore } from '@/store'
import { NavigationItem } from '@/store/navigation'

@Component
export default class TitleBar extends Vue {
  drawerState = false

  get navigationItems(): NavigationItem[] {
    return navigationStore.navigationItems
  }

  get storedDrawerState(): boolean {
    return navigationStore.isDrawerOpen
  }

  // 画面クリックなどでの変更を取得
  @Watch('drawerState')
  onDrawerStateChanged() {
    navigationStore.setDrawerState(this.drawerState)
  }

  // ハンバーガーボタンなどによる更新を取得
  @Watch('storedDrawerState', { immediate: true })
  onStoredDrawerStateUpdated() {
    this.drawerState = this.storedDrawerState
  }
}
</script>

<style scoped>

</style>
