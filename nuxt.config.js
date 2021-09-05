export default {
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/vuetify'
  ],
  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxt/typescript-build'
  ],
  transpileDependencies: [
    'vuex-module-decorators'
  ],
  plugins: [
    '@/plugins/axios.js'
  ],
  components: true
}
