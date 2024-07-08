title: CSS Vector-Path Scaling
tags: css, svg
author: FND
created: 2024-07-08
syntax: true

We have an SVG `path` definition that we want to use to
[shape a container element's outline](https://www.sarasoueidan.com/blog/css-svg-clipping/)
via CSS `clip-path`.

```embed uri=./sample.svg resize
```

```xml
<path d="M1,1 l0,1 l40,1 a1,1 0 0,0,18 0 l40,-1 l0,-1 z" />
```

For simplicity, we might approximate this clipping shape with
`clip-path: polygon(…)`. However, unlike vector paths, polygons can't reasonably
be used for properly curved shapes; it's all straight lines and edges.

```markdown allowHTML
<article id="poly-sample">lorem ipsum dolor sit amet</article>

<style class="nonvisual">
article[id$=-sample] {
    display: flex;
    height: 5rem;
    flex-direction: column;
    padding: var(--spacing);
    justify-content: center;
    text-align: center;
    color: white;
    background-color: cadetblue;
}

#poly-sample {
    clip-path: polygon(45% 0, 50% 1rem, 55% 0, 100% 0, 100% 100%, 0 100%, 0 0);
}
</style>
```

```css
clip-path: polygon(45% 0, 50% 1rem, 55% 0, 100% 0, 100% 100%, 0 100%, 0 0);
```

CSS does support SVG-style paths via `clip-path: path(…)`. Yet if we insert the
aforementioned path definition there, scaling is way off: The shape's size
appears to be absolute (100×100 pixels, as per its `viewBox`) rather than
relative to our container element.

```markdown allowHTML
<article id="path-sample">lorem ipsum dolor sit amet</article>

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

We could resort to
[moving our path definition into a separate SVG](https://davesmyth.com/clip-path-scaling)
instead of embedding it directly within CSS, thus allowing for `<clipPath
clipPathUnits="objectBoundingBox">`. Unfortunately, not only is that
cumbersome in various ways, it also doesn't quite result in the desired effect:
While our shape now stretches horizontally as expected, vertical scaling seems
exaggerated -- I would have expected the `viewBox` to be taken into account for
proportions, thus preventing our shape from extending all the way to the bottom
of the container element.

```markdown allowHTML
<article id="svg-sample">lorem ipsum dolor sit amet</article>
<svg width="0" height="0" viewBox="0 0 100 100">
    <defs>
        <clipPath id="clip-shape" clipPathUnits="objectBoundingBox">
            <path d="M0.01,0.09 l0,0.09 l0.4,0.09 a0.01,0.09 0 0,0,0.18 0 l0.4,-0.09 l0,-0.09 z" />
        </clipPath>
    </defs>
</svg>

<style class="nonvisual">
#svg-sample {
    clip-path: url(#clip-shape);
}
</style>
```

```html
<svg width="0" height="0" viewBox="0 0 100 100">
    <defs>
        <clipPath id="clip-shape" clipPathUnits="objectBoundingBox">
            <path d="M0.01,0.09 l0,0.09 l0.4,0.09 a0.01,0.09 0 0,0,0.18 0 l0.4,-0.09 l0,-0.09 z" />
        </clipPath>
    </defs>
</svg>
```

```css
clip-path: url(#clip-shape);
```

Chances are I haven't fully grokked yet how all these pieces interact, or
perhaps there's a fundamental misunderstanding in what I'm actually trying to
achieve -- getting to this point was a circuitous journey that left me in a bit
of a daze for now...
