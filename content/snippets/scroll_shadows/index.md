title: Scroll Shadows
tags: web, css
author: FND
created: 2024-01-28
syntax: true

```figure
> Scroll shadows are a good hint to users that an element can be scrolled by
> overlaying shadows on its edges.

--- [Scroll shadows with animation-timeline](https://www.purestructure.com/blog/scroll-shadows-animation-timeline/)
```

We're not actually gonna use that newfangled animation timeline though. For the
moment, let's rely on
[Lea's time-tested approach](https://lea.verou.me/blog/2012/04/background-attachment-local/)
instead:

```css
.is-scrollable {
    --bg-color: #FFF;
    --shadow-color: #0003;
    --shadow-size: 0.5rem;

    overflow: auto;
    background: linear-gradient(var(--bg-color) 30%, transparent),
            linear-gradient(transparent, var(--bg-color) 70%) 0 100%,
            radial-gradient(farthest-side at 50% 0, var(--shadow-color), transparent),
            radial-gradient(farthest-side at 50% 100%, var(--shadow-color), transparent) 0 100%;
    background-size: 100% calc(4 * var(--shadow-size)),
            100% calc(4 * var(--shadow-size)),
            100% calc(2 * var(--shadow-size)),
            100% calc(2 * var(--shadow-size));
    background-attachment: local, local, scroll, scroll;
    background-repeat: no-repeat;
}
```

To be honest, I don't yet _fully_ understand what's going on there, but that's
ok. So this is essentially just me ineptly copying Lea's code, reducing it to
the essentials (hopefully?) and employing custom properties.

```aside compact
As with all snippets here, the point is to collect and contextualize easily
reusable pieces of code.
```

Note that this particular snippet addresses vertical scrolling only; if I ever
need horizontal scrolling, that's an opportunity to dig deeper.

```embed uri=./demo.html resize
```
