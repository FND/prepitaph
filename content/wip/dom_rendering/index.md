title: Stateful DOM Rendering
tags: web, javascript
author: FND
created: 2024-01-31
syntax: true
canonical: https://www.smashingmagazine.com/2024/02/vanilla-javascript-libraries-quest-stateful-dom-rendering/

```infobox
This article ended up being
[published via Smashing Magazine](https://www.smashingmagazine.com/2024/02/vanilla-javascript-libraries-quest-stateful-dom-rendering/)
under a different title, improved thanks the editorial expertise of
[Geoff Graham](https://geoffgraham.me). This draft version is archived here for
historical purposes.
```

```teaser
It's well-established that the web has issues: From
[user-hostile UI patterns](https://how-i-experience-web-today.com/) and twisted
search results to sluggish performance and battery-draining bloat. Much of that
is caused by
[questionable technology choices](page://articles/attractive-nuisance), not
least in the realm of client-side JavaScript. In the interest of furthering our
collective understanding of this self-inflicted quagmire, let's examine one
small-but-significant part where developers take the reins: Painting pixels on
the screen.
```

In his seminal piece
[The Market For Lemons](https://infrequently.org/2023/02/the-market-for-lemons/),
renowned web crank Alex Russell lays out the myriad failings of our industry,
focusing on the disastrous consequences for end users. This indignation is
entirely appropriate according to the
[bylaws of our medium](https://www.w3.org/TR/html-design-principles/#priority-of-constituencies).
Frameworks factor highly in that equation. Yet there are also good reasons for
front-end developers to choose a framework,
[or library](https://johan.hal.se/wrote/2023/02/17/what-to-expect-from-your-framework/)
for that matter: Dynamically updating web UIs can be tricky in non-obvious ways.
Let's investigate by starting from the beginning, going back to first
principles.


Markup Categories
-----------------

Everything on the web starts with markup, i.e. HTML. Markup structures can
roughly be divided into three categories:

* static parts which always remain the same
* variable parts
    * defined once upon instantiation
    * updated dynamically at runtime

For example, an article's header might look like this:

```html
<header>
    <h1>«Hello World»</h1>
    <small>««123»» backlinks</small>
</header>
```

Here variable parts are highlighted, with the backlinks counter perhaps being
continuously updated via client-side scripting. Everything else remains
identical boilerplate for all our articles.

This particular article now focuses on the third category.


Color Browser
-------------

Imagine we're building a simple color browser: A little widget to explore a
pre-defined set of [named colors](https://www.w3.org/TR/css-color-3/#svg-color),
presented as a list that pairs names with a color swatch and the corresponding
value. Users should be able to search through names as well as toggle between
hexadecimal color codes and RGB triplets. We can create an
[inert skeleton](https://web.archive.org/web/20130924061832/http://alistair.cockburn.us/Walking+skeleton)
with just little bit of HTML and CSS:

```embed uri=./demo-static.html
```

```aside compact
'''disclosure backticks=^^^ caption="Colors extracted from the CSS specification."
Scraped from
[CSS Color Module Level 3](https://www.w3.org/TR/css-color-3/#svg-color):

^^^javascript
[...document.querySelectorAll("#svg-color ~ .colortable tbody tr ~ tr")].map(row => {
    let [,, name, hex, rgb] = row.children;
    return {
        name: name.textContent.trim(),
        hex: hex.textContent.trim().toUpperCase(),
        rgb: rgb.textContent.trim()
    };
});
^^^
'''
```


Client-Side Rendering
---------------------

We've grudgingly decided to employ client-side rendering for the interactive
version. For our purposes here, it doesn't matter whether this widget constitues
a complete application or merely an
[island](https://jasonformat.com/islands-architecture) embedded within an
otherwise static or server-generated HTML document.

Given our predilection for vanilla JavaScript -- first principles, remember? --
we start with the browser's built-in APIs as DOMinintended:

```javascript
function renderPalette(colors) {
    let items = [];
    for(let color of colors) {
        let item = document.createElement("li");
        items.push(item);

        let value = color.hex;
        makeElement("input", {
            parent: item,
            type: "color",
            value
        });
        makeElement("span", {
            parent: item,
            text: color.name
        });
        makeElement("code", {
            parent: item,
            text: value
        });
    }

    let list = document.createElement("ul");
    list.append(...items);
    return list;
}
```

```aside compact
'''disclosure backticks=^^^ caption="Note that we rely on a utility function for more concise element creation."

^^^javascript
function makeElement(tag, { parent, children, text, ...attribs }) {
    let el = document.createElement(tag);
    if(text) {
        el.textContent = text;
    }
    for(let [name, value] of Object.entries(attribs)) {
        el.setAttribute(name, value);
    }
    if(children) {
        el.append(...children);
    }
    parent?.appendChild(el);
    return el;
}
^^^
'''

(You might also have noticed a stylistic inconsistency: Within the `items` loop,
newly created elements attach themselves to their container while later on it's
the `list` container ingesting child elements.)
```

`renderPalette` generates our list of colors. Let's add the form for
interactivity:

```javascript
function renderControls() {
    return makeElement("form", {
        method: "dialog",
        children: [
            createField("search", "Search"),
            createField("checkbox", "RGB")
        ]
    });
}
```

The `createField` utility function encapsulates DOM structures required for
input fields; it's a little reusable markup component:

```javascript
function createField(type, caption) {
    let children = [
        makeElement("span", { text: caption }),
        makeElement("input", { type })
    ];
    return makeElement("label", {
        children: type === "checkbox" ? children.reverse() : children
    });
}
```

Now we just need to combine those pieces -- let's wrap 'em in a custom element:

```javascript
import { COLORS } from "./colors.js";

customElements.define("color-browser", class ColorBrowser extends HTMLElement {
    colors = [...COLORS];

    connectedCallback() {
        this.append(
            renderControls(),
            renderPalette(this.colors)
        );
    }
});
```

```aside compact
[`COLORS`](./colors.js) is an array of `{ name, hex, rgb }` objects.
```

Henceforth, `<color-browser>` anywhere in our document will expand to generate
the entire UI. This implementation is somewhat
declarative[declarative](footnote://), with DOM structures being created by
composing of a variety of straightforward markup generators.

```footnote declarative
The most useful description of declarative vs. imperative programming I've come
across focuses on readers. Unfortunately I don't recall the source, so will have
to paraphrase ineptly: Declarative code focuses on _what_, imperative code
describes _how_. Consequently, imperative code requires cognitive effort to
sequentially step through the code's instructions and build up a mental model of
the respective result.
```


Interactivity
-------------

At this point, we're merely recreating our inert skeleton; there's no actual
interactivity yet. Event handlers to the rescue:

```javascript
class ColorBrowser extends HTMLElement {
    colors = [...COLORS];
    query = null;
    rgb = false;

    connectedCallback() {
        this.append(renderControls(), renderPalette(this.colors));
        this.addEventListener("input", this);
        this.addEventListener("change", this);
    }

    handleEvent(ev) {
        let el = ev.target;
        switch(ev.type) {
        case "change":
            if(el.type === "checkbox") {
                this.rgb = el.checked;
            }
            break;
        case "input":
            if(el.type === "search") {
                this.query = el.value.toLowerCase();
            }
            break;
        }
    }
}
```

```aside compact
`handleEvent` means we don't have to
[worry about function binding](https://gomakethings.com/the-handleevent-method-is-the-absolute-best-way-to-handle-events-in-web-components/),
it also comes with
[various advantages](https://web.archive.org/web/20240121164212/https://scribe.rip/webreflection/dom-handleevent-a-cross-platform-standard-since-year-2000-5bf17287fd38#a0ff).
Other patterns are available.
```

Whenever one of our form fields changes, we now update the corresponding
instance variable (sometimes called one-way data binding). Alas, while we can
now change internal state[state](footnote://), that's not reflected anywhere in
the UI yet.

```footnote state
In your dev console, check `document.querySelector("color-browser").query` after
entering a search term.
```

Note that this event handler is tightly coupled to `renderControls` internals
because it expects a checkbox and search field, respectively. Thus any
corresponding changes to `renderControls` -- think switching to radio buttons
for color representations -- now needs to take into account this other piece of
code;
[action at a distance](https://en.wikipedia.org/wiki/Action_at_a_distance_%28computer_programming%29).
Expanding this component's contract to include
[field names](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name)
could alleviate such concerns.

We're now faced with a choice: Do we

```markdown allowHTML
<style class="nonvisual">
@counter-style choices {
    system: extends lower-alpha;
    suffix: ") ";
}

ol {
    list-style: choices;
}
</style>
```

1. reach into our previously created DOM to modify it, or
2. recreate it while incorporating new state?


Rerendering
-----------

Since we've already defined our markup composition in one place, let's start
with the latter:

```javascript
class ColorBrowser extends HTMLElement {
    // …

    connectedCallback() {
        this.#render();
        this.addEventListener("input", this);
        this.addEventListener("change", this);
    }

    handleEvent(ev) {
        // …
        this.#render();
    }

    #render() {
        this.replaceChildren();
        this.append(renderControls(), renderPalette(this.colors));
    }
}
```

So we've moved all rendering logic into a dedicated
method[privates](footnote://) and now invoke it whenever state changes, instead
of just once on startup.

```footnote privates
You might want to
[avoid private properties](https://lea.verou.me/blog/2023/04/private-fields-considered-harmful/)
though.
```

To filter colors based on the search query, we can turn `colors` into a getter:

```javascript
class ColorBrowser extends HTMLElement {
    query = null;
    rgb = false;

    // …

    get colors() {
        let { query } = this;
        if(!query) {
            return [...COLORS];
        }

        return COLORS.filter(color => color.name.toLowerCase().includes(query));
    }
}
```

```aside compact
I'm partial to the
[bouncer pattern](https://rikschennink.nl/thoughts/the-bouncer-pattern/).

'''disclosure backticks=^^^ caption="Toggling color representations is left as an exercise for the reader."
You might pass `this.rgb` into `renderPalette`, where you can then populate
`<code>` with either `color.hex` or `color.rgb` -- perhaps employing this
utility:

^^^javascript
function formatRGB(value) {
    return value.split(",").
        map(num => num.toString().padStart(3, " ")).
        join(", ");
}
^^^
'''
```

This now produces interesting/annoying behavior:

```embed uri=./demo-query.html
```

Entering a query seems impossible as the input field loses focus after any
change, with the input field remaining empty. However, entering a less common
character (e.g. "v") makes it clear that _something_ is happening: The list of
colors does change.

This is because our DIY approach here is quite crude: `#render` erases and
recreates the DOM wholesale with each change. Of course discarding existing DOM
nodes also resets corresponding state: form fields' value and focus as well as
scroll position. That's no good!


Incremental Rendering
---------------------

A [data-driven UI](https://rauchg.com/2015/pure-ui) seemed like a nice idea:
Markup structures are defined once and re-rendered at will, based on whatever
the current state is. Yet clearly our component's explicit state is
insufficient; we need to reconcile it with the browser's implicit state when
re-rendering.

Sure, we might attempt to make that implicit state explicit and incorporate it
into our data model, like including fields' `value` or `checked` properties.
However, that still leaves focus management, scroll position and myriad details
we probably haven't even thought of (typically including accessibility
features). Before long, we'd effectively be recreating the browser!

Or we might try to identify which parts need updating and leave the rest of the
DOM untouched. Unfortunately, that's far from trivial though -- this is where
libraries like React entered the scene more than a decade ago: On the surface,
they provided a more declarative way to define DOM structures[html](footnote://)
(while also encouraging componentized composition, establishing a single source
of truth for each individual UI pattern). Under the hood, they introduced
mechanisms[mechanisms](footnote://) to provide granular, incremental DOM updates
instead of recreating DOM trees from scratch -- both to avoid these state issues
and to improve efficiency/performance[performance](footnote://).

```footnote html
In this context, that essentially means writing something that looks like HTML --
which,
[depending on your belief system](https://en.wikipedia.org/wiki/False_equivalence),
is either essential or revolting. The state of HTML templating was kinda dire
back then -- depending on your environment, that continuous to be an issue.
```

```footnote mechanisms
[Let's learn how modern JavaScript frameworks work by building one](https://nolanlawson.com/2023/12/02/lets-learn-how-modern-javascript-frameworks-work-by-building-one/)
provides plenty of valuable insights on that topic. For even more details,
[How lit-html works](https://github.com/lit/lit/blob/9c02b3876dc927c6a82b4420411256ecbb47c08c/dev-docs/design/how-lit-html-works.md)
is worth studying.
```

```footnote performance
We've since learned that _some_ of those mechanisms are actually
[ruinously expensive](https://infrequently.org/2024/01/performance-inequality-gap-2024/).
```

The gist is: If we want to encapsulate markup definitions and then derive our UI
from a variable data model, we kinda have to rely on a third-party library for
reconciliation.


Actus Imperatus
---------------

At the other end of the spectrum, we might opt for surgical modifications: If we
know what to target, we as application developers can reach into the DOM and
modify only those parts that need updating.

Unfortunately, that typically leads to even tighter coupling, with interrelated
logic being spread all over our application and targeted routines inevitably
violating components' encapsulation. Things become even more complicated when we
take into account increasingly complex UI permutations (think edge cases, error
reporting etc.). Those are the very issues the aforementioned libraries had
hoped to eradicate.

In our case, that would mean finding and hiding palette entries that don't match
our query -- possibly replacing the list with a substitute message if no
matching entries remain. We'd also have to toggle entries' color representations
in place. You can probably imagine how the resulting code would end up
dissolving any separation of concerns, messing with elements that originally
belonged exclusively to `renderPalette`.

```javascript
class ColorBrowser extends HTMLElement {
    // …

    handleEvent(ev) {
        // …
        for(let item of this.#list.children) {
            item.hidden = !item.textContent.toLowerCase().includes(this.query);
        }
        if(this.#list.children.filter(el => !el.hidden).length === 0) {
            // inject substitute message
        }
    }

    #render() {
        // …
        this.#list = renderPalette(this.colors);
    }
}
```

As a [once wise man](https://en.wikipedia.org/wiki/Has_Been) once said: That's
too much knowledge!

Things get even more perilous with form fields: Not only might we have to update
their respective state, we'd also need to know where to inject error messages.
While reaching into `renderPalette` was bad enough, here instead of crossing a
single component's boundary, we'd have to pierce several layers: `createField`
is a generic utility used by `renderControls`, which in turn is invoked by our
top-level `ColorBrowser`.

If things get hairy even in this minimal example, imagine having a more complex
application with yet more layers and indirections: Keeping on top of all those
interconnections becomes all but impossible -- commonly devolving into a big
ball of mud where nobody dares touch anything anymore.


Conclusion
----------

There appears to be a glaring omission in standardized browser APIs: Our
preference for dependency-free vanilla-JavaScript solution is thwarted by the
need to non-destructively update existing DOM structures. That's assuming we
value a declarative approach with inviolable encapsulation, otherwise known as
Modern Software Engineering: The Good Parts.

As it stands, my personal opinion is that a small library like lit-html or
Preact is often warranted, particularly when employed with
[replaceability](https://adactio.com/journal/20837) in mind: A standardized API
might still happen! 🤞 Either way,
[adequate libraries](https://infrequently.org/2023/02/the-market-for-lemons/#fn-alex-approved-1)
have a light footprint and don't typically present much of an encumberance to
end users -- especially when combined with
[progressive enhancement](https://cloudfour.com/thinks/html-web-components-are-having-a-moment/).

I don't wanna leave you hanging though, so I've tricked our vanilla-JS
implementation to _mostly_ do what we expect it to:

```embed uri=./demo.html
```
