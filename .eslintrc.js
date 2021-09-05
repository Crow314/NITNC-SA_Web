module.exports = {
  extends: [
    '@nuxtjs/eslint-config-typescript'
  ],
  rules: {
    'space-before-function-paren': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed'],
    'vue/singleline-html-element-content-newline': ['off']
  }
}
