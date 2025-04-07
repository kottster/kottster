---
sidebar_position: 4
---

# Deploying

You can deploy your Kottster app using a cloud provider, self-host it on a Node.js server, or run it with a Docker image. Since it's basically a Remix app, you can deploy it anywhere Remix apps are supported.

**Before starting the app in production mode, you need to build it first:**

```
npm run build
```

This compiles the app and stores it in the `build` directory. 

**Once built, you can start the app in production mode:**

```
npm run start
```

Unlike in development mode, the production app is optimized for performance and doesn’t support live changes to the code, pages, or configuration.


## Cloud providers

- [Vercel](https://vercel.com/docs/frameworks/remix#getting-started)
- [Fly.io](https://fly.io/docs/js/frameworks/remix/#deploy-a-remix-app)
- [Railway](https://railway.com/template/remix)
- [Netlify](https://www.netlify.com/blog/how-to-deploy-remix-apps-on-netlify/)
- [Render.com](https://render.com/docs/deploy-remix)
- [Other options](#self-hosting)

## Self-hosting

### Method 1. Node.js Server

#### Requirements

To deploy your Remix app to a server, ensure your server has [Node.js](https://nodejs.org/en) installed (version v20 or above). 

#### Running a server

After installing all dependencies, run a Remix server using `npm run start`. By default, it will run on port `5480`, but you can change it by setting up an environmental variable `PORT`.

### Method 2. Docker Image

Create the following Dockerfile in the project directory:

```dockerfile
FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5480
CMD ["npm", "start"]
```

#### Build your Docker image

Run `docker build -t your-app-name .` in your project directory.

#### Deploy or Run Your Docker Container

You can now deploy this image wherever you want. 

To run it locally, use the command:

```bash
docker run -d -p 5480:5480 your-app-name
```
This starts your app in a container, setting necessary environment variables.
