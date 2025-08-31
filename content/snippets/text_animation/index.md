title: Animating Text Color
tags: css
author: FND
created: 2025-08-31
syntax: true

```intro
I recently helped build a website in stark mode: Intentionally gaudy colors on
dark background. That design necessitated visual flourishes for top-level
navigation links to stand out when activated.
```

```aside
There are various accessibility considerations here: Links should be underlined,
interactive elements should be clearly recognizable as such, state changes
should not be conveyed via colors only etc. We'll recklessly gloss over such
real-world details for now.
```

We started out with a
[linear-gradient animation](https://css-tricks.com/4-ways-to-animate-the-color-of-a-text-link-on-hover/)
for `:focus`, `:hover` and `:active`:

```embed uri=./demo-linear.html resize
```

That looks decent, but feels a little weird when activating adjacent links, as
the animation's direction doesn't adapt to that kinda contextual information.

So I tweaked the technique to use a radial gradient, with the effect emanating
from the center instead:

```embed uri=./demo-radial.html resize
```

```markdown allowHTML
If you wanna get <s>psychedelic</s> fancy, you might even use multiple colors:
```

```embed uri=./demo-rainbow.html resize
```

```infobox
Safari appears to include text underlines when clipping the background while
other browsers don't. There's also a confounding layout shift during the
radial animation which I have no idea how to address.
```

The linear technique works by making text transparent and painting a hard-stop
gradient in its stead -- positioned so only one half is visible. Assuming you
have a link `<a class="text-flood" …>` (for lack of a more descriptive name 🤷 ):

```css
.text-flood {
    color: transparent;
    background-image: linear-gradient(to right,
            var(--text-flood-color-alt) 50%,
            var(--text-flood-color) 50%);
    background-size: 200% 100%;
    background-position: 100%;
    background-clip: text;
}
```

(Note that `--text-flood-color` and `--text-flood-color-alt` need to be defined
somewhere.)

When the respective link is activated, we shift that background image's position
to reveal the other half:

```css
.text-flood {
    /* … */
    @media (prefers-reduced-motion: no-preference) {
        transition: background-position 200ms linear;
    }

    &:focus,
    &:hover,
    &:active {
        background-position: 0 100%;
    }
}
```

The radial equivalent works much the same way, except there we animate a custom
property:

```css
.text-flood {
    --text-flood-offset: 0%;

    color: transparent;
    background-image: radial-gradient(circle at 50%,
            var(--text-flood-color-alt) var(--text-flood-offset),
            var(--text-flood-color) var(--text-flood-offset));
    background-clip: text;
    @media (prefers-reduced-motion: no-preference) {
        transition: --text-flood-offset 200ms linear;
    }

    &:focus,
    &:hover,
    &:active {
        --text-flood-offset: 100%;
    }
}

@property --text-flood-offset {
    syntax: "<percentage>";
    inherits: true;
    initial-value: 0%;
}
```

Note that such animations require
[`@property` support](https://developer.mozilla.org/en-US/docs/Web/CSS/@property#browser_compatibility),
though it works as a progressive enhancement: The fallback is just skipping the
transition, switching states instantly -- just like for users who
[prefer reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

Support for `background-clip: text`, on the other hand, might be a little more
problematic: While it's been
[reasonably well supported](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip#browser_compatibility)
for a couple of years, there's no acceptable fallback story; text just
disappears. Thus it seems prudent to conditionally employ this effect with a
[feature query](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports):

```css
@supports (background-clip: text) {
    .text-flood {
        /* … */
    }
}
```
