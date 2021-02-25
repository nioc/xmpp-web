const { DefinePlugin } = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const gitRevisionPlugin = new GitRevisionPlugin({ branch: true })

module.exports = {
  pwa: {
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
    },
    name: 'XMPP Web',
    themeColor: '#333333',
    msTileColor: '#333333',
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg',
      msTileImage: 'img/icons/mstile-150x150.png',
    },
    manifestOptions: {
      name: 'XMPP web',
      short_name: 'XMPP web',
      icons: [
        {
          src: '/img/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/img/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      start_url: '/',
      display: 'standalone',
      background_color: '#333333',
      theme_color: '#333333',
    },
  },
  configureWebpack: {
    plugins: [
      new DefinePlugin({
        gitVersion: JSON.stringify(gitRevisionPlugin.version() + '-' + gitRevisionPlugin.branch()),
      }),
    ],
  },
  chainWebpack: config => {
    config.performance
      .maxAssetSize(2000000)
      .maxEntrypointSize(2000000)
  },
}
