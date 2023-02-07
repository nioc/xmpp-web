# Reproducing bug or feature request

You may have been asked to "*reproduce your problem*" with the [`need repro` issue label](https://github.com/nioc/xmpp-web/labels/need%20repro), so here is the operating procedure (you need to have Docker [Desktop](https://docs.docker.com/get-docker/) or [Engine](https://docs.docker.com/engine/install/) installed[^1]):

- clone this repo:

  ``` bash
  git clone https://github.com/nioc/xmpp-web.git
  ```
  and go to the `docs/staging-environments/prosody-std/` folder,
- change the server [configuration `prosody.cfg.lua`](prosody-std/prosody.cfg.lua) to reflect your own[^2],
- add necessary modules (if any) in the `docs/staging-environments/prosody-std/modules` folder,
- change XMPP Web `local.js` environment variables in [docker-compose.yml](prosody-std/docker-compose.yml) file to reflect your own[^2],
- start containers (press `Ctrl` + `C` when you are done):

  ``` bash
  docker-compose -f "docker-compose.yml" up \
    && docker-compose -f 'docker-compose.yml' --project-name 'prosody-std' down
  ```
- create any necessary data (room, chat, user configuration, ...)[^2],
- reproduce your issue,
- archive the whole `docs/staging-environments/prosody-std/` folder:

  ``` bash
  tar zcvf ../my-reproducing-setup.tar.gz ../prosody-std
  ```
- add the created archive to your issue.

:warning: Without this input, your issue will be dismissed (closed as *not planned*) by the stale bot after two weeks.

[^1]: If you do not like Docker, you can always reproduce without it by using the same type of installation to produce the expected archive.
[^2]: This may seem obvious, but: **do not use your real dns or any user credentials**.
