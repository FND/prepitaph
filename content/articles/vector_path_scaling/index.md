title: CSS Vector-Path Scaling
tags: css, svg
author: FND
created: 2024-07-10
syntax: true

```intro
CSS allows for arbitrary shapes these days. Getting the details right turns out
to be a little challenging.
```

Let's say we have an SVG `path` definition that we want to use to
[shape a container element's outline](https://www.sarasoueidan.com/blog/css-svg-clipping/)
via CSS
[`clip-path`](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path).

```embed uri=./sample.svg resize
```

```xml
<path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" />
```

For simplicity, we might approximate this clipping shape with
`clip-path: polygon(…)`. However, unlike vector paths, polygons can't reasonably
be used for properly curved shapes; it's all straight lines and edges.

```markdown allowHTML
<article id="poly-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>

<style class="nonvisual">
article[id$=-sample] {
    display: flex;
    min-height: 5rem;
    flex-direction: column;
    padding: var(--spacing);
    justify-content: space-between;
    text-align: center;
    color: white;
    background-color: cadetblue;
}

article[id$=-sample] > * {
    margin-block: 0;
}
article[id$=-sample] > * + * {
    margin-block-start: var(--spacing);
}

demo-toggle,
demo-toggle button {
    display: block;
}

demo-toggle button {
    min-width: 50%;
    margin-inline: auto;
}

#poly-sample {
    clip-path: polygon(45% 0, 50% 1rem, 55% 0, 100% 0, 100% 100%, 0 100%, 0 0);
}
</style>
```

```css
clip-path: polygon(45% 0, 50% 1rem, 55% 0, 100% 0, 100% 100%, 0 100%, 0 0);
```

Gratifyingly, CSS also supports SVG-style paths via `clip-path: path(…)`. Yet if
we insert the aforementioned path definition there, **scaling is way off**: The
shape's size appears to be absolute (100×100 pixels, as per its `viewBox`)
rather than relative to our container element.

```markdown allowHTML
<article id="path-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>

<style class="nonvisual">
#path-sample {
    clip-path: path("M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z");
}
</style>
```

```css
clip-path: path("M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z");
```

```aside compact
This example actually shows the inverse of what we want, eventually; clipping
inside rather than outside. That's mostly because I struggled to manually
[construct a suitable path definition](https://svg-tutorial.com/svg/arc), though
arguably this visualization makes the underlying issue more apparent?
```

As I understand it, that's because the path's
[user units](https://www.w3.org/TR/SVG/coords.html#TermUserUnits) are not tied
to our container element's size.

We could remedy that by
[moving our path definition into a separate SVG](https://davesmyth.com/clip-path-scaling)
instead of embedding it directly within CSS, thus allowing for
`<clipPath clipPathUnits="objectBoundingBox">` and scaling the shape to match
the container's size. Unfortunately, not only is that
cumbersome in various ways[complexity](footnote://), it also doesn't quite
result in the desired effect: While our shape now stretches horizontally as
expected, vertical scaling seems exaggerated. In other words, our shape does
_not_ maintain its original **aspect ratio** with this technique. We can confirm
this by changing the container element's height.

```footnote complexity
Extracting a separate SVG leads to
[disparate pieces of code](https://en.wikipedia.org/wiki/Action_at_a_distance_%28computer_programming%29).
Plus `objectBoundingBox` requires a different coordinate system, essentially
prescribing `viewBox="0 0 1 1"`, so original values typically need to be
transformed.
```

```markdown allowHTML
<article id="svg-arc-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>
<demo-toggle></demo-toggle>
<svg width="0" height="0" viewBox="0 0 100 100">
    <defs>
        <clipPath id="clip-shape-arc" clipPathUnits="objectBoundingBox">
            <path d="M0.01,0.09 l0,0.09 l0.4,0.09 a0.01,0.09 0 0,0,0.18 0 l0.4,-0.09 l0,-0.09 z" />
        </clipPath>
    </defs>
</svg>

<style class="nonvisual">
#svg-arc-sample {
    clip-path: url(#clip-shape-arc);
}
</style>

<script type="module" class="nonvisual">
customElements.define("demo-toggle", class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<button type="button">Toggle size</button>';
        this.addEventListener("click", this);
    }

    handleEvent(ev) {
        let el = this.previousElementSibling;
        let { style } = el;
        style.height = style.height ? "" : `${3 * el.getBoundingClientRect().height}px`;
    }
});
</script>
```

```html
<svg width="0" height="0" viewBox="0 0 100 100">
    <defs>
        <clipPath id="clip-shape-arc" clipPathUnits="objectBoundingBox">
            <path d="M0.01,0.09 l0,0.09 l0.4,0.09 a0.01,0.09 0 0,0,0.18 0 l0.4,-0.09 l0,-0.09 z" />
        </clipPath>
    </defs>
</svg>
```

```css
clip-path: url(#clip-shape-arc);
```

At this point, it seems prudent to further simplify our example: Let's replace
that fairly complex path definition with another polygonal approximation. As
long as we're still employing vector paths for that, the same principles apply
and we can disregard headache-inducing curved shapes for the moment.

```markdown allowHTML
<article id="svg-poly-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>
<demo-toggle></demo-toggle>
<svg width="0" height="0" viewBox="0 0 100 100" class="nonvisual">
    <defs>
        <clipPath id="clip-shape-poly" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L0.4,0.6 L0.6,0.6 L1,0 z" />
        </clipPath>
    </defs>
</svg>

<style class="nonvisual">
#svg-poly-sample {
    clip-path: url(#clip-shape-poly);
}
</style>
```

```html
<svg width="0" height="0" viewBox="0 0 100 100" class="nonvisual">
    <defs>
        <clipPath id="clip-shape-poly" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L0.4,0.6 L0.6,0.6 L1,0 z" />
        </clipPath>
    </defs>
</svg>
```

```css
clip-path: url(#clip-shape-poly);
```

That new path definition is comparatively straightforward: A sloped shape, up to
60&nbsp;% tall and spanning the entire width. Unsurprisingly, the aspect-ratio
issue can be observed here just the same: The slope's angle changes along with
the container element's height. That's exactly what we _don't_ want to happen
though!

Temani Afif graciously took the time to
[suggest](https://front-end.social/@css/112749852872469029) that
[masking](https://css-tricks.com/clipping-masking-css/) might be more suitable
than clipping here.[masking](footnote://) And indeed, switching from `clip-path`
to [`mask`](https://developer.mozilla.org/en-US/docs/Web/CSS/mask) gives us a
new set of affordances -- notably the option to maintain aspect ratio, but also
control both size and position more directly (though not necessarily
intuitively; YMMV).

```footnote masking
While I'd had a latent suspicion this might be the case, even getting to this
point was a circuitous journey -- guess I lost sight of the big picture, so to
speak...
```

So let's go back to our original path definition and plug that in -- _et voilà_:
This is pretty much the result we were hoping for in the first place!

```markdown allowHTML
<article id="mask-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>
<demo-toggle></demo-toggle>

<style class="nonvisual">
#mask-sample {
    mask: no-repeat;
    mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" /></svg>');
    mask-size: 100% auto;
    mask-position: top left;
}
</style>
```

```css
mask: no-repeat;
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" /></svg>');
mask-size: 100% auto;
mask-position: top left;
```

```aside compact
Note that `mask-image` also allows us to easily embed an SVG via
[data URIs](page://articles/data-uris).
```

All that's left now is inverting; remember we really wanted to clip outside
rather than inside. CSS masking can do that by combining multiple layers, so we
don't even have to change our path definition!

```markdown allowHTML
<article id="mask-inverted-sample">
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
    <p>lorem ipsum dolor sit amet</p>
</article>
<demo-toggle></demo-toggle>

<style class="nonvisual">
#mask-inverted-sample {
    mask: no-repeat;
    mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" /></svg>'),
            linear-gradient(red, red);
    mask-size: 100% auto;
    mask-position: top left;
    mask-composite: exclude;
}
</style>
```

```css
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" /></svg>'),
        linear-gradient(red, red);
mask-composite: exclude;
```

So yay, we've achieved the desired effect, eventually, with just a few lines of
code. Nevertheless, it feels like I haven't fully grokked how all the various
pieces interact. This might be exacerbated by the fact that the respective
affordances of `clip-path` and `mask` seem simultaneously very similar yet oddly
incongruent -- with any luck, I'll develop a more solid mental model over time.
