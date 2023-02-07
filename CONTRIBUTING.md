## Contributing

The project is open and any contribution is welcome!

There are many ways to contribute to the XMPP Web such as reporting bugs, suggesting features and submitting pull requests.

### Developers guidelines

#### Discuss first

Before writing code / submitting pull request, please [create a feature request](https://github.com/nioc/xmpp-web/issues/new?assignees=&labels=enhancement&template=feature_request.yml) in order to discuss your idea.

#### Code style

When writing some code, lint it with [provided rules](.eslintrc.cjs): `npm run lint` (your pull request will not be merged until checks succeed).

#### Commits message

Read [conventional commits](https://www.conventionalcommits.org/) and write your commit messages accordingly.
You can add provided git `commit-msg` [hook](docs/git-hooks/commit-msg) (which execute a basic message checking) with the following command: `npm run configure-git-hook`.

#### Architecture

Application is build around 4 components:
- [XmppClient.js](src/services/XmppClient.js) which is responsible for low-level XMPP logic (connect, parse stanza, ...) it relies on [xmpp.js](https://github.com/xmppjs/xmpp.js),
- [XmppSocket.js](src/services/XmppSocket.js) which is responsible for application level XMPP logic,
- [Pinia store](src/store/index.js) which, as its name implies, store the data (contacts, rooms, messages, ...)  for the entire application (Vue components read data through it),
- Vue components which include display and interaction logic of their own.

### Edit frontend code (VueJS)

This app is build using Vue 3, you can found useful information on [documentation](https://vuejs.org/guide/essentials/template-syntax.html).

The UI part is using [Oruga](https://oruga.io/documentation/) library.

#### 1. Fork and clone repo

In order to contribute to this application, you need to:
1. [Fork](https://help.github.com/articles/fork-a-repo/) the repo and clone it in folder of your choice (in example `/var/www/xmpp-web`): `git clone https://github.com/<your_user>/xmpp-web.git /var/www/xmpp-web`
2. Access the frontend folder in a shell `cd /var/www/xmpp-web` for next steps (2a or 2b, then 3)

#### 2-a. Dev tools by installing prerequisite...

1. install prerequisite:
  - [Node.js](https://nodejs.org/)
  - npm `npm install npm@latest -g`
2. Build the project `npm install` and wait for the downloads
4. Start the vite server `npm run dev`


#### 2.b. ...or dev tools by using Dockerfile-dev

If you are using Docker, you can use the [Dockerfile-dev](/docs/docker/Dockerfile-dev) to avoid installing Node.js on your local computer:

1. Build dev image:
    ```
    docker build \
    -f docs/docker/Dockerfile-dev \
    -t nioc/xmpp-web:node-alpine-dev \
    .
    ```

2. Run run vite server in container:
    ```
    docker run -it \
    -p 3000:3000 \
    --rm \
    -v "$(pwd)":/app \
    -v "/app/node_modules" \
    --name xmpp-web-1 \
    nioc/xmpp-web:node-alpine-dev
    ```

#### 3. Do your work

1. Open your browser on http://localhost:3000 (vite handle hot reload after changes)
2. Edit `public/local.js` according to your XMPP server configuration (you can add it in `.gitignore` file to avoid to restore it before commit)
3. Edit the code (I suggest using [Visual Studio Code](https://code.visualstudio.com/download) with [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur))
4. When you are satisfied with your work, run the linter `npm run lint`
5. Create a dedicated branch with explicit feature name `git checkout -b feat#123-my_awesome_feature`
6. Commit your changes (with a detailled message, using [conventional commits](https://www.conventionalcommits.org/)): `git commit -am 'feat(guest): Add an awesome feature for guest' -m 'Close #123'`
7. Push to the branch: `git push origin feat#123-my_awesome_feature`
8. Submit a pull request

### XMPP server backend

You can find some docker XMPP server setups in this [folder](/docs/staging-environments).
