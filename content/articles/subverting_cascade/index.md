title: Subverting the Cascade
tags: css
author: FND
created: 2024-03-29
syntax: true

```intro
The cascade is what makes CSS powerful and special. And yet, sometimes we want
to limit that power for containment purposes.
```

Let's say we're designing the obligatory card component. Simpleton that I am,
I've decided all we need is a border and background color:

```css
:root {
    --card-accent: cadetblue;
}

.card {
    border-color: var(--card-accent);
    background-color: color-mix(in srgb, var(--card-accent), #FFF 75%);
}
```

```embed uri=./demo1.html
```

Our component definition might impose restrictions on the card's title (e.g.
limiting it to plain text[a11y](footnote://)), but allow authors to use
arbitrary markup for any remaining content.[control](footnote://)

```footnote a11y
Disallowing markup might hamper accessibility and localization, e.g. by making
it impossible for authors to set the
[`lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang).
```

```footnote control
You might say this is an
[open](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle) component,
for lack of a better term, because we as component designers do not fully
control its markup.
```

Inevitably, we end up with nested cards:

```embed uri=./demo2.html
```

Note that we've highlighted an individual card by customizing `--card-accent`
via its `style` attribute; that's intentionally a part of our component's
contract.

But what if we highlight our top-level card instead?

```embed uri=./demo3.html
```

That's a bit garish! Nested cards inherit the customization; that's not what we
want here.


Enter `@property`
-----------------

Browsers now enable us to put constraints on custom properties via
[`@property` definitions](https://developer.mozilla.org/en-US/docs/Web/CSS/@property),
meaning we can suppress inheritance for this particular customization option:

```css
@property --card-accent {
    syntax: "<color>";
    inherits: false;
    initial-value: cadetblue;
}
```

```infobox
`inherits` is not yet
[supported](https://developer.mozilla.org/en-US/docs/Web/CSS/@property/inherits#browser_compatibility)
in Firefox.
```

```embed uri=./demo4.html
```

Having said that, in this particular case we could have just moved the
custom-property definition into our `.card` rule set instead:

```css
.card {
    --card-accent: cadetblue;

    border-color: var(--card-accent);
    background-color: color-mix(in srgb, var(--card-accent), #FFF 75%);
}
```

```embed uri=./demo5.html
```

So we don't actually need this newfangled bit of CSS here. In fact, after
realizing this, I now can't think of many use cases for `inherits` anymore --
though that might be due to aphantasia. 🤷

I was originally hoping to employ this for my
[ubiquitous](page://snippets/html-boilerplate) `.stack` utility in order to
allow for localized custom spacing:

```css
.stack > * {
    margin-block: 0;

    & + * {
        margin-block-start: var(--stack-spacing, --spacing);
    }
}
```

```aside compact
See [Every Layout](https://every-layout.dev/layouts/stack/) for details. While
you might achieve the same thing with `gap` nowadays, that requires flexbox or
grid, which seems just a tad wasteful for such a general-purpose utility --
though perhaps I'm unreasonably concerned about
[multi-pass layout algorithms](https://developer.chrome.com/blog/flexbox-layout-isn-t-slow).
```

However, I couldn't make that work because `.stack` is all about descendants and
thus relies on inheritance to some extent. Plus _apparently_ `rem` doesn't work
for [`<length>`](https://developer.mozilla.org/en-US/docs/Web/CSS/length)
properties? 🧐 🤷


`@scope` to the Rescue?
-----------------------

Maybe `@property` wasn't the right tool in the first place: With the advent of
[`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) we'll be
able to limit selectors' reach without foregoing inheritance wholesale.

I'm not entirely sure yet how that might apply to the challenges described
above, so I've created a separate demo instead:

```embed uri=./demo6.html
```

Here both `button` and `.title` styling is limited to `my-card` descendants
_not_ within `section`, thus excluding the checklist:

```css
@scope (my-card) to (:scope section) {
    .title {
        font-variant: small-caps;
    }

    button {
        border-radius: 100%;
    }
}
```

A significant advantage there is that we can use simple, readable element
designations instead of attempting to disambiguate via globally unique class
names (à la [BEM](https://css-tricks.com/bem-101/), not to mention
[crimes against the web](https://en.wikipedia.org/wiki/CSS-in-JS)). This works
because `@scope` allows us to distinguish controlled and open constituents of
our component.
