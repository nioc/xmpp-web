#!/bin/sh

set -e

update_localjs() {

  localjs=/usr/share/nginx/html/local.js

  if [ ! -w $localjs ]; then
    echo "local.js file is not writable"
    exit 1
  fi

  echo -n "update local.js with environment variables... "

  if [ "$APP_NAME" != "" ]; then
    sed -i -r "s|name: 'XMPP web'|name: '$APP_NAME'|g" $localjs
  fi

  sed -i -r "s|bosh: 'https://chat.domain-web.ltd/http-bind'|bosh: '$APP_HTTP'|g" $localjs

  sed -i -r "s|websocket: 'wss://chat.domain-web.ltd/xmpp-websocket'|websocket: '$APP_WS'|g" $localjs

  if [ "$XMPP_ANON_HOST" != "" ]; then
    sed -i -r "s|anonymousHost: null|anonymousHost: '$XMPP_ANON_HOST'|g" $localjs
  fi

  if [ "$APP_IS_TRANSPORTS_USER_ALLOWED" != "0" ]; then
    sed -i -r "s|isTransportsUserAllowed: false|isTransportsUserAllowed: true|g" $localjs
  fi

  if [ "$APP_HTTP_AUTODISCOVERY" != "0" ]; then
    sed -i -r "s|hasHttpAutoDiscovery: false|hasHttpAutoDiscovery: true|g" $localjs
  fi

  if [ "$APP_RESOURCE" != "" ]; then
    sed -i -r "s|resource: 'Web XMPP'|resource: '$APP_RESOURCE'|g" $localjs
  fi

  sed -i -r "s|defaultDomain: 'domain-xmpp.ltd'|defaultDomain: '$APP_DEFAULT_DOMAIN'|g" $localjs

  if [ "$APP_IS_STYLING_DISABLED" != "0" ]; then
    sed -i -r "s|isStylingEnabled: true|isStylingEnabled: false|g" $localjs
  fi

  echo "done"
}

update_localjs

exit 0