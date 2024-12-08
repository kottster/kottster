# Kottster

Instant admin panel for your project ⚡

![NPM Downloads](https://img.shields.io/npm/dm/%40kottster%2Fcli)
[![@kottster/server.svg](https://img.shields.io/npm/v/@kottster/server.svg)](https://www.npmjs.com/package/@kottster/server)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![GitHub last commit](https://img.shields.io/github/last-commit/kottster/kottster)

[Website](https://kottster.app) • [Docs](https://kottster.gitbook.io/docs) • [Pricing](https://kottster.app/pricing) 

![Intro](/assets/intro.png)

## Getting started

#### To create a new project, run:

```bash
npx @kottster/cli new
```

Make sure you have Node.js version 20 or above installed on your system.

## Next steps


#### 1. Inside your project, run the app locally:

```bash
npm run dev
```

#### 2. Create an account.

After running the project, you'll need to log in to your account or create a new one. Once logged in, create an app by specifying its name.

#### 3. Connect the app to your database:

```
# PostgreSQL
npm run dev:add-data-source postgres

# MySQL
npm run dev:add-data-source mysql

# MariaDB
npm run dev:add-data-source mariadb
```

After running the command, the new file will be created inside `app/.server/data-sources/` folder. Edit the file to configure the connection to your database, and restart the server.

#### 4. Start building your app:

- Use our builder to instantly generate pages based on your database.
- Or, create and customize pages on your own.

#### 5. [Deploy your app to production](https://kottster.gitbook.io/docs/get-started/build-and-deploy) when it's ready.

## Resources

- [Docs](https://kottster.gitbook.io/docs)
  - [Quickstart](https://kottster.gitbook.io/docs)
  - [Build and deploy](https://kottster.gitbook.io/docs/get-started/build-and-deploy)
 
## Need Help?

- [Contact us](https://kottster.app/contact-us)
- [team@kottster.app](mailto:team@kottster.io)

## License

Kottster is licensed under the terms of [Apache License 2.0](https://github.com/kottster/kottster/blob/main/LICENSE).
