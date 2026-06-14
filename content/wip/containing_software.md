title: Containing Software
tags: miscellaneous
author: FND
created: 2026-06-14
syntax: true

```intro
Software is not to be trusted. Container virtualization can help alleviate
historical oversights in security architecture by revoking otherwise unchecked
privileges.
```

There are many reasons nobody should ever run `npm install`.[npm](footnote://)
The same is true for many other package-mangement systems or, really, any kind
of command. Yet this industry subsists on working against our better judgment,
so sometimes that's inevitable.

```footnote npm
Even
[updated defaults](https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12/),
while welcome, don't really change this calculation.
```

In such cases, we might resort to containerization, which at least limits
semi-trusted commands to a controlled environment. In its most basic form, we
might use one-off containers -- for example, spinning up an Arch Linux system:

```shell
$ podman run --rm --interactive --tty \
        archlinux/archlinux:base-devel sh
```

Here we can play around with the command line, largely without worrying about
consequences for our host system: With this setup, what happens inside the
container stays inside the container -- which is discarded after use.

That's not what we want in this context though: Typically we want to effect
changes within the host's file system, specifically within the current working
directory -- so we mount that as volume to make it available from within the
container:

```shell
$ podman run --rm --interactive --tty --userns keep-id \
        --volume "$PWD:/home/dev" \
        --workdir "/home/dev" \
        archlinux/archlinux:base-devel sh
```

For convenience, we also use that shared directory as our working directory
within the container. `--userns keep-id` ensures that file permissions
correspond to the host system's when modifying our shared directory.

Thus we can run `npm install` within the container to share the gravitational
burden of `node_modules` with the host system.

Except Node isn't actually available within that image. Let's build our own:

```figure filename=Containerfile.node
'''docker
FROM alpine:latest

RUN apk update
RUN apk upgrade

RUN apk add nodejs
RUN apk add npm

RUN adduser -D peon
USER peon
'''
```

```shell
$ podman build --pull=always \
        --tag dev:node - < Containerfile.node
```

Because we don't want our container to depend on any additional files, we use an
empty build context here.

We've called this image `dev:node`, so we can use that to launch our Node
container:

```shell
$ podman run --rm --interactive --tty --userns keep-id \
        --volume "$PWD:/home/dev" \
        --workdir "/home/dev" \
        dev:node sh
```


```disclosure caption="Reusable shell script" backticks=^^^
^^^figure filename=containerize
'''shell
#!/usr/bin/env sh

set -eu

name="fndev"

platform="${1:?missing positional argument for platform}"
tag="$name:$platform"

if [ "${2:-""}" = "rebuild" ]; then # XXX: crude
    shift
    echo "building container image"
    podman build --pull=always --tag "$tag" - < "Containerfile.$platform"
fi

hwd=${2:-"$PWD"}
cwd="/home/$name"

podman run --rm --interactive --tty --userns keep-id \
        --volume "$hwd:$cwd" --workdir "$cwd" \
        "$tag" sh
'''
^^^
```
