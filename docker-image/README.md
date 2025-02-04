# README

## Build

```
docker build -t kottster .
```

## Run

```
docker run -it --name my-kottster-app kottster new .
docker run -it --name my-kottster-app kottster dev
```

## Delete container

```
docker ps -a

docker rm <container-id>
```