title: Code Splitting for Humans
tags: javascript
author: FND
created: 2023-12-10
syntax: true

```intro
JavaScript bundles don't need to be monolithic, even without surrendering
control to inscrutable algorithms. Here's an approach for _explicitly_ sharing
code between multiple bundles.
```

Even in 2023, the
[laws of physics](https://www.innoq.com/en/blog/loading-javascript/) compel us
to consider bundling JavaScript modules, optimizing our source code for
[end users' benefit](https://www.w3.org/TR/html-design-principles/#priority-of-constituencies).
Consequently, we should also be cognizant of what constitutes core
functionality[core-functionality](footnote://) and what might be deferred via
lazy loading to improve responsiveness and limit resource usage.

```footnote core-functionality
While we're already in the realm of client-side scripting here, the concept
isn't entirely unrelated to Jeremy Keith's
[seminal description of core functionality vs. subsequent enhancements](https://adactio.com/journal/7774)
(also available as
[video recording](https://www.youtube.com/watch?v=t0dUvs3jQnw&t=30m)): We should
consciously make that distinction, which typically requires a good understanding
of both the domain and the
[medium we're working in](https://resilientwebdesign.com/chapter2/#material%20honesty).
```

In order to keep things simple, let's say our core functionality is limited to
logging a bit of concocted state:

```figure filename=index.core.js
'''javascript
import { log } from "./util.js";

let items = ["foo", "bar", "baz"];

log("CORE", "hello world", items);
'''
```

```figure filename=util.js
'''javascript
export function log(prefix, ...msg) {
    console.log(`[${prefix}]`, ...msg);
}
'''
```

We might then use [esbuild](https://esbuild.github.io), for example, to combine
those source modules into a single bundle:

```shell
$ esbuild --bundle --outfile=./bundle.js ./index.core.js
```

Next we'll introduce some auxiliary functionality:

```figure filename=index.aux.js
'''javascript
import { distance } from "./trig.js";
import { log } from "./util.js";

log("AUX", "Δ", distance(5, 7));
'''
```

```figure filename=trig.js
'''javascript
export function distance(dx, dy) {
    return Math.sqrt(dx ** 2 + dy ** 2);
}
'''
```

While we could add this to our existing bundle, we know it's not essential
functionality and can easily be loaded on demand. (Obviously the assumption here
is that we're dealing with more than just a few lines of code; everything is a
trade-off.) We also don't want to bundle this separately, as it would result in
`util.js` being duplicated across two independent bundles.

![
    module dependencies: core depends on util, aux on util and trig
](./dependencies.png)

So let's try
[automatic code splitting](https://esbuild.github.io/api/#splitting):

```shell
$ esbuild --bundle --format=esm --splitting \
        --outdir=./dist ./index.*.js
```

This generates three bundles within the `dist` directory: `bundle.core.js`,
`bundle.aux.js` and `chunk-OL7DPBDR.js`. (That's a lie: The actual file names
within `dist` are _also_ `index.core.js` and `index.aux.js` -- we wanna avoid
that ambiguity in this context.)

Here we have our two entry points and a module shared by both. The latter
contains `util.js`'s `log` function, as it's used by both entry points.
Consequently, both of those entry points now include this line:

```javascript
import { log } from "./chunk-OL7DPBDR.js";
```

Other than that, `bundle.core.js` looks just like its original source module.
`bundle.aux.js`, on the other hand, now includes `trig.js`.

![
    bundles: both core and aux depend on a chunk file containing log, aux also
    includes trig
](./bundles.png)

So that's a pretty decent result; we might stop here. However, while our initial
`bundle.js` was entirely self-contained, `bundle.index.js` now includes an
`import` statement, requiring an additional network request before being
operational. In other words: We've sacrificed initial-load performance to
improve efficiency for the auxiliary bundle.

Let's rectify that:

```figure filename=index.core.js
'''javascript
import { log } from "./util.js";

export { log };

let items = ["foo", "bar", "baz"];

log("CORE", "hello world", items);
'''
```

```figure filename=index.aux.js
'''javascript
import { distance } from "./trig.js";
import { log } from "./bundle.core.js";

log("AUX", "Δ", distance(5, 7));
'''
```

`bundle.core.js` now doubles as entry point and library, exposing `log` -- which
`index.aux.js` can now import from here instead. As such, `bundle.core.js`
should be fully self-contained again.

![
    bundles: core includes and exposes log, aux depends on core and includes trig
](./bundlib.png)

Unfortunately though, automatic code splitting doesn't reliably understand what
we're trying to achieve there[tools](footnote://): `log` is still relegated to a
separate chunk file. That's one example of why I'm skeptical of yielding control
to some inscrutable algorithm: The consequences are sometimes unpredictable,
especially in more complex scenarios, checking and evaluating results requires a
lot of discipline. (Sadly, few people ever check generated bundles' contents in
the first place.)

```footnote tools
At least esbuild doesn't; I have not extensively tested alternative tools
recently, being somewhat [hesitant](https://www.faucet-pipeline.org/philosophy)
to do so.
```

We can work around that though by assuming manual control:

```shell
$ esbuild --bundle --format=esm --external:./bundle.*.js \
        --outdir=./dist ./index.*.js
```

In addition to disabling automatic code splitting, we've marked `bundle.core.js`
as external so our bundler won't resolve that reference, leaving the respective
`import` statement unchanged:

```figure filename=bundle.aux.js
'''javascript
import { log } from "./bundle.core.js";

log("AUX", "Δ", distance(5, 7));

function distance(dx, dy) {
    return Math.sqrt(dx ** 2 + dy ** 2);
}
'''
```

```figure filename=bundle.core.js
'''javascript
export { log };

var items = ["foo", "bar", "baz"];
log("CORE", "hello world", items);

function log(prefix, ...msg) {
    console.log(`[${prefix}]`, ...msg);
}
'''
```

This is exactly what we'd been aiming for! But we're not quite done yet.

So far we've ignored that something needs to load that auxiliary functionality:

```figure filename=index.core.js
'''javascript
// …

log("CORE", "hello world", items);

setTimeout(async () => { // simulate on-demand loading
    log("CORE", "loading AUX");
    await import("./bundle.aux.js");
}, 1000);
'''
```

Thanks to our `bundle.*.js` exclusion pattern above, this dynamic import won't
be resolved at build time either, relying on lazy loading at runtime instead.

So `bundle.core.js` now loads `bundle.aux.js`, which in turn loads
`bundle.core.js`. It's worth noting that this last step just receives a
reference to the previously loaded module (the very same instance, if you will),
so we could even use this to share state:

```figure filename=index.core.js
'''javascript
import { log } from "./util.js";

export { log };

export let ITEMS = ["foo", "bar", "baz"];

log("CORE", "hello world", ITEMS);
'''
```

```figure filename=index.aux.js
'''javascript
import { log, ITEMS } from "./bundle.core.js";

log("AUX", ITEMS);
'''
```

Finally, if we revert our renaming lie above, ensuring that entry-point modules
and corresponding bundles use identical names, static code analysis (e.g.
linters or TypeScript) should be unfazed by this setup, interpreting imports
from `index.core.js` at the source-module level while at runtime the same
references work with bundles.

However, this manual approach also has its drawbacks: It requires a precise
understanding of which pieces of code should be shared between bundles (though
arguably we shouldn't have many such interconnections in the first place), along
with a healthy dose of discipline. Over time this, too, might result in
inefficiencies.
