title: Docker
tags: miscellaneous, shell
author: FND
created: 2025-07-14
syntax: true


One-Off Containers
------------------

```shell
$ docker run --rm -it "$image" sh
```

* `$image` might be `alpine`, `node:latest` etc.
* `-v "$PWD:/tmp/dev"` mounts the current working directory within the container
* `-e VARIABLE=…` sets environment variables

alternatively using a local `Dockerfile`:

```shell
$ docker run --rm -it $(docker build -q .)
```


Interactive Debugging
---------------------

```shell
$ docker exec -it "$name" sh
```

connects to a running container identified by `$name`


Cleaning Up
-----------

* tabula rasa: `docker system prune` and `docker volume prune`
* kill running containers: `docker ps -q | xargs docker kill`
* delete stopped containers: `docker ps -aq | xargs docker rm`
* delete untagged images: `docker images -q -f dangling=true | xargs docker rmi`
  (omitting `-f dangling=true` will remove all images)


Podman
------

[Podman](https://podman.io) mostly works as a drop-in replacement for Docker.

```shell
$ podman machine init
```

```shell
$ podman machine start
$ export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
```

```shell
$ podman container prune
$ podman image prune
$ podman machine rm
```
