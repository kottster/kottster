---
description: "Create a Kottster project in minutes with the CLI. Start building your admin panel or internal tool with ease."
---

# Quickstart

**To create a new project, run the following command:**

```bash
npx @kottster/cli@latest new
```

Make sure you have [Node.js](https://nodejs.org/en) **(v20 or above)** installed on your system. 

After running the command, the CLI will create a [folder](./project-structure.md) with your project name and install the required dependencies. 
If you want to create a project in a current folder, run `npx @kottster/cli new .` instead.

After installation is complete, change the directory to the project folder:

```bash
cd <project-name>
```

## Development server

Now you can start the development server with the following command:

```bash
npm run dev
```

This will start the server on `localhost:5480` or a different port if 5480 is already in use.

## Alternative installation using Docker

If you prefer **using Docker**, please refer to the [Docker quickstart guide](./quickstart-docker.md).


## Next steps

Now that you have your project up and running, you can start building your app:

- [Tutorial (3 min)](https://www.youtube.com/watch?v=JBpLVgkoj-k)
- [Project structure](./project-structure.md)
