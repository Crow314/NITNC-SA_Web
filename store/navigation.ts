import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
// eslint-disable-next-line import/named
import { Location } from 'vue-router'

export interface NavigationItem {
  title: string;
  icon: string;
  href: Location | null;
}

@Module({
  name: 'navigation',
  stateFactory: true,
  namespaced: true
})

export default class Navigation extends VuexModule {
  readonly navigationItems: NavigationItem[] = [
    { title: 'Home', icon: 'mdi-view-dashboard', href: { path: '/' } }
  ]

  private drawerState: boolean = false

  public get isDrawerOpen(): boolean {
    return this.drawerState
  }

  @Mutation
  setDrawerState(state: boolean): void {
    this.drawerState = state
  }

  @Mutation
  toggleDrawerState(): void {
    this.drawerState = !this.drawerState
  }
}
