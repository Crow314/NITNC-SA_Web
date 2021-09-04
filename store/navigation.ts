import { Module, VuexModule, Mutation } from 'vuex-module-decorators'

interface NavigationItem {
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
  private clipped: boolean = true
  private navigationItems: NavigationItem[] = []

  public get isClipped (): boolean {
    return this.clipped
  }

  get getNavigationItems (): NavigationItem[] {
    return this.navigationItems
  }

  @Mutation
  toggleClip (): void {
    this.clipped = !this.clipped
  }
}
