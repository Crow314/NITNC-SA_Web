import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import navigation from '@/store/navigation'

// eslint-disable-next-line import/no-mutable-exports
let navigationStore: navigation

function initialiseStores(store: Store<any>): void {
  navigationStore = getModule(navigation, store)
}

export { initialiseStores, navigationStore }
