---
description: "Quickstart guide for Kottster using Docker. Learn how to set up your Kottster app with Docker Compose or Docker commands."
---

# Quickstart with Docker

This guide provides two methods to get started with Kottster:
- **Option 1:** Using Docker Compose (recommended for most users)
- **Option 2:** Using Docker commands directly

Both the `Dockerfile` and `docker-compose.yml` are already included in the repository for your convenience.

## Option 1: Using Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/kottster/kottster-template-js my-kottster-app

cd my-kottster-app
```

### 2. Start the container

```bash
docker-compose up -d
```

> **IMPORTANT:** The `-d` flag is crucial as it runs the container in detached mode (background). Without this flag, your terminal will be locked to the container's output, and you won't be able to run the next command to start the application.

### 3. Start the application

**Development mode:**
```bash
docker exec -it my-kottster-container /dev.sh
```

**Production mode:**
```bash
docker exec -it my-kottster-container /prod.sh
```

### 4. Container Management

**Stop the container:**
```bash
docker-compose down
```

**View container logs:**
```bash
docker-compose logs
```

## Option 2: Using Docker Commands

### 1. Clone the repository

```bash
git clone https://github.com/kottster/kottster-template-js my-kottster-app

cd my-kottster-app
```

### 2. Build the Docker image

```bash
docker build -t my-kottster-app .
```

### 3. Run the container

```bash
docker run -d --name my-kottster-container \
  -p 5480:5480 -p 5481:5481 \
  -v $(pwd):/app \
  -v /app/node_modules \
  my-kottster-app
```

> Here's what each flag does:
> - `-d` - Run the container in the background
> - `--name my-kottster-container` - Assign a name to the container
> - `-p 5480:5480 -p 5481:5481` - Map the container ports to the host machine
> - `-v $(pwd):/app` - Mount the current directory to the `/app` directory in the container
> - `-v /app/node_modules` - Mount the `node_modules` directory to the container

### 4. Start the app

**Development mode:**
```bash
docker exec -it my-kottster-container /dev.sh
```

**Production mode:**
```bash
docker exec -it my-kottster-container /prod.sh
```

### 5. Container management

**Stop the container:**
```bash
docker stop my-kottster-container
```

**Remove the container:**
```bash
docker rm my-kottster-container
```

**View container logs:**
```bash
docker logs my-kottster-container
```

## Development

The container is configured to synchronize your local codebase with the container. Any changes made to your local files will be immediately reflected in the running application.

## Configuration

### Customizing Ports

#### With Docker Compose:
Edit the `ports` section in your `docker-compose.yml` file:

```yaml
ports:
  - "<host-port>:5480"
  - "<host-port>:5481"
```

#### With Docker commands:
Modify the `-p` flags in the Docker run command:

```bash
docker run -d --name my-kottster-container \
  -p <host-port>:5480 -p <host-port>:5481 \
  -v $(pwd):/app \
  -v /app/node_modules \
  my-kottster-app
```