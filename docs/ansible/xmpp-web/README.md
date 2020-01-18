Ansible Role: XMPP Web
======================

Install XMPP Web:
- install apache (optional if you already use a webserver),
- download archive,
- setup apache virtual host,
- configure local.js.

Requirements
------------

Ansible >= 2.9.

Role Variables
--------------

These variables should be checked/updated before use:
- `xmppweb_install_apache`: Does Apache should be installed, set `false` if already present (but check required modules), default : `true`,
- `xmppweb_version`: version to install (see [latest](https://github.com/nioc/xmpp-web/releases/latest)),
- `domain`: your domain name (not a role variable but **must be set** in your playbook/host), no default,
- `xmppweb_domain`: subdomain used for your instance, default: `chat.{{domain}}`,
- `use_web_proxy`: Using or not a proxy web like HAProxy (not a role variable but **must be set** in your playbook/host), no default,
- `xmppweb_port`: Apache listening port (only if apache is behind a proxy with `use_web_proxy = true`), default: `8080`,
- `xmppweb_rootpath`: Apache virtual host root path (where code will be unarchived), default: `/var/www`,
- `xmppweb_webuser`: Linux user running Apache, default: `www-data`.

These variables should not be updated:
- `xmppweb_download_url`: url for downloading archive.

Dependencies
------------

None.

Example Playbook
----------------

    - hosts: servers
      vars:
        domain: mydomain.ltd
        use_web_proxy: false
      roles:
      - name: xmpp-web
        xmppweb_domain: chat.mydomain.ltd
        xmppweb_port: 8081

License
-------

AGPL-3.0-or-later

Author Information
------------------

This role was created in 2019 by [Nioc](https://github.com/nioc).
