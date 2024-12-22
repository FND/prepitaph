title: Test Automation with Deno
tags: javascript, testing
author: FND
created: 2024-07-19
updated: 2024-07-26
syntax: true

As previously mentioned, I've
[cautiously](page://articles/banishing-npm#ref:replaceability) come to
appreciate Deno's development tooling. This sometimes includes using its test
runner, mostly because it's both simple and readily available while adhering to
common conventions.

Nevertheless, there are a few idiosyncratic details and conventions worth
pointing out -- if only to reduce friction and lower the barrier to pursuing
[test-driven development from the get-go](https://kellysutton.com/2017/04/18/design-pressure.html).
In fact, for our purposes here, I'll recklessly expand the definition of
"testing" to include static verification: formatting and linting for stylistic
consistency as well as optional type checking -- thus establishing some basic
infrastructure for any JavaScript project, regardless of size or ambition.

```aside
There are a few bonus features, like [WinterCG](https://wintercg.org)
compatibility and native TypeScript support, which make Deno a nifty runtime
environment for tests without risking replaceability.

[Test isolation](https://deno.com/blog/v1.10#improvements-to-deno-test) not only
helps with performance, but also tends to make tests more robust by avoiding
implicit dependencies.
```

```aside
'''disclosure caption="README template" backticks=^^^
^^^
Contributing
------------

*   ensure your editor supports [EditorConfig](https://editorconfig.org)

*   ensure [Deno](https://deno.com) is installed

*   `deno task vet` checks code for stylistic consistency

    `deno fmt` can be used to automatically format code

*   `deno task verify` performs static type checking

*   `deno test` runs the test suite (optionally with `--parallel` or `--watch`)
^^^
'''
```


Tasks
-----

```figure filename=deno.json
'''json
{
    "tasks": {
        "vet": "deno lint && deno fmt --check",
        "verify": "deno check --import-map ./deno.json ./src"
    },
    // …
}
'''
```

These two designations aren't perfect, but were chosen to avoid overloading
terms already reserved for Deno standard commands.

If we require custom TypeScript configuration, e.g. to
[avoid TypeScript syntax](https://prepitaph.org/articles/typed-javascript/), we
can pass that to `deno check` via `--config ./tsconfig.json`.

```aside
'''disclosure caption="typical TypeScript configuration" backticks=^^^
^^^figure filename=tsconfig.json backticks=~~~
~~~json
{
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "noEmit": true,
        "strict": true,
        "isolatedModules": true
    }
}
~~~
^^^
'''
```

My shell history typically includes this combo:

```shell
$ deno task vet && deno task verify && deno test --parallel
```


Co-Located Tests
----------------

I've accepted the value of reduced
[distance](https://en.wikipedia.org/wiki/Action_at_a_distance_%28computer_programming%29)
by having test modules reside alongside the respective implementation (e.g.
`src/util.js` and `src/util.test.js`).

Nevertheless, for overarching scenarios, a separate top-level `test` directory
can be a useful addition.


Behavior-Driven Development (BDD)
---------------------------------

While I'm not a fan of BDD nomenclature and grammar, Deno's
[default approach](https://docs.deno.com/runtime/manual/basics/testing/#writing-tests)
lacks familiar
[hooks](https://docs.deno.com/runtime/manual/basics/testing/behavior_driven_development/#hooks)
for setup and teardown -- so I typically end up using BDD style anyway.


Import Maps
-----------

For consistency, we want to define
[standard-library URLs](https://docs.deno.com/runtime/manual/basics/standard_library/#versioning-and-stability)
in one central place, ensuring we're using the same version throughout. While we
might create a proxy module which just selectively re-exports the respective
functionality, that quickly becomes annoying and a bit of a maintenance burden.

Deno's support for
[import maps](https://docs.deno.com/runtime/manual/basics/import_maps/) makes
this pretty simple though:

```figure filename=deno.json
'''json
{
    "imports": {
        "$deno/": "https://deno.land/std@0.224.0/"
    },
    // …
}
'''
```

```javascript
import { describe, it } from "$deno/testing/bdd.ts";
import {
    assertEquals as assertDeep,
    assertStrictEquals as assertSame,
} from "$deno/assert/mod.ts";

describe("calculator", () => {
    it("supports numbers", () => {
        assertSame(5 * 5, 25);
        assertDeep([3, 2, 1].toReversed(), [1, 2, 3]);
    });
});
```

```aside compact
The asserts' (re)naming convention there is an attempt to emphasize
[strict equality](https://docs.deno.com/runtime/manual/basics/testing/assertions/#equality).
YMMV.
```

`deno test` will pick this up automatically, substituting `$deno/` within
`import` statements accordingly. However, `deno check` currently requires
explicitly adding `--import-map ./deno.json` and emits spurious warnings about
supposedly invalid top-level keys within that file. 🤷

Note that editors and other tooling might not be aware of import maps within
`deno.json` by default.
