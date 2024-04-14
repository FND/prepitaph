title: Garden-Variety Custom Elements
tags: web, javascript
author: FND
created: 2024-04-01
syntax: true

```intro
Custom elements are simple, but powerful. Yet they are easily misunderstood
these days, often because they're mistaken for something they were never meant
to be. Let's just look at what it is they actually do -- and don't do.
```

As an early adopter of custom elements, I always understood them to be fairly
straightforward: Back then, they mostly saved me the trouble of manually
re-initializing components after the DOM was updated by some other part of the
system (think [tabs](https://jqueryui.com/tabs/) being injected into the page).
Thus I was never tempted to confuse them with rendering libraries or even
heavyweight frameworks.

However, because technology doesn't exist in a vacuum, culture and momentum can
play an important role in how such things are
[perceived](https://en.wikipedia.org/wiki/Priming_%28psychology%29). So it's
perfectly understandable that it took a while for the concepts to
[catch on](https://cloudfour.com/thinks/html-web-components-are-having-a-moment/)
as people worked through preconceived notions; depending on your background, the
idea and benefits of custom elements might not be immediately obvious.

I recently
[heard](https://podrocket.logrocket.com/html-web-components-chris-ferdinandi?t=611)
a suggestion that we might need an educational playground like
[Flexbox Froggy](https://flexboxfroggy.com). I'm not aware of anything like
that, but it's a compelling idea: I frequently find myself explaining custom
elements and web components in an ad-hoc fashion, so I could really use a
concise resource to point to. Unfortunately, I don't have the wherewithal to
even approximate that interactive tutorial's style or quality (not least because
this field is less deterministic) -- however, I can at least try summarizing
the fundamentals; a different kind of
[primer](page://articles/lazy-custom-elements), if you will.


It's Just HTML
--------------

At their core, custom elements are just HTML elements with funny names. Authors
can make up an element name and use it in their documents without asking for
permission:

```html
<p>I talked to <cool-person>Les</cool-person> the other day.</p>
```

By convention,
[custom names](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)
should use hyphens, mostly to avoid conflicts with standardized elements (both
current and future). Other than that, browsers and other HTML parsers basically
don't care; they tolerate unknown elements and treat them much like `<span>`s.

Of course this means there's no inherent significance to custom elements: No
styling, semantic value (e.g. for assistive technology like screen readers) or
fancy behavior.


It's Just CSS
-------------

Now that we know we can just invent elements, why not invent a use case too?
Let's say we want to write about our friends and decorate their names with
emoji. After concluding there's not a more suitable
[standard element](https://html5doctor.com/element-index/) in this case (though
that's always debatable), we might decide on something like this:

```html
<p>
    Last night I met up with <cool-person>Kim</cool-person>,
    <cool-person>Nikhil</cool-person> and
    <cool-person>Ines</cool-person>.
</p>
```

```css
cool-person {
    font-variant: small-caps;
}

cool-person::before {
    content: "👤 ";
}
```

```markdown allowHTML
<output class="sample" id="sample1">
    Last night I met up with <cool-person>Kim</cool-person>,
    <cool-person>Nikhil</cool-person> and
    <cool-person>Ines</cool-person>.
</output>

<style class="nonvisual">
.sample {
    --color: #0000000A;
    --size: 2ch;

    border: 2px dashed var(--color-border);
    padding: var(--spacing);

    /* cf. https://css-tricks.com/uniqlo-stripe-hovers */
    background-image: linear-gradient(
        135deg,
        var(--color) 20%,
        transparent 20%,
        transparent 50%,
        var(--color) 50%,
        var(--color) 70%,
        transparent 70%,
        transparent
    );
    background-size: var(--size) var(--size);
}

cool-person {
    font-variant: small-caps;
}

#sample1 cool-person::before {
    content: "👤 ";
}
</style>
```

Upon seeing this, our friends revolt: They're not empty silhouettes! Let's allow
them to choose their own emoji:

```html
<p>
    Last night I met up with
    <cool-person avatar="🧑‍🔬">Kim</cool-person>,
    <cool-person>Nikhil</cool-person> and
    <cool-person avatar="🥽">Ines</cool-person>.
</p>
```

```css
cool-person::before {
    content: attr(avatar, "👤") " ";
}
```

```markdown allowHTML
<output class="sample" id="sample2">
    Last night I met up with
    <cool-person avatar="🧑‍🔬">Kim</cool-person>,
    <cool-person>Nikhil</cool-person> and
    <cool-person avatar="🥽">Ines</cool-person>.
</output>

<style class="nonvisual">
#sample2 cool-person::before {
    content: attr(avatar, "👤") " ";
}
</style>
```

So we can not just invent element names, we can do the same for attributes too!
(Though we must take care to avoid redefining
[standard attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)
like `id` or `class`.)

```aside compact
With great power comes
[great responsibility](https://web.archive.org/web/20171020025554/https://twitter.com/betsyweber/status/831380528389615617):
We should be aware that, in this case, only sighted readers know about those
custom avatars; visually impaired people miss out on this detail, as do folks
having a smart device read to them.
```


It's Just JavaScript
--------------------

That's all well and good, but typically we'd employ custom elements to attach
some custom functionality. Let's do something a little more elaborate here: A
simplistic
[CSV](https://en.wikipedia.org/wiki/Comma-separated_values "comma-separated values")
viewer.

In the spirit of progressive enhancement, we start with something that's useful
for [everyone](https://www.kryogenix.org/code/browser/everyonehasjs.html):

```html
<csv-viewer>
Lipsum, Cicero, 45 BCE
Hello World, Kernighan, 1972
</csv-viewer>
```

```css
csv-viewer:not(:defined) {
    white-space: pre;
}
```

```markdown allowHTML
<output class="sample">
    <csv-viewer>Lipsum, Cicero, 45 BCE
Hello World, Kernighan, 1972</csv-viewer>
</output>

<style class="nonvisual">
csv-viewer:not(:defined) {
    white-space: pre;
}

csv-viewer:defined {
    white-space: pre;
}
</style>
```

`:defined` kicks in as soon as there's a JavaScript definition for our custom
element. Let's add that:

```javascript
class CSViewer extends HTMLElement {
    connectedCallback() {
        let rows = csv2rows(this.textContent.trim());
        this.replaceChildren();
        this.append(...rows);
    }
}

customElements.define("csv-viewer", CSViewer);
```

```aside compact
We can choose any class name we like here, or even inline an anonymous class:

'''javascript
customElements.define("csv-viewer", class extends HTMLElement { /* … */ });
'''

'''disclosure markdown backticks=^^^ caption="`csv2rows` is a small function returning `div` elements, for now."
^^^javascript
function csv2rows(txt) {
    let rows = [];
    for(let row of parseCSV(txt)) {
        let el = document.createElement("div");
        el.textContent = row.join(" • ");
        rows.push(el);
    }
    return rows;
}

function* parseCSV(txt) {
    for(let line of txt.split(/\r?\n/)) {
        yield line.split(/, ?/);
    }
}
^^^

Note that this is a pretty crude implementation, merely for illustration
purposes.
'''
```

```markdown allowHTML
<output class="sample">
    <csv-viewer-sample>Lipsum, Cicero, 45 BCE
Hello World, Kernighan, 1972</csv-viewer-sample>
</output>

<script type="module" class="nonvisual">
class CSViewer extends HTMLElement {
    connectedCallback() {
        let rows = csv2rows(this.textContent.trim());
        this.replaceChildren();
        this.append(...rows);
    }
}

customElements.define("csv-viewer-sample", CSViewer);

function csv2rows(txt) {
    let rows = [];
    for(let row of parseCSV(txt)) {
        let el = document.createElement("div");
        el.textContent = row.join(" • ");
        rows.push(el);
    }
    return rows;
}

function* parseCSV(txt) {
    for(let line of txt.split(/\r?\n/)) {
        yield line.split(/, ?/);
    }
}
</script>
```

Henceforth, a `<csv-viewer>` element anywhere in our HTML will transform CSV
data within that element into something more legibile.

```infobox
There's a subtle gotcha here: `connectedCallback` is invoked as soon as a
corresponding element's _opening_ tag appears in our document. So if our custom
element's JavaScript definition has already been registered by the time such an
element appears, our CSV content
[might not be there yet](https://youtu.be/_iq1fPjeqMQ?t=930).
```

```infobox
TODO:

*   "life-cycle notifications"
*   `disconnectedCallback`
*   `constructor`
*   `adoptedCallback`
*   `attributeChangedCallback`
*   `MutationObserver`
*   `addEventListener`


Web Components
--------------

* Shadow DOM
* `<template>`
```
