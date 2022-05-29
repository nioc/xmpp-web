// eslint-disable-next-line no-unused-vars, no-var
var config = {
  name: 'XMPP web',
  transports: {
    websocket: 'wss://chat.domain-web.ltd/xmpp-websocket',
  },
  hasGuestAccess: true,
  hasRegisteredAccess: true,
  anonymousHost: null,
  // anonymousHost: 'anon.domain-xmpp.ltd',
  isTransportsUserAllowed: false,
  hasHttpAutoDiscovery: false,
  resource: 'Web XMPP',
  defaultDomain: 'domain-xmpp.ltd',
  defaultMuc: null,
  // defaultMuc: 'conference.domain-xmpp.ltd',
  isStylingDisabled: false,
}
