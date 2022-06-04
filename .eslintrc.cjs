/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  'root': true,
  'extends': [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
  ],
  'env': {
    es2021: true,
    'vue/setup-compiler-macros': true,
  },
  'rules': {
    'no-console': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/array-bracket-spacing': [
      'error',
      'never',
    ],
    'array-bracket-spacing': [
      'error',
      'never',
    ],
    'vue/arrow-spacing': 'error',
    'arrow-spacing': 'error',
    'semi': [
      'error',
      'never',
    ],
    'vue/block-spacing': 'error',
    'block-spacing': 'error',
    'vue/brace-style': 'error',
    'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
    'vue/camelcase': 'error',
    'camelcase': 'error',
    'vue/comma-dangle': [
      'error',
      'always-multiline',
    ],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
    ],
    'vue/eqeqeq': 'error',
    'eqeqeq': 'error',
    'vue/key-spacing': 'error',
    'key-spacing': 'error',
    'vue/object-curly-spacing': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'vue/space-unary-ops': 'error',
    'space-unary-ops': 'error',
    'vue/multi-word-component-names': 'off',
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'quotes': [2, 'single', 'avoid-escape'],
    'no-trailing-spaces': 'error',
  },
}
