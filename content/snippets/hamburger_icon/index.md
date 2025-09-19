title: Animated Hamburger Icon
tags: svg
author: FND
created: 2025-09-19
syntax: true

```intro
While I'm generally skeptical of hamburger menus, sometimes they seem
unavoidable -- or at least pragmatic in a resigned kind of way. So we might as
well try to get the icon right.
```

```embed uri=./demo-checkbox.html resize
```

We start with some SVG to paint three horizontal lines in stacked configuration:

```svg
<svg viewBox="0 0 35 35" class="menu-icon">
    <line x1="1.5" y1="7.5" x2="33.5" y2="7.5" />
    <line x1="1.5" y1="17.5" x2="33.5" y2="17.5" />
    <line x1="1.5" y1="27.5" x2="33.5" y2="27.5" />
</svg>
```

Then we add basic styling:

```css
.menu-icon line {
    stroke: currentColor;
    stroke-width: 3px;
    stroke-linecap: round;
}
```

```aside
`px` in CSS corresponds to
[user units](https://www.w3.org/TR/SVG/coords.html#TermUserUnits) in SVG.
```

Now we want to turn those lines into a
[saltire](https://en.wikipedia.org/wiki/Saltire) by disappearing the middle one
and transforming the remaining two (assuming `.is-alt` for this alternate
state):

```css
.menu-icon.is-alt line {
    &:first-of-type,
    &:last-of-type {
        transform-origin: 7px 23px;
        translate: 0 -1.5px;
        rotate: -45deg;
    }

    &:first-of-type {
        transform-origin: 4px 13px;
        rotate: 45deg;
    }

    &:nth-of-type(2) {
        opacity: 0;
    }
}
```

Note that we're using `transform-origin` instead of -- or in addition to --
regular translation. We can use that to create a reasonably pleasing animation
when transitioning between both states:

```css
.menu-icon line {
    @media (prefers-reduced-motion: no-preference) {
        transition: none 300ms ease;
        transition-property: transform-origin, translate, rotate, opacity;
    }

    &:first-of-type {
        transform-origin: 2px 8px;
    }

    &:last-of-type {
        transform-origin: 2px 26px;
    }

    &:nth-of-type(2) {
        animation-duration: 150ms;
    }
}
```

```aside
I would never have considered animating `transform-origin`; I only learned about
this when analyzing [tagesschau.de](https://www.tagesschau.de)'s implementation.

There's probably a simpler, more compact approach, but getting animations right
is an arduous task; feel free to suggest alternatives.
```

As usual, we should be aware of accessibility implications: Toggling a class
does not convey any semantic information about state changes, so we'll typically
want to employ meaningful elements and hook into their respective states instead
(e.g. `input[type=checkbox]:checked` or `details[open]`).

```embed uri=./demo-details.html
```
