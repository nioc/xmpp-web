<template>
  <main class="section">
    <div class="container">
      <h2 class="title">About</h2>
      <h3 class="subtitle is-5">
        <a :href="homepage" target="_blank" rel="noreferrer"><img class="image is-96x96" src="/img/icons/android-chrome-192x192.png">XMPP Web</a>
      </h3>
      <div class="content field is-grouped is-grouped-multiline">
        <div class="control">
          <div class="tags has-addons">
            <span class="tag is-dark">Installed version</span>
            <span class="tag" :class="[isUpToDate ? 'is-success': 'is-danger']" :title="gitVersion">{{ version.installed }}</span>
          </div>
        </div>
        <div class="control">
          <a v-if="!isUpToDate" class="tags has-addons" :href="version.latestLink" target="_blank" rel="noreferrer">
            <span class="tag is-dark">Latest version</span>
            <span class="tag is-info">{{ version.latest }}</span>
          </a>
        </div>
      </div>
      <p class="content">{{ description }}</p>
      <p v-if="license.name" class="content">This project is licensed under the <a :href="license.url" target="_blank" rel="noreferrer">{{ license.name }}</a></p>
    </div>
  </main>
</template>

<script>
import pkg from '../../package.json'
import axios from 'axios'
import spdxLicenseList from 'spdx-license-list'

export default {
  name: 'About',
  data () {
    return {
      version: {
        installed: pkg.version,
        latest: null,
        latestLink: null,
      },
      description: pkg.description,
      license: {
        id: pkg.license,
        name: null,
        url: null,
      },
      homepage: pkg.homepage,
      isUpToDate: true,
      // eslint-disable-next-line no-undef
      gitVersion: webpackGitVersion,
    }
  },
  mounted () {
    this.getLastVersion()
    this.getLicense()
  },
  methods: {
    async getLastVersion () {
      try {
        const response = await axios.get(pkg.xmppWeb.latestReleaseUrl)
        this.version.latest = response.data.tag_name
        this.version.latestLink = response.data.html_url
        if (this.version.latest !== this.version.installed) {
          this.isUpToDate = false
        }
      } catch (error) {
        console.error('getLastVersion error', error)
      }
    },
    getLicense () {
      Object.assign(this.license, spdxLicenseList[pkg.license])
    },
  },
}
</script>
