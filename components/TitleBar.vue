<template>
  <div>
    <v-app-bar app dark elevate-on-scroll :clipped-left="navigationClipped">
      <v-app-bar-nav-icon @click="toggleNavigationClipped" />
      <v-toolbar-title>NITNC-SA</v-toolbar-title>
    </v-app-bar>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@nuxtjs/composition-api'
import { navigationStore } from '@/store'

export default defineComponent({
  setup() {
    const navigationInstance = navigationStore

    const navigationClipped = ref(true)
    const isNavigationClipped = () => {
      navigationClipped.value = navigationInstance.isClipped
      return navigationClipped.value
    }

    const toggleNavigationClipped = () => {
      navigationInstance.toggleClip()
      isNavigationClipped()
    }

    onMounted(isNavigationClipped)

    return {
      navigationClipped,
      toggleNavigationClipped
    }
  }
})
</script>

<style scoped>

</style>
