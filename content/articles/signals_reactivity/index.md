title: Signals for Reactivity
tags: web, javascript
author: FND
created: 2023-05-29
syntax: true
_origin_: https://gist.github.com/FND/34f76fa4cd8b70dc257dc693ae2119eb

```intro
Having been roped into dealing with the excesses of [RxJS](https://rxjs.dev)
lately, I'd been wondering about Angular folks'
[excitement about signals](https://twitter.com/sarah_edo/status/1628065696247857152).
So I finally sat down in an effort to understand the furor.
```

While I didn't entirely grok
[Preact's explanation](https://preactjs.com/blog/introducing-signals/) the first
time around (after all, I typically try to minimize client-side state), I knew
their signals library is both tiny and framework-agnostic -- providing a
suitable foundation for a
[minimal test case](https://css-tricks.com/reduced-test-cases/).

I went with the now stereotypical example of a counter and added two types of
historical visualization: A basic log recording current and past values as well
as a histogram-style chart of the respective trend (up or down).

```markdown allowHTML
<iframe src="./demo.html"></iframe>
```

```aside compact
This example helped _me_ get _my_ head around it all. There are plenty of other,
likely better introductions
[out there](https://syntax.fm/show/614/wtf-are-signals-and-why-is-everyone-so-hot-on-them-all-of-the-sudden).

You'll note that DOM operations are append-only; more complex scenarios are out
of scope here.
```

Using signals means we need to wrap any values which, upon changing, should
result in something happening elsewhere. Here everything revolves around that
one numeric value:

```javascript
import { signal } from "@preact/signals-core";

let INITIAL_VALUE = randomInt(1, 100);

let counter = signal(INITIAL_VALUE);

// returns a random integer within the given bounds (both inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

```aside compact
If you wanna follow along without the hassle of bundling, replace the module
specifier (i.e. `@preact/signals-core`) with
`https://esm.sh/@preact/signals-core`.
```

For simplicity, let's automate changes instead of creating an interactive UI:

```javascript
let FREQUENCY = 1000;

setInterval(() => {
    counter.value = randomInt(1, 100);
}, FREQUENCY);
```

As you can see, in order to access our numeric value, we need to use the
eponymous property of our wrapper object. That allows the underlying library to
[detect changes](https://github.com/preactjs/signals/blob/%40preact/signals-core%401.3.0/packages/core/src/index.ts#L312)
so it can automatically notify whoever is interested in this
value.[svelte](footnote://)

```footnote svelte
This is pretty much
[how Svelte works](https://svelte.dev/blog/svelte-3-rethinking-reactivity) too,
except they rely on a compiler to figure this out.
```

Of course, nobody actually seems to be interested. Let's rectify that:

```javascript
import { effect } from "@preact/signals-core";

effect(() => {
    let timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] counter is at ${counter.value}`);
});
```

Whenever the counter changes, we emit its latest value on the console.

By virtue of reading `counter.value` _and_ wrapping corresponding operations in
an `effect` callback, we enable the library to mark this function as dependent
on our signal. Whenever a signal's value changes, dependent callback functions
are notified -- meaning they are invoked once more.

This is the equivalent of notifying subscribers in an event-based system, except
it turns the whole thing on its head by automatically determining who subscribes
to what. I suspect this can be both wonderful and infuriating: Relationships
here are rather more implicit than events' "if `$event` then `$effect`"
subscriptions[implicit](footnote://), possibly complicating analysis and
debugging. More subtly, the use of signals might conceivably result in
performance issues as people liberally access signals' values without
considering the ramifications under the hood.

```footnote implicit
In our sample above, `counter.value` appears somewhat hidden within that
template literal, so it's not immediately obvious what that callback function
depends on.
```

On the value-producing side, instead of assigning a random integer with each
iteration, we might want to increment or decrement our counter:

```javascript
setInterval(() => {
    let x = counter.value;
    counter.value = Math.random() < 0.5 ? x - 1 : x + 1;
}, FREQUENCY);
```

Even though we're reading `counter.value` here, because we're not using `effect`
this function is _not_ marked as dependent on the signal. In fact, it'd be a
little more
[efficient](https://github.com/preactjs/signals/blob/%40preact/signals-core%401.3.0/packages/core/src/index.ts#L300),
and arguably more correct and explicit, to employ
[`.peek()`](https://preactjs.com/guide/v10/signals/#reading-signals-without-subscribing-to-them)
in this instance: `let x = counter.peek();`

We were promised visualizations earlier, so we should at least replace console
logging with DOM elements:

```javascript
import { effect } from "@preact/signals-core";

let log = document.createElement("ol");
document.body.appendChild(log);

effect(() => {
    let timestamp = new Date().toISOString().substring(11, 19);
    let el = document.createElement("li");
    el.textContent = `[${timestamp}] counter is at ${counter.value}`;
    log.prepend(el);
});
```

We also wanted to get an idea of whether values are rising or falling; we can
express that via an additional signal:

```javascript
import { signal } from "@preact/signals-core";

let FREQUENCY = 1000;
let INITIAL_VALUE = randomInt(1, 100);

let counter = signal(INITIAL_VALUE);
let trend = signal(null);

setInterval(() => {
    let x = counter.peek();
    if(Math.random() < 0.5) {
        counter.value = x - 1;
        trend.value = "📉";
    } else {
        counter.value = x + 1;
        trend.value = "📈";
    }
}, FREQUENCY);
```

... which we then use for a simplistic histogram:

```javascript
let chart = document.createElement("output");
document.body.appendChild(chart);

effect(() => {
    let { value } = trend;
    if(value) {
        chart.textContent += value;
    }
});
```

You'll note that this only updates if the trend reverses rather than with every
change. That's due to a design decision by Preact Signals, which (quite
reasonably) uses an
[equality check](https://github.com/preactjs/signals/blob/%40preact/signals-core%401.3.0/packages/core/src/index.ts#L317)
to ensure the respective value has actually changed before notifying
subscribers. Thus `trend.value = "📈"` is effectively ignored if the value was
the same before. In this case, we can work around that by assigning an object
instead:

```javascript
    if(Math.random() < 0.5) {
        // …
        trend.value = { symbol: "📉" };
    } else {
        // …
        trend.value = { symbol: "📈" };
    }
```

```javascript
effect(() => {
    let { value } = trend;
    if(value) {
        chart.textContent += value.symbol;
    }
});
```

With this, we're also being notified for recurring values (because it's always a
new object, so not the same value as far as JavaScript is concerned).

Our DOM log above barely counts as a visualization, so we might wanna add the
trend in there. That means our log now depends on two distinct signals -- which
we might combine in a composite signal:

```javascript
import { computed, signal } from "@preact/signals-core";

// …

let summary = computed(() => {
    let timestamp = new Date().toISOString().substring(11, 19);
    let symbol = trend.value?.symbol || "";
    return `${symbol} [${timestamp}] counter is at ${counter.value}`.trim();
});
```

```javascript
effect(() => {
    let el = document.createElement("li");
    el.textContent = summary.value;
    log.prepend(el);
});
```

`summary` depends on both `counter` and `trend`, so changes to either will
result in `summary` being recalculated, which is used by and thus updates
our little DOM component. While it might be overkill in this minimal sample,
distinguishing data model and GUI representation is generally good for
separation of concerns.

We're pretty much done here. There's one final performance optimization we might
consider for our value producer:

```javascript
import { batch, computed, signal } from "@preact/signals-core";

// …

setInterval(() => {
    let x = counter.peek();
    let [count, symbol] = Math.random() < 0.5 ? [x - 1, "📉"] : [x + 1, "📈"];
    batch(() => {
        counter.value = count;
        trend.value = { symbol };
    });
}, FREQUENCY);
```

Wrapping multiple signal assignments in `batch` combines simultaneous
notifications, rather than notifying subscribers multiple times in a row.

Overall, signals seem potentially useful and Preact Signals looks like an
excellent implementation -- not just for single-page applications, but also for
progressively enhanced components within a regular web page. I'll probably stick
with vanilla DOM events for most cases though.
