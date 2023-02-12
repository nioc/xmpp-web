<template>
  <span class="message-text has-background-shade-1" :class="{ 'is-msg-moderated': statusCode === 'moderated' }">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span v-if="message.body" v-html="body" />
    <message-link v-for="link in message.links" :key="link.url" :url="link.url" class="is-clickable" />
    <div v-if="message.delay" class="content is-italic has-text-weight-light is-small">
      <b v-if="displayNick" class="pr-1">{{ nick }}</b>
      <time :datetime="$dayjs(message.delay).format()" :title="$dayjs(message.delay).format()">{{ $dayjs(message.delay).fromNow() }}</time>
      <i v-if="statusCode === 'error'" class="fa fa-times has-text-danger ml-2" :title="message.status.message" />
      <i v-else-if="statusCode === 'moderated'" class="fa fa-minus-circle has-text-danger ml-2" :title="message.status.message" />
    </div>
  </span>
</template>

<script>
import MessageLink from '../components/MessageLink.vue'
import sanitizeHtml from 'sanitize-html'

export default {
  name: 'Message',
  components: {
    MessageLink,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
    displayNick: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    nick () {
      return this.message.from.resource
    },
    body () {
      if (window.config.isStylingDisabled) {
        return sanitizeHtml(this.message.body, {
          allowedTags: [],
          disallowedTagsMode: escape,
        })
      }

      let codeBlockStartLine = null
      let codeBlockEndLine = null
      return sanitizeHtml(this.message.body, {
        allowedTags: [],
        disallowedTagsMode: escape,
      })
        .split(/\r?\n/)
        .map((line, index, lines) => {
          if (codeBlockEndLine !== null) {
            // continue current code block
            if (index === codeBlockStartLine) {
              if (index === codeBlockEndLine - 1) {
                // start and end code block
                return '<pre><code>' + line + '</code></pre>'
              }
              // start code block
              return '<pre><code>' + line
            }
            if (index === codeBlockEndLine - 1) {
              // end code block
              return line + '</code></pre>'
            }
            if (index === codeBlockEndLine) {
              // clear code block vars
              codeBlockStartLine = null
              codeBlockEndLine = null
              return null
            }
            // inside code block
            return line
          }

          if (/^```/.test(line)) {
            // code block, try to found the end
            const relativeBlockLineEnd = lines
              .slice(index + 1)
              .findIndex((testedLine) => /```/.test(testedLine))
            if (relativeBlockLineEnd !== -1) {
              // code block is valid, set vars for handling relativeBlockLineEnd-th next lines
              codeBlockStartLine = index + 1
              codeBlockEndLine = index + relativeBlockLineEnd + 1
              return null
            }
          }

          // handle inline tags
          // inline code
          const re = /([^`]*)`([^`]*)`([^`]*)/g
          let parts
          const codes = {}
          let lineTemp = ''
          while ((parts = re.exec(line)) !== null) {
            codes[parts.index] = parts[2]
            lineTemp += `${parts[1]}<code ${parts.index} />${parts[3]}`
          }
          if (lineTemp !== '') {
            line = lineTemp
          }
          // link
          line = line.replace(/(.*)((?:https?|mailto):\/\/[a-z0-9/:%_+.,#?!@&=-]+)(.*)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>$3')
          // bold
          line = line.replace(/([^*]*)\*([^*]*)\*([^*]*)/g, '$1<strong>$2</strong>$3')
          // italic
          line = line.replace(/([^_]*)_([^_]*)_([^_]*)/g, '$1<i>$2</i>$3')
          // striked
          line = line.replace(/([^~]*)~([^~]*)~([^~]*)/g, '$1<strike>$2</strike>$3')
          // finally bind inline code tags (to avoid styling inside code tag)
          for (const code in codes) {
            line = line.replace(new RegExp(`(.*)<code ${code} />(.*)`, 'g'), `$1<code>${codes[code]}</code>$2`)
          }
          return line
        })
        .filter((line) => line !== null)
        .join('\n')
    },
    statusCode () {
      return this.message.status ? this.message.status.code : null
    },
  },
}
</script>
