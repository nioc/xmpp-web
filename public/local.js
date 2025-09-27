// eslint-disable-next-line no-unused-vars, no-var
var config = {
  name: 'XMPP web',
  transports: {
    websocket: 'wss://xmpp.kittycob.dev:5281/xmpp-websocket',
  },
  hasGuestAccess: true,
  hasRegisteredAccess: true,
  anonymousHost: null,
  // anonymousHost: 'anon.domain-xmpp.ltd',
  isTransportsUserAllowed: false,
  hasHttpAutoDiscovery: false,
  resource: 'Web XMPP',
  defaultDomain: 'xmpp.kittycob.dev',
  defaultMuc: null,
  // defaultMuc: 'conference.domain-xmpp.ltd',
  isStylingDisabled: false,
  hasSendingEnterKey: false,
  connectTimeout: 5000,
  pinnedMucs: [],
  logoUrl: '',
  sso: {
    endpoint: false,
    jidHeader: 'jid',
    passwordHeader: 'password',
  },
  guestDescription: '',
}
