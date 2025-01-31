title: Banishing npm
tags: javascript
author: FND
created: 2023-04-23
syntax: true

```intro
npm is
[slow](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-4/),
unwieldy and unsafe. Deno can now serve as a drop-in replacement for front-end
development environments.
```

Given the
[state of the ecosystem](https://infrequently.org/series/performance-inequality/),
I've long accepted that `npm install` now constitutes an
[antipattern](https://twitter.com/slightlylate/status/1238122890450485248). At
the same time, getting by entirely without npm packages can be tricky for web
projects: Even if you renounce bundling and have not given in to the framework
craze, you might still want to ensure stylistic consistency with a linter and
perhaps even use a code formatter.[freedom](footnote://) Such tools are
typically distributed via npm's registry.

```footnote freedom
As someone with notorious
[stylistic predilections](https://github.com/FND/eslint-config) myself, I
sympathize with anyone hesitant to relinquish control here. However, the
benefits of creative freedom at this level rarely outweigh its costs -- so it's
usually worth readjusting individual pattern recognition and focusing one's
energy on more important matters. That might also mean accepting the occasional
infuriating adjustment to appease automated tooling.
```

After being quite skeptical at first, I've come around to appreciating Deno.
That started with its seamless TypeScript integration, which is _much_ more
pleasant than in other environments (TypeScript itself notwithstanding): It
feels _native_; there's very little friction there. Along the same vein, Deno
comes with a built-in linter and code formatter -- both of which are pretty fast
too, making for a fairly pleasant experience overall.

By comparison, making everyone -- people (myself included) as well as machines
(think CI) -- install ESLint and/or Prettier is a hassle at best and
irresponsible at worst.

Given all that, I've recently gotten rid of npm-the-CLI entirely for one of my
front-end projects: A single-page application composed of various widgets.
Using web components with vanilla JavaScript, I've managed to get by without any
third-party dependencies for runtime functionality -- yet I opted to use
esbuild[bundling](footnote://) in addition to enforcing stylistic consistency.

```footnote bundling
Mostly because loading ESM requires HTTP, which can be a different kind of
hassle: Bundling allows users to load the application directly from disk (i.e.
`file://…/app.html`), without setting up any kind of server.

esbuild is fairly lightweight, fast and straightforward. Most importantly, it
doesn't tempt you into shaping source code after proprietary idiosyncrasies of
the build system.
```

With [recent versions of Deno](https://deno.com/blog/package-json-support), I
could finally do this:

> replaced npm with Deno
>
> now that Deno supports `package.json` (both scripts and dependencies),
> we can use it as a drop-in replacement: it's significantly faster and
> generally less of a hassle
>
> NB: esbuild invocations need to reside within `package.json` (for now?)

Corresponding getting-started instructions:

> * ensure [Deno](https://deno.land) is installed
>
> * `deno task check` checks code for stylistic consistency
>
>   `deno fmt` can be used to automatically format code
>
> * `deno task build` performs a one-time compilation
>
>   `deno task dev` automatically recompiles while monitoring code changes
>
> * `deno test` runs the test suite

As noted above, `package.json` and `deno.json` are working in tandem:

```figure filename=package.json
'''json
{
    "scripts": {
        "build": "esbuild ./src/index.js --bundle --format=esm --outfile=dist/bundle.js"
    },
    "dependencies": {},
    "devDependencies": {
        "esbuild": "^0.17.18"
    }
}
'''
```

```figure filename=deno.json
'''json
{
    "tasks": {
        "check": "deno fmt --check && deno lint",
        "dev": "deno task build --watch=forever"
    },
    "fmt": {
        "include": ["./src", "./test"],
        "lineWidth": 90,
        "useTabs": true,
        "indentWidth": 4
    },
    "lint": {
        "include": ["./src", "./test"],
        "rules": {
            "exclude": ["prefer-const"]
        }
    },
    "test": {
        "include": ["./test"]
    }
}
'''
```

Admittedly, having both of those config files is a little awkward and
contributes to root-directory pollution, but it's a worthwhile tradeoff (plus we
no longer need root-level config files for ESLint/Prettier). There's another
wart though: Deno still creates a `node_modules` directory, consisting only of
symlinks. 🤷

As you might have gathered, I'm using Deno not as a runtime here, merely
employing it as development tooling for a browser-based application. While
ignoring its original purpose might seem odd, that actually makes perfect sense
in this context -- and it certainly feels much more sensible than the previous
setup.

```ref replaceability
This approach also avoids becoming overly
[dependent on Deno](https://www.baldurbjarnason.com/2024/disillusioned-with-deno/):
Replaceability is an important factor for projects'
[long-term sustainability](https://adactio.com/journal/20564). It should be
fairly straightforward and painless to substitute this auxiliary tooling with a
different setup in the future, should that become necessary.
```
