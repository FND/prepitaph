title: Faceted Filtering with Constructed Style Sheets
tags: css, javascript, a11y
author: FND
created: 2025-06-29
syntax: true

```intro
An effort to escape irksome constraints of enterprise software not only made me
appreciate the impact of modern CSS when combined with JavaScript APIs, it also
taught me a few things about progressive enhancement, performance and
accessibility.
```

While the corporate product in question provides useful data, usability is
lacking. More importantly, its at-a-glance overview -- sort of a mix of
dashboard and kanban -- was both incomplete and insufficiently concise. A bit of
reverse engineering allowed me to awkwardly augment the existing application
with a [bookmarklet](https://make-bookmarklets.com), but results were
unsatisfying and brittle.

In typical developer fashion, I ultimately convinced myself that building my own
application was the more sustainable and useful approach (famous last words
etc.): A slightly different interpretation of a board visualization, consuming
existing data, but enhanced with custom filtering capabilities. Somewhat
surprisingly, that worked out pretty well for our purposes, despite being rather
fugly (inevitable FNDesign):

```figure caption="A rough approximation of my [DIY board](./demo.html)"
'''embed uri=./demo.html
'''
```

The actual board is assembled using a simplistic static-site generator (more
DIY!); querying an API to turn raw data into bespoke HTML, with just
[a few lines of JavaScript](page://articles/lightweight-html-templating). That
comes with a small custom element to provide filtering functionality; doing that
client-side was the pragmatic choice here. Thus we're progressively enhancing
our static markup to turn it into a tiny single-page application. (In the demo
above, I opted for client-side content generation because that proved easier and
acceptable for our purposes here.)

Even so, everything begins with markup. We'll focus on the cards representing
pieces of content:

```html
<article class="post">
    <header>
        <h3><a href="https://example.org">Hello World</a></h3>
        <img src="./prole.jpg" alt="Prolific Writer">
    </header>

    <ul class="sharers">
        <li><img src="./rando.jpg" alt="Random Enthusiast"></li>
        <li><img src="./bot.jpg" alt="Automated Aggregator"></li>
    </ul>

    <p>Lorem ipsum dolor sit amet.</p>
</article>
```

```aside
Naturally, I'm somewhat conflicted about various markup choices. For example, an
unordered list might be more appropriate here than individual `<article>`
elements. Perhaps more significantly, there's no explicit contextualization of
avatar images, distinguishing the respective author from those having shared
that post. Similarly, earlier versions used `<figure>` for users, including
their name alongside the avatar -- however, I just ended up hiding that
`<figcaption>` due to space constraints. (I'm
[aware](page://articles/authoring#figure) that
[`img[alt]` and `figcaption` are not equivalent](https://www.scottohara.me/blog/2019/01/21/how-do-you-figure.html#a-figcaption-is-not-a-place-to-repeat-or-a-substitute-for-image-alternative-text).)
```

Let's add some metadata to distinguish authors from "sharers" (for lack of a
better term):

```html
    <header>
        <h3>…</h3>
        <img … class="user" data-author="prole">
    </header>

    <ul class="sharers">
        <li><img … class="user" data-sharer="rando"></li>
        <li><img … class="user" data-sharer="bot"></li>
    </ul>
```

With that in place, we can set up controls for filtering content:

```html
<form method="dialog">
    <fieldset disabled>
        <legend>Author</legend>
        <label>
            <input type="radio" name="author" value="prole">
            <b>Prolific Writer</b>
        </label>
        …
    </fieldset>
    <fieldset disabled>
        <legend>Shared by</legend>
        <label>
            <input type="radio" name="sharer" value="rando">
            <b>Random Enthusiast</b>
        </label>
        <label>
            <input type="radio" name="sharer" value="bot">
            <b>Automated Aggregator</b>
        </label>
    </fieldset>
    <button type="reset">Reset</button>
</form>
```

```aside
More markup qualms: Omitting labels' `for` attribute in favor of nesting is a
[questionable](https://www.tpgi.com/should-form-labels-be-wrapped-or-separate/)
choice. On the upside, `<b>` is
[perfectly cromulent](https://adaptivewebdesign.info/1st-edition/read/chapter-2.html#footnote-222-20).
```

Note the relationship between radio buttons and our `data-*` attributes; we'll
come back to that.

`method="dialog"` is a slight (I hope)
[hack](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#attributes_for_form_submission)
to indicate that this is a purely client-side form. Consequently, form fields
start out `disabled` because interactivity requires JavaScript -- more on that
in a minute.

Styling Determines State
------------------------

When filtering content, instead of arduously managing state of individual DOM
elements, we can take advantage of CSS to selectively hide individual cards. For
example, cards where Prolific Writer is the author can be identified with the
following selector:

```css
.post:has(.user[data-author=prole])
```

If we only want to show Prolific Writer's content, we can hide cards where
Prolific Writer is _not_ the author:

```css
.post:not(:has(.user[data-author=prole])) {
    display: none;
}
```

```aside
Fortunately, this styling also
[affects the accessibility tree](https://developer.mozilla.org/en-US/docs/Web/CSS/display#accessibility),
hiding those cards for both visual users and users of assistive technology.
```


Interactivity
-------------

Wrapping the entire board in a custom element -- `<card-board>`, obviously --
allows us to augment the static representation with client-side
functionality. We begin by enabling those form fields:

```javascript
customElements.define("card-board", class CardBoard extends HTMLElement {
    connectedCallback() {
        for(let el of this.controls) {
            el.disabled = false;
        }
    }

    get controls() {
        return this.querySelectorAll("fieldset");
    }
});
```

```aside
Arguably, relegating DOM queries to getters makes the component's expectations
of its
[base markup](page://articles/progressive-web-components#s30) a little more
salient than hiding such expressions deep within other methods.
```

Now we actually need to respond to filter selection via radio buttons. Equipped
with the insight above, we'll employ
[Constructed Style Sheets](page://articles/constructed-style-themes) -- one for
each type of relationship (we don't need to distinguish between one-to-one and
one-to-many):

```javascript
let CSS = {
    author: new CSSStyleSheet(),
    sharer: new CSSStyleSheet()
};
document.adoptedStyleSheets.push(...Object.values(CSS));
```

After changing our wrapper to `<card-board card-selector=".post">` in the
interest of maintaining separation of concerns, we can identify and update the
respective style sheet to reflect the desired state:

```javascript
    constructor() {
        super();
        this.addEventListener("change", this);
    }

    handleEvent(ev) {
        let el = ev.target;
        let { name } = el;
        if(!Object.hasOwn(CSS, name)) {
            return;
        }

        let selector = `${this.localName} ${this.cardSelector}` +
                `:not(:has(.user[data-${name}="${el.value}"]))`;
        let css = `${selector} { display: none; }`;
        CSS[name].replaceSync(css); // NB: sync avoids flickering
    }

    get cardSelector() {
        return this.getAttribute("card-selector");
    }
```

```aside
* Event delegation with `handleEvent`
  [simplifies things](https://ryanmulligan.dev/blog/handling-events-web-components/)
  in [various ways](page://wip/dom-rendering#ref:handle-event).
* Assuming I correctly understand browsers' rendering mechanisms (don't count on
  it), this should not result in
  [layout thrashing](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/34d9f17416117949e77d4fa5b26b079c87b2b698/EventPhases/explainer.md#introduction).
```

This works for both of our relationships -- author and sharer -- because we're
relying on regular form semantics; form fields' markup (`name` and `value`
attributes) ultimately defines the selector.

While we're at it, we might as well add support for "none of the above":

```html
    <fieldset disabled>
        <legend>Shared by</legend>
        …
        <label>
            <input type="radio" name="sharer" value="">
            <b>nobody</b>
        </label>
    </fieldset>
```

```javascript
        let { value } = el;
        let selector = `${this.localName} ${this.cardSelector}`;
        selector += value === ""
                ? `:has(.user[data-${name}])`
                : `:not(:has(.user[data-${name}="${value}"]))`;
        let css = `${selector} { display: none; }`;
```

Finally, we make the reset button empty both of our style sheets:

```javascript
    constructor() {
        super();
        this.addEventListener("change", this);
        this.addEventListener("reset", this);
    }

    handleEvent(ev) {
        if(ev.type === "reset") {
            for(let stylesheet of Object.values(CSS)) {
                stylesheet.replaceSync("");
            }
            return;
        }
        // …
    }
```


View Transitions
----------------

Where supported and desired, view transitions can add a little pizzazz:

```javascript
let VIEW_TRANSITIONS = document.startViewTransition &&
        matchMedia("(prefers-reduced-motion: no-preference)").matches;
```

This is a good opportunity to centralize style-sheet updates in a method,
refactoring `replaceSync` invocations accordingly:

```javascript
    async _update(stylesheet, css) {
        if(VIEW_TRANSITIONS) {
            let vt = document.startViewTransition(() => stylesheet.replace(css));
            await vt.finished;
        } else {
            stylesheet.replaceSync(css); // NB: sync avoids flickering
        }
    }
```

```javascript
    handleEvent(ev) {
        // …
            for(let stylesheet of Object.values(CSS)) {
                this._update(stylesheet, "");
            }
        // …
        this._update(CSS[name], `${selector} { display: none; }`);
        // …
    }
```


Accessibility
-------------

So far we've largely been concerned with visual appearance -- that's very
limiting! In particular, it's not obvious that selecting a filter influences
what's being shown in the main-content area -- which is particularly important
for users of assistive technology.

You might think that
[`aria-controls`](https://a11ysupport.io/tech/aria/aria-controls_attribute)
solves this, except that's
[not something we should rely on](https://heydonworks.com/article/aria-controls-is-poop/).

```figure caption="Example of markup we wish would suffice"
'''html
<form aria-controls="posts">…</form>
<ul id="posts">…</ul>
'''
```

Similarly, using
[`aria-live`](https://a11ysupport.io/tech/aria/aria-live_attribute)
on our `<card-board>` container seems tempting, but
[live regions only convey simple messages](https://www.scottohara.me/blog/2022/02/05/dynamic-results.html#first-live-regions)
(which makes sense if you think about it).

However, if we provide users with additional information, communicating how many
pieces of content remain after filtering, that benefits everyone! Enter: the
`<output>` element
with its [implied `status` role](https://www.scottohara.me/blog/2019/07/10/the-output-element.html#the-accessibility-of-the-output-element).

```javascript
    connectedCallback() {
        let form = this.controls[0].closest("form");
        let el = document.createElement("output");
        this._status = form.appendChild(el);

        for(let el of this.controls) {
            el.disabled = false;
        }
    }

    async _update(stylesheet, css) {
        if(VIEW_TRANSITIONS) {
            // …
        }

        // update status
        let visible = 0;
        for (let el of this.querySelectorAll(this.cardSelector)) {
            // heuristic adapted from jQuery
            if (el.offsetWidth || el.offsetHeight || el.getClientRects().length) {
                visible++;
            }
        }
        this._status.textContent = `${visible} results`;
    }
```

Admittedly, this is a little weird now: After injecting styles to let CSS decide
which cards remain visible, we make a separate run in JavaScript just to count
those remaining cards (again risking layout thrashing if we're not careful).

```aside
There _might_ be a clever way to
[delegate counting to CSS](page://snippets/debugging-custom-properties), but my
experiment failed: It doesn't seem like there's a way to access a custom
property's _calculated_ value from JavaScript?

'''embed uri=./experiment.html resize
'''
```
