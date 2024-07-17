title: CSS-Only Ripple Effect
tags: css
author: FND
created: 2024-07-17
syntax: true

Sometimes we need visual feedback beyond what browsers provide for interactive
elements by default. A common pattern is to shift the respective element's
position in
[activation state](https://css-tricks.com/remember-selectors-with-love-and-hate/),
making interactions more salient (and perhaps a little more satisfying).

```embed uri=./demo1.html resize
```

```css
a:active,
button:active {
    translate: 1px 1px;
}
```

Ahmad Shadeed's
[Understanding Clip Path in CSS](https://ishadeed.com/article/clip-path/#ripple-effect)
provides an approach to approximate Material Design's more elaborate
[ripple effect](https://m2.material.io/develop/web/supporting/ripple)
with just a few lines of CSS -- adapted here to provide a barebones
implementation for reuse:

```embed uri=./demo2.html resize
```

```css
.ripple {
    --ripple: 0%;

    position: relative;
}
.ripple:is(:focus, :active) {
    --ripple: 100%;
}

.ripple::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: currentcolor;
    opacity: 0.5;
    clip-path: ellipse(var(--ripple) var(--ripple) at center);
}

@media (prefers-reduced-motion: no-preference) {
    .ripple::after {
        transition: clip-path 500ms ease-out;
    }
}
```

This might not always be a good idea though; such effects can easily become
annoying. I typically only use it for
[simple demos](page://snippets/html-boilerplate).

```aside
We could use the
[`transitionend` event](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event)
to remove the effect again via JavaScript, making it temporary rather than
permanent.
```
