<template>
  <div class="container">
    <h1 v-if="error.statusCode === 404">
      Page not found
    </h1>
    <h1 v-else>
      An error occurred
    </h1>
    <NuxtLink to="/">
      Home page
    </NuxtLink>
  </div>
</template>

<script lang="ts">
// import NuxtError from '@nuxt/types'

export default {
  props: {
    error: {
      // type: Object as () => NuxtError,
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped>

</style>
