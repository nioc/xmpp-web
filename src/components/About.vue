<template>
  <main class="is-growing section">
    <div class="container">
      <h2 class="title">About</h2>
      <h3 class="subtitle is-5">
        <a :href="homepage" target="_blank" rel="noreferrer"><img class="image is-96x96" src="/img/icons/android-chrome-192x192.png">XMPP Web</a>
      </h3>
      <div class="content field is-grouped is-grouped-multiline">
        <div class="control">
          <div class="tags has-addons">
            <span class="tag is-dark">Installed version</span>
            <span class="tag" :class="[isUpToDate ? 'is-success': 'is-danger']">{{ version.installed }}</span>
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
import { version, description, license, homepage, xmppWeb } from '../../package.json'
import axios from 'axios'
import spdxLicenseList from 'spdx-license-list'

export default {
  name: 'About',
  data () {
    return {
      version: {
        installed: version,
        latest: null,
        latestLink: null,
      },
      description,
      license: {
        id: license,
        name: null,
        url: null,
      },
      homepage,
      isUpToDate: true,
    }
  },
  mounted () {
    this.getLastVersion()
    this.getLicense()
  },
  methods: {
    getLastVersion () {
      axios.get(xmppWeb.latestReleaseUrl)
        .then((response) => {
          this.version.latest = response.data.tag_name
          this.version.latestLink = response.data.html_url
          if (this.version.latest !== this.version.installed) {
            this.isUpToDate = false
          }
        })
    },
    getLicense () {
      Object.assign(this.license, spdxLicenseList[license])
    },
  },
}
</script>
