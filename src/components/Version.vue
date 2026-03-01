<template>
  <span v-once class="is-block is-size-7 has-text-grey has-text-centered has-text-weight-light py-2" style="opacity: 50%;">
    <span><span class="mr-1"><i class="fa-brands fa-github" aria-hidden="true" /><span class="sr-only">Code</span></span>Made with <i class="fa-solid fa-heart has-text-danger" aria-hidden="true" /><span class="sr-only">love</span> by <b><a :href="homepage" target="_blank" rel="noreferrer" class="has-text-grey">Nioc</a></b></span>
    <span class="ml-3"><span class="mr-1"><i class="fa-solid fa-tag" aria-hidden="true" /><span class="sr-only">Version</span></span><span :title="`${gitVersion} (${gitBranch})`">{{ version }}</span></span>
    <span class="ml-3"><span class="mr-1"><i class="fa-solid fa-scale-balanced" aria-hidden="true" /><span class="sr-only">License</span></span><span>{{ license }}</span></span>
  </span>
</template>

<script>
import { version, license, homepage } from '../../package.json'

export default {
  name: 'Version',
  data () {
    return {
      gitVersion: import.meta.env.VITE_GIT_VERSION,
      gitBranch: import.meta.env.VITE_GIT_BRANCH,
      homepage,
      license,
      version,
    }
  },
}
</script>
