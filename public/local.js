// eslint-disable-next-line no-unused-vars, no-var
var config = {
  name: 'XMPP web',
  transports: {
    websocket: 'wss://chat.domain-web.ltd/xmpp-websocket',
    bosh: 'https://chat.domain-web.ltd/http-bind',
  },
  anonymousHost: null,
  // anonymousHost: 'anon.domain-xmpp.ltd',
  isTransportsUserAllowed: false,
  hasHttpAutoDiscovery: false,
  resource: 'Web XMPP',
  defaultDomain: 'domain-xmpp.ltd',
}
