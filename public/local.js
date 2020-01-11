// eslint-disable-next-line no-unused-vars
var config = {
  name: 'XMPP web',
  transports: {
    websocket: 'wss://chat.domain-web.ltd/xmpp-websocket',
    bosh: 'https://chat.domain-web.ltd/http-bind',
  },
  isTransportsUserAllowed: true,
  hasHttpAutoDiscovery: false,
  resource: 'Web XMPP',
  defaultDomain: 'domain-xmpp.ltd',
}
