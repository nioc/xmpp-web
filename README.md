# XMPP Web

[![license: AGPLv3](https://img.shields.io/badge/license-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub release](https://img.shields.io/github/release/nioc/xmpp-web.svg)](https://github.com/nioc/xmpp-web/releases/latest)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/nioc/xmpp-web/Docker%20Image%20CI?label=github%20build)](https://github.com/nioc/xmpp-web/actions/workflows/docker-image.yml)
[![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/nioc/xmpp-web)](https://hub.docker.com/r/nioc/xmpp-web/builds)
[![GitHub issues by-label](https://img.shields.io/github/issues/nioc/xmpp-web/help%20wanted?label=issues%20need%20help)](https://github.com/nioc/xmpp-web/labels/help%20wanted)

Lightweight web chat client for XMPP server.

## Key features

-   Connect to an XMPP server with WebSocket or [BOSH](https://xmpp.org/about/technology-overview.html#bosh),
-   Chat and groupchat (MUC as defined in XEP-0045),
-   Retrieve contacts (roster) and bookmarked rooms (XEP-0048),
-   Send and receive files over HTTP (XEP-0066, XEP-0363),
-   Handle password protected room,
-   Display chat state notifications: is composing, is paused (XEP-0085),
-   Format messages: bold, italic, striked, link and code inline/block (XEP-0393),
-   Pick emoji,
-   Room creation and configuration,
-   PWA (Progressive Web App) creating user experiences similar to native applications on desktop and mobile devices,
-   Lightweight (600 KB gzipped at the first loading and then less than 10 KB)
-   Guest access `/guest?join={jid}` (joining a MUC anonymously as described in RFC 4505)

![Screenshot desktop](/docs/screenshot-desktop-main.png)
![Screenshot mobile home](/docs/screenshot-mobile-main.png) ![Screenshot mobile chat](/docs/screenshot-mobile-chat.png)
![Screenshot guest join](/docs/screenshot-guest-join.png)

## Installation

XMPP Web can be installed:
-   With provided [Ansible role](/docs/ansible/xmpp-web/README.md),
-   From archive:
    -   download [latest release](https://github.com/nioc/xmpp-web/releases/latest),
    -   unarchive,
    -   create [Apache virtual host](/docs/apache.conf),
    -   configure [`local.js`](public/local.js)),
-   From Docker image ([docker pull nioc/xmpp-web](https://hub.docker.com/r/nioc/xmpp-web), based on nginx):
    -   as standalone service:
        ``` bash
        docker run -it -p 80:80 --rm \
        -e XMPP_HTTP=https://domain-xmpp.ltd:5281/http-bind \
        -e XMPP_WS=https://domain-xmpp.ltd:5281/xmpp-websocket \
        -e APP_DEFAULT_DOMAIN=domain-xmpp.ltd \
        --name xmpp-web-1 nioc/xmpp-web
        ```
    -   in a docker-compose:
        ``` yml
        version: "3.4"
        services:
          xmpp-web:
            image: nioc/xmpp-web:latest
            ports:
              - "80:80"
            environment: 
              - XMPP_HTTP=https://domain-xmpp.ltd:5281/http-bind
              - XMPP_WS=https://domain-xmpp.ltd:5281/xmpp-websocket
              - APP_DEFAULT_DOMAIN=domain-xmpp.ltd
        ```
-   From source (`git clone`, `npm build`, etc...)

## Configuration

| `local.js` attribute      | Environment                      | Default                                      | Description
| ------------------------- |----------------------------------| ---------------------------------------------|---------------------------
| `name`                    | `APP_NAME`                       | `"XMPP web"`                                 | Application name
| `transports.bosh`         | `APP_HTTP`                       | `"https://chat.domain-web.ltd/http-bind"`    | BOSH endpoint used by application (proxy or direct XMPP server)
| `transports.websocket`    | `APP_WS`                         | `"wss://chat.domain-web.ltd/xmpp-websocket"` | Websocket endpoint used by application  (proxy or direct XMPP server)
| `hasRegisteredAccess`     | `APP_REGISTERED_ACCESS`          | `true`                                       | Set to `false` to disable registered users components (guest access only)
| `hasGuestAccess`          | `APP_GUEST_ACCESS`               | `true`                                       | Set to `false` to disable guest users components
| `anonymousHost`           | `XMPP_ANON_HOST`                 | `null`                                       | Virtual host used for guest access (anonymous)
| `isTransportsUserAllowed` | `APP_IS_TRANSPORTS_USER_ALLOWED` | `false`                                      | Allow user to set endpoints on the fly in login component
| `hasHttpAutoDiscovery`    | `APP_HTTP_AUTODISCOVERY`         | `false`                                      | Allow to retrieve a `.well-known/host-meta.json` if user log on a different domain
| `resource`                | `APP_RESOURCE`                   | `"Web XMPP"`                                 | Resource (client) affected to user
| `defaultDomain`           | `APP_DEFAULT_DOMAIN`             | `"domain-xmpp.ltd"`                          | Domain used if user do not provide a full jid
| `defaultMuc`              | `APP_DEFAULT_MUC`                | `null`                                       | MUC used if user do not provide a full room jid (join & create)
| `isStylingDisabled`       | `APP_IS_STYLING_DISABLED`        | `false`                                      | Set to `true` for disable messages styling
| N/A                       | `XMPP_HTTP`                      | `"http://localhost:5280/http-bind"`          | BOSH endpoint proxyfied by Nginx (on a docker installation)
| N/A                       | `XMPP_WS`                        | `"http://localhost:5280/xmpp-websocket"`     | Websocket endpoint proxyfied by Nginx (on a docker installation)

## Credits

-   **[Nioc](https://github.com/nioc/)** - _Initial work_

See also the list of [contributors](https://github.com/nioc/xmpp-web/contributors) to this project.

This project is powered by the following components:
-   [StanzaJS](https://github.com/legastero/stanza) (MIT)
-   [VueJS](https://vuejs.org/) (MIT)
-   [Vuex](https://vuex.vuejs.org/) (MIT)
-   [Vue Router](https://router.vuejs.org/) (MIT)
-   [Vue-moment](https://github.com/brockpetrie/vue-moment) (MIT)
-   [Bulma](https://bulma.io/) (MIT)
-   [Buefy](https://buefy.github.io) (MIT)
-   [Fork Awesome](https://forkaweso.me) (SIL OFL 1.1)

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE.md) file for details
