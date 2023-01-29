## Contributing

The project is open and any contribution is welcome!

#### Edit frontend code (VueJS)

This app is build using Vue 3, you can found useful information on [documentation](https://vuejs.org/guide/essentials/template-syntax.html).

The UI part is using [Oruga](https://oruga.io/documentation/) library.

##### 1. Fork and clone repo

In order to contribute to this application, you need to:
1. [Fork](https://help.github.com/articles/fork-a-repo/) the repo and clone it in folder of your choice (in example `/var/www/xmpp-web`): `git clone https://github.com/<your_user>/xmpp-web.git /var/www/xmpp-web`
2. Access the frontend folder in a shell `cd /var/www/xmpp-web` for next steps (2a or 2b, then 3)

##### 2-a. Dev tools by installing prerequisite...

1. install prerequisite:
  - [Node.js](https://nodejs.org/)
  - npm `npm install npm@latest -g`
2. Build the project `npm install` and wait for the downloads
4. Start the vite server `npm run dev`


##### 2.b. ...or dev tools by using Dockerfile-dev

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

##### 3. Do your work

1. Open your browser on http://localhost:3000 (vite handle hot reload after changes)
2. Edit `public/local.js` according to your XMPP server configuration (you can add it in `.gitignore` file to avoid to restore it before commit)
3. Edit the code (I suggest using [Visual Studio Code](https://code.visualstudio.com/download) with [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur))
4. When you are satisfied with your work, run the linter `npm run lint`
5. Create a dedicated branch with explicit feature name `git checkout -b feat#123-my_awesome_feature`
6. Commit your changes (with a detailled message, using [conventional commits](https://www.conventionalcommits.org/)): `git commit -am 'feat(guest): Add an awesome feature for guest' -m 'Close #123'`
7. Push to the branch: `git push origin feat#123-my_awesome_feature`
8. Submit a pull request
