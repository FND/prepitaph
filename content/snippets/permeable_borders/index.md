title: Permeable Borders
tags: css
author: FND
created: 2025-03-26
syntax: true

```intro
Strict border controls are an anachronism, so why not have our CSS reflect that?
```

I recently encountered a
[decent article on React](https://blog.lusito.info/stop-using-and-recommending-react.html),
which included this design element:

```embed uri=./demo-border-image.html resize
```

I was intrigued and, instead of reading about legacy frameworks, set out to
fully understand how this works. Turns out the trick is to use a linear
gradient which fades into the background color.

That website's implementation boils down to this:

```css
.permeable {
    --_size: calc(0.5 * var(--spacing));
    --_color: cadetblue;

    position: relative;
    padding: calc(var(--spacing) + var(--_size));
    background-image: linear-gradient(45deg,
            var(--_color),
            transparent 25%,
            transparent 75%,
            var(--_color));

    &::before {
        content: "";
        position: absolute;
        inset: 0;
        margin: var(--_size);
        background-color: var(--color-bg);
    }

    > * {
        position: relative;
        z-index: 1;
    }
}
```

```embed uri=./demo-background.html resize
```

So our container element gets a linear gradient as background image. An
artificial overlay for the inner area restores the respective background color;
that leaves only parts of the background image visible, which then
appers as a border. The main catch here is that we need to know what that
background color should be; that might not always be obvious or accessible.

While I quickly understood this mechanical explanation, the resulting visual
effect wasn't entirely intuitive or predictable. So I built myself a
little control panel to [interactively explore](./demo-params.html) the effects
of various parameters:

```embed uri=./demo-params.html resize=once
```

This moves all relevant values into CSS custom properties, which can then be
modified via form controls. Playing around with those parameters really helped
me understand exactly _how_ that gradient affects the element's appearance. It
also made me realize that, arguably, a semi-transparent cover makes for a neat
effect in itself.

Fortunately, only after all this did I realize that the implementation could be
simplified by using `border-image` instead:

```css
.permeable {
    --_color: cadetblue;

    border: calc(0.5 * var(--spacing)) solid var(--_color);
    border-image: linear-gradient(45deg,
            var(--_color),
            transparent 25%,
            transparent 75%,
            var(--_color));
    border-image-slice: 1;
    padding: var(--spacing);
}
```

This is actually what the very first demo above uses -- and something I had
toyed with before in a different context:

```embed uri=./demo-fields.html resize
```

```css
input {
    border-width: 2px;
    border-image: linear-gradient(to bottom,
            transparent 75%,
            #AAA 50%);
    border-image-slice: 1;
}
```

Note, however, that messing with input fields' appearance is generally a
[terrible idea](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/#:~:text=boring),
so this probably shouldn't be used in practice.
