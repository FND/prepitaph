title: Git
tags: miscellaneous, shell
author: FND
created: 2024-07-08
syntax: true


Altering Commit Dates
---------------------

```shell
$ (export GIT_COMMITTER_DATE="1970-01-01 00:00:00"; \
        git commit --amend --date="$GIT_COMMITTER_DATE")
```

(The parentheses spawn a subshell, which is required for the environment
variable to take effect.)

```shell
$ git log --format="%h [%cd] %ad %s"
```

This reveals both commit and authoring dates.


Worktree
--------

Reifies a branch in a separate directory, without a separate repository clone:

```shell
$ git worktree add "$directory" "$branch"
$ git worktree remove "$directory"
```


Orphan Branches
---------------

```shell
$ git symbolic-ref HEAD refs/heads/my-branch
```


GitHub Pull Requests
--------------------

Checking out locally:

```shell
$ git fetch origin pull/<ID>/head:<branch>
```
