---
description: "Project structure overview for Kottster apps. Learn about the purpose of each file and folder in your Kottster project."
---

# Project structure

This page explains the purpose of each file and folder in your project.

- ## `app/`

    The main directory where your Kottster app lives. It contains all the files and folders needed to run your app.

  - ### `index.html`
        
      The HTML template for your app. It defines the structure of the HTML document, including the `<head>` and `<body>` sections.
  
  - ### `main.jsx`

      The root component of your React application. It initializes the app and renders the main component tree.

  - ### `pages/`

      Contains all your app's pages. Each folder corresponds to a page in the app. The folder name is used as the URL path.

      Each page should have its own folder with the following files:
      - `page.json` - Contains the page configuration
      - `index.jsx` - Contains the frontend React component
      - `api.server.js` - Contains the backend controller logic

      The `page.json` is required for each page, while the other two files are optional. You will usually need them only for custom pages that require specific logic or customization.

      Example structure:
      ```
      pages/
      ├── order-management/
      │   ├── page.json
      ├── user-management/
      │   ├── page.json
      │   ├── index.jsx
      └── dashboard/
          ├── page.json
          ├── index.jsx
          └── api.server.js
      ```
  
  - ### `_server/`

      Contains server-side files.

      - #### `app.js`

          The file with app initialization logic. It creates a new Kottster app instance with all the configuration.

      - #### `server.js`

          The file that imports the app instance and starts the server.

      - #### `data-sources/`

          Contains files with [data sources](./data-sources.md).

          Each data source should have its own folder with the following files:
          - `dataSource.json` - Contains the data source configuration
          - `index.js` - Connects to the database and exports the data source instance

  - ### `public/`

      The optional directory where you store static assets like images, fonts, and other files.

- ## `kottster-app.json`

    A JSON file that contains the Kottster app schema including the app's metadata and navigation structure.

- ## `vite.config.js`

    The configuration file for Vite build tool. It defines how your app is built and served, including plugins and optimizations.

- ## `package.json`

    Specifies the packages your app needs to run and how to build or start it.

- ## `tsconfig.json`

    Specifies TypeScript configuration options, such as type-checking rules, paths, and compiler settings. You only need this file if you're using TypeScript.