const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    testIsolation: false,
    specPattern: 'cypress/e2e/*.js',
    setupNodeEvents(on, config) {
      return require('@cypress/code-coverage/task')(on, config)
    },
  },
})
