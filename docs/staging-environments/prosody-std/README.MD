# Prosody standard

This setup a standard Prosody 0.11.9 with:
- websocket listening on `http://*:5280/xmpp-websocket` (cross domain authorized for `http://localhost`, `https://localhost` and `http://localhost:300`),
- standard virtual host `localhost`,
- MUC service `conference.localhost` (with vCard support),
- anonymous virtual host `anon.localhost`,
- XEP-0065 proxy65 (file transfers) service `proxy.localhost`,
- XEP-0313 mam (message archiving),
- XEP-0363 [`http_upload`](https://modules.prosody.im/mod_http_upload) additional plugin,

## Before first use

As [Prosody docker image](https://hub.docker.com/r/prosody/prosody) version is older than 0.12, we can not use plugin installer.

In order to download extra plugins in the `modules` folder, you need to paste the following command in a shell (in `docs/staging-environments/prosody-std/` folder):

``` bash
wget \
  https://hg.prosody.im/prosody-modules/raw-file/f1f796e551f1/mod_http_upload/mod_http_upload.lua \
  https://hg.prosody.im/prosody-modules/raw-file/tip/mod_vcard_muc/mod_vcard_muc.lua \
  --directory-prefix modules
```

## Docker compose

To start both Prosody and XMPP web:

``` bash
docker-compose -f "docker-compose.yml" up
```

To remove containers:
``` bash
docker-compose -f 'docker-compose.yml' --project-name 'prosody-std' down
```

## Users

| Jid             | Password |
|-----------------|----------|
| admin@localhost | admin    |
| user1@localhost | user1    |
| user2@localhost | user2    |
