# Kottster

Simple low-code platform for building robust admin dashboards fast ⚡

![NPM Downloads](https://img.shields.io/npm/dm/%40kottster%2Fcli)
[![@kottster/server.svg](https://img.shields.io/npm/v/@kottster/server.svg)](https://www.npmjs.com/package/@kottster/server)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![GitHub last commit](https://img.shields.io/github/last-commit/kottster/kottster)

[Website](https://kottster.app) • [Sign Up](https://web.kottster.app/signup) • [Docs](https://kottster.gitbook.io/docs) • [Pricing](https://kottster.app/pricing)

[video.webm](https://github.com/user-attachments/assets/90f975b1-9278-4f02-bbc4-2704dbaa184b)

## Getting started

#### **1.** [Sign up](https://web.kottster.app/signup) at Kottster.

#### **2.** Create a new app.

#### **3.** Complete the initial setup:

**3.1. Create a new project using the CLI:**
  
```bash
npx @kottster/cli new my-app -id <appId> -sk <secretKey>
```
**3.2. Inside your project, run the app locally:**

```bash
npm run dev
```

**3.3. Connect the app to your database:**

```bash
# PostgreSQL
npm run dev:add-data-source postgres

# MySQL
npm run dev:add-data-source mysql

# MariaDB
npm run dev:add-data-source mariadb

# Microsoft SQL Server
npm run dev:add-data-source mssql
```

After running the command, the new file will be created inside  `src/server/data-sources/` folder. Edit the file to configure the connection to your database, and restart the server.

#### **4.** Start building your app:
- Use our builder to generate pages and features instantly.
- Or, create and customize them on your own.

#### **5.** [Deploy your app to production](https://kottster.gitbook.io/docs/get-started/deploying-app-to-production) when it's ready.

## Resources

- [Documentation](https://kottster.gitbook.io/docs)
  - [Quickstart](https://kottster.gitbook.io/docs)
  - [Deploy app to production](https://kottster.gitbook.io/docs/get-started/deploying-app-to-production)
  - [Building an app](https://kottster.gitbook.io/docs/building-an-app)
 
## Need Help?

- [Contact us](https://kottster.app/contact-us)
- [team@kottster.app](mailto:team@kottster.io)

## License

Kottster is licensed under the terms of [Apache License 2.0](https://github.com/kottster/kottster/blob/main/LICENSE).
