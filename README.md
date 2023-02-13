# XMPP Web

[![license: AGPLv3](https://img.shields.io/badge/license-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub release](https://img.shields.io/github/release/nioc/xmpp-web.svg)](https://github.com/nioc/xmpp-web/releases/latest)
[![GitHub downloads](https://img.shields.io/github/downloads/nioc/xmpp-web/total?label=github%20downloads)](https://github.com/nioc/xmpp-web/releases/latest)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/nioc/xmpp-web/docker-image.yml?label=github%20build)](https://github.com/nioc/xmpp-web/actions/workflows/docker-image.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/nioc/xmpp-web)](https://hub.docker.com/r/nioc/xmpp-web/tags)
[![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/nioc/xmpp-web?sort=date)](https://hub.docker.com/r/nioc/xmpp-web/tags)
[![GitHub issues by-label](https://img.shields.io/github/issues/nioc/xmpp-web/help%20wanted?label=issues%20need%20help)](https://github.com/nioc/xmpp-web/labels/help%20wanted)

Lightweight web chat client for XMPP server.

## Table of contents

- [Key features](#key-features)
- [Installation](#installation)
  - [Ansible](#ansible)
  - [Archive](#archive)
  - [Docker image](#docker-image)
  - [Build from source](#build-from-source)
- [Upgrade](#upgrade)
  - [Archive](#archive)
  - [Docker image](#docker-image)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Key features

- Connect to an XMPP server with WebSocket,
- Chat and groupchat (MUC as defined in XEP-0045),
- Retrieve contacts (roster) and bookmarked rooms (XEP-0048),
- Send and receive files over HTTP (XEP-0066, XEP-0363),
- Handle password protected room,
- Display chat state notifications: is composing, is paused (XEP-0085),
- Format messages: bold, italic, striked, link and code inline/block (XEP-0393),
- Pick emoji,
- Room creation and configuration,
- Apply message moderation (XEP-0425),
- PWA (Progressive Web App) creating user experiences similar to native applications on desktop and mobile devices,
- Lightweight (600 KB gzipped at the first loading and then less than 10 KB)
- Guest access `/guest?join={jid}` (joining a MUC anonymously as described in RFC 4505)

![Screenshot desktop](/docs/screenshot-desktop-main.png)
![Screenshot mobile home](/docs/screenshot-mobile-main.png) ![Screenshot mobile chat](/docs/screenshot-mobile-chat.png)
![Screenshot guest join](/docs/screenshot-guest-join.png)

## Installation

There are 4 different ways to install XMPP Web:

- using [Docker image](#docker-image) (easiest, **strongly recommended**),
- using [release archive](#archive),
- build from [source code](#build-from-source) (latest code but hardest).
- ~~from provided [Ansible role](#ansible)~~ (not maintained),

### Ansible

Long time ago, we provided an [Ansible role](/docs/ansible/xmpp-web/README.md).
It had not been updated since 2020 and nobody used it, **it is not maintained anymore**.
You can still use it but it will not set all the relevant configuration in `local.js`.

### Archive

You can download latest `.tar.gz` archive, unpack files in web directory and configure:

- download [latest release](https://github.com/nioc/xmpp-web/releases/latest),
- unarchive,
- set files owner (example: `www-data` with Apache),
- create [Apache virtual host](/docs/apache.conf),
- configure [`local.js`](public/local.js).

``` bash
wget https://github.com/nioc/xmpp-web/releases/latest/download/xmpp-web-0.9.7.tar.gz \
  -O /var/tmp/xmpp-web.tar.gz \
  && cd /var/www \
  && tar -xvzf /var/tmp/xmpp-web.tar.gz \
  && chown www-data /var/www/xmpp-web/ -R
```

### Docker image

On each release, we also build a [Docker image](https://hub.docker.com/r/nioc/xmpp-web) which is the latest stable Nginx (Alpine variant in order to keep lightweight) serving the generated assets. Configuration in `local.js` is set up according to environment variables (names and meanings are explained in [configuration](#configuration) section).

This can be used:
- as standalone service:
  ``` bash
  docker run -it -p 80:80 --rm \
  -e XMPP_WS=https://domain-xmpp.ltd:5281/xmpp-websocket \
  -e APP_DEFAULT_DOMAIN=domain-xmpp.ltd \
  --name xmpp-web-1 nioc/xmpp-web
  ```

- in a `docker-compose.yml` file:
  ``` yml
  version: "3.4"
  services:
    xmpp-web:
      image: nioc/xmpp-web:latest
      ports:
        - "80:80"
      environment: 
        - XMPP_WS=https://domain-xmpp.ltd:5281/xmpp-websocket
        - APP_DEFAULT_DOMAIN=domain-xmpp.ltd
  ```

### Build from source

If you want the latest code without waiting for the next release, you can clone this repo, build assets and copy `dist` files in web directory:
``` bash
git clone https://github.com/nioc/xmpp-web.git xmpp-web
cd xmpp-web
npm ci
npm run build
nano dist/local.js
mv dist /var/www/xmpp-web
chown www-data /var/www/xmpp-web/ -R
```

## Upgrade

### Archive

Use the same method as installation or use the [update.sh](docs/update.sh) script. After that, do not forget to edit `local.js`.

### Docker image

Use `docker pull nioc/xmpp-web:latest` and check if there is some new environment variables to set.

## Configuration

| `local.js` attribute      | Environment (Docker)             | Default (initial value)                      | Description
| ------------------------- |----------------------------------| ---------------------------------------------|---------------------------
| `name`                    | `APP_NAME`                       | `"XMPP web"`                                 | Application name
| `transports.websocket`    | `APP_WS`                         | `"wss://chat.domain-web.ltd/xmpp-websocket"` | Websocket endpoint used by application  (proxy or direct XMPP server)
| `hasRegisteredAccess`     | `APP_REGISTERED_ACCESS`          | `true`                                       | Set to `false` to disable registered users components (guest access only)
| `hasGuestAccess`          | `APP_GUEST_ACCESS`               | `true`                                       | Set to `false` to disable guest users components
| `anonymousHost`           | `XMPP_ANON_HOST`                 | `null`                                       | Virtual host used for guest access (anonymous)
| `isTransportsUserAllowed` | `APP_IS_TRANSPORTS_USER_ALLOWED` | `false`                                      | Allow user to set endpoints on the fly in login component
| `hasHttpAutoDiscovery`    | `APP_HTTP_AUTODISCOVERY`         | `false`                                      | Allow to retrieve a `.well-known/host-meta.json` if user log on a different domain
| `resource`                | `APP_RESOURCE`                   | `"Web XMPP"`                                 | Resource (client) affected to user
| `defaultDomain`           | `APP_DEFAULT_DOMAIN`             | `"domain-xmpp.ltd"`                          | Domain used if user do not provide a full jid
| `defaultMuc`              | `APP_DEFAULT_MUC`                | `null`                                       | Autocomplete MUC address (ex: `conference.domain.ltd`) if user do not provide a full room jid (join & create)
| `isStylingDisabled`       | `APP_IS_STYLING_DISABLED`        | `false`                                      | Set to `true` for disable messages styling
| `hasSendingEnterKey`      | `APP_HAS_SENDING_ENTER_KEY`      | `false`                                      | If `true`, `Enter` key sends message, it adds new line otherwise (`Control`+`Enter` always sends message)
| `connectTimeout`          | `XMPP_CONNECT_TIMEOUT`           | `5000`                                       | Timeout in ms before XMPP connection is considered as rejected
| `pinnedMucs`              | `APP_PINNED_MUCS`                | `[]`                                         | Jid MUC list to hightlight in guest rooms page, ex: `['welcome@conference.domain.ltd', 'vip@conference.domain.ltd']`
| `logoUrl`                 | `APP_LOGO_URL`                   | `''`                                         | Custom logo URL for login/guest pages
| `guestDescription`        | `APP_GUEST_DESCRIPTION`          | `''`                                         | Welcome text for guests (allows some HTML tags like `<p>`, `<a>`, `<b>`, see [allowed tags list](https://www.npmjs.com/package/sanitize-html#default-options))
| N/A                       | `XMPP_WS`                        | `''`                                         | Websocket endpoint proxyfied by Nginx (on a docker installation)

## Contributing

If you have a suggestion for a feature you think would enhance this product, please submit a [feature request](https://github.com/nioc/xmpp-web/issues/new?labels=enhancement&template=feature_request.yml).
Pull requests are welcomed (please create feature request for discussing it before), see [contributing](CONTRIBUTING.md).

## Credits

- **[Nioc](https://github.com/nioc/)** - _Initial work_

See also the list of [contributors](https://github.com/nioc/xmpp-web/contributors) to this project.

This project is powered by the following components:
- [xmpp.js](https://github.com/xmppjs/xmpp.js) (ISC)
- [Vue.js](https://vuejs.org/) (MIT)
- [Pinia](https://pinia.vuejs.org/) (MIT)
- [Vue Router](https://router.vuejs.org/) (MIT)
- [Day.js](https://day.js.org/) (MIT)
- [Bulma](https://bulma.io/) (MIT)
- [Oruga](https://oruga.io/) (MIT)
- [Fork Awesome](https://forkaweso.me) (SIL OFL 1.1)

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE.md) file for details
