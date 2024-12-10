title: Augmenting JavaScript with Static Typing
tags: javascript, typescript
author: FND
created: 2023-10-01
syntax: true

```intro
As we've learned from the
[brouhaha](https://changelog.com/jsparty/292#transcript-25) around Svelte's use
of TypeScript, JSDoc makes it possible to write plain JavaScript while getting
the benefits of static typing.
```

I'm on the record as being dubious about the cost-benefit ratio of static
typing, but have come around to appreciating its value in some situations.
TypeScript in particular makes this more palatable, though it still comes at a
heavy cost -- much of it borne by users no less.

While I've long had reservations about JSDoc, based on ergonomics and personal
aesthetics, in this particular context its costs are typically much lower and
more localized. So when typing is warranted,
[moving type definitions into JSDoc](https://alexharri.com/blog/jsdoc-as-an-alternative-typescript-syntax)
seems like a reasonable approach. (This isn't an entirely new idea of course:
Both Closure Compiler and Flow did pretty much the same thing to maintain syntax
compatibility.)

Once we get past superficial sensibilities, this approach enables us to directly
execute our source code, without requiring any transformations, in browsers and
other JavaScript runtime environments (think unit tests). Such parity can
greatly reduce overall complexity, as we don't need out-of-band build systems
(which always come with setup and maintenance costs of their own) and avoid
indirections that complicate debugging.

Let's start with the inevitable `tsconfig.json` (a
[potential quagmire](https://docs.deno.com/runtime/manual/advanced/typescript/configuration)
unto itself), if only for editors' benefit:

```json
{
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "noEmit": true,
        "strict": true,
        "isolatedModules": true
    }
}
```

The first two options make the compiler ingest JavaScript files, `noEmit`
relegates it to be a mere type checker -- thus runtime code remains unaffected.
Strictness is a matter of taste, but a good default for new projects. Similarly,
[isolated modules](https://www.typescriptlang.org/tsconfig/#isolatedModules)
seems like good hygiene in this context.

With that in place, we might [invoke](page://articles/banishing-npm) the
`typescript` package's compiler via `tsc --project ./tsconfig.json`. Of course
we still need actual source code -- enter `index.js`:

```javascript
import { analyze } from "./util.js";

let res = analyze({
    hello: 123,
    world: 456
});
console.log(res);
```

This is all vanilla JavaScript; `util.js` is a bit more interesting:


```javascript
/**
 * @param {Record<string, number>} item
 * @param {boolean} [verbose]
 * @returns {Result}
 */
export function analyze(item, verbose) {
    console.log("analyzing", item);
    /** @type {Result} */
    let res = { status: "ok" };
    return verbose ? {
        ...res,
        elapsed: 123
    } : res;
}

/** @import { Result } from "./util.types.ts" */
```

That's still vanilla JavaScript, but augmented with
[JSDoc annotations](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
referencing TypeScript constructs, allowing for type checking beyond mere
inference. Note that we're using such annotations both for the function
signature and within the function body.[syntax](footnote://)

```footnote syntax
Brackets make `verbose` optional, the rest should be self-explanatory:
Trailing identifiers in comments correspond to those in the signature, types are
enclosed in braces.
```

The equivalent TypeScript code might look like this:

```typescript
import { type Result } from "./util.types.ts";

export function verify(item: Record<string, number>,
        verbose?: boolean): Result {
    console.log("analyzing", item);
    const res: Result = { status: "ok" };
    return verbose ? {
        ...res,
        elapsed: 123
    } : res;
}
```

(An explicit type annotation is required for `res` to appease the compiler;
otherwise it considers the `status` property to be an arbitrary string.)

At the bottom[ordering](footnote://) we import a more complex type definition
from another file -- which is a regular TypeScript module[modules](footnote://):
That's perfectly fine here because it _only_ contains type definitions, which
are not relevant for runtime execution.

```typescript
export interface Result {
    status: "ok" | "fail";
    elapsed?: number;
}
```

```footnote ordering
I prefer modules to declare their most important stuff at the top (ask me about
the lack of `class` hoisting sometime... ) and consider type definitions to be
merely supplemental, thus they're relegated to the bottom.
```

```footnote modules
As I understand it, using `.ts` modules instead of `.d.ts` declaration files is
recommended because it avoids scoping issues.
```

```ref friction
A somewhat unexpected advantage of this approach could be _increased_ friction:
Clearly separating types from runtime code might leave us less inclined to
produce complexity only for static typing's sake.
```

```infobox
After living with such a setup for a couple of months, this offhand prediction
proved true to an astonishing extent: The mental shift is palpable and, to my
own surprise, led to a much improved code base overall.
```
