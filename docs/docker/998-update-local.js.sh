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

  sed -i -r "s|websocket: 'wss://chat.domain-web.ltd/xmpp-websocket'|websocket: '$APP_WS'|g" $localjs

  if [ "$APP_REGISTERED_ACCESS" != "1" ]; then
    sed -i -r "s|hasRegisteredAccess: true|hasRegisteredAccess: false|g" $localjs
  fi

  if [ "$APP_GUEST_ACCESS" != "1" ]; then
    sed -i -r "s|hasGuestAccess: true|hasGuestAccess: false|g" $localjs
  fi

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

  if [ "$APP_DEFAULT_MUC" != "" ]; then
    sed -i -r "s|defaultMuc: null|defaultMuc: '$APP_DEFAULT_MUC'|g" $localjs
  fi

  if [ "$APP_IS_STYLING_DISABLED" != "0" ]; then
    sed -i -r "s|isStylingDisabled: false|isStylingDisabled: true|g" $localjs
  fi

  if [ "$APP_HAS_SENDING_ENTER_KEY" != "0" ]; then
    sed -i -r "s|hasSendingEnterKey: false|hasSendingEnterKey: true|g" $localjs
  fi

  if [ "$APP_PINNED_MUCS" != "" ]; then
    sed -i -r "s|pinnedMucs: \[\]|pinnedMucs: $APP_PINNED_MUCS|g" $localjs
  fi

  if [ "$APP_LOGO_URL" != "" ]; then
    sed -i -r "s|logoUrl: ''|logoUrl: '$APP_LOGO_URL'|g" $localjs
  fi

  if [ "$APP_GUEST_DESCRIPTION" != "" ]; then
    sed -i -r "s|guestDescription: ''|guestDescription: '$APP_GUEST_DESCRIPTION'|g" $localjs
  fi

  if [ "$XMPP_CONNECT_TIMEOUT" != "" ]; then
    sed -i -r "s|connectTimeout: 5000|connectTimeout: $XMPP_CONNECT_TIMEOUT|g" $localjs
  fi

  echo "done"
}

update_localjs

exit 0