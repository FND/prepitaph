title: Skeumorphic Text Highlighting
tags: css
author: FND
created: 2023-12-18
syntax: true

```markdown allowHTML
Sometimes it's useful to <mark class="type1">highlight text passages</mark>
within a web page.

I occasionally use this for personal notes, especially in
<mark class="type2">preparation for meetings</mark>, to ensure I have easy
access to both the <mark class="type3">most salient points</mark> and their
respective context.
```

CSS adapted from [Matt Pi](https://stackoverflow.com/a/62484130) and
[Max Hoffmann](https://stackoverflow.com/a/64127605). Unfortunately (though
inevitably?), this is littered with magic numbers.

```css
mark:is(.type1, .type2, .type3) {
    display: inline-block;
    background-color: transparent;

    &:is(.type1, .type3) {
        --_color: #82FFAD;
    }

    &.type1 {
        --_spacing: 0.2rem;

        margin-inline: calc(-1 * var(--_spacing));
        padding-inline: var(--_spacing);
        background-image: linear-gradient(104deg,
                transparent 0.9%,
                var(--_color) 2.4%,
                color-mix(in srgb, var(--_color), transparent 50%) 5.8%,
                color-mix(in srgb, var(--_color), transparent 90%) 93%,
                color-mix(in srgb, var(--_color), transparent 30%) 96%,
                color-mix(in srgb, var(--_color), transparent 90%) 98%),
            linear-gradient(183deg,
                color-mix(in srgb, var(--_color), transparent 50%) 0%,
                color-mix(in srgb, var(--_color), transparent 70%) 7.9%,
                color-mix(in srgb, var(--_color), transparent 80%) 15%);
        text-shadow: -0.75rem 0.75rem 0.6125rem
                color-mix(in srgb, var(--_color), transparent 30%),
                1.25rem -0.6125rem  0.5rem #FFF,
                -1.125rem -1.6125rem 1.875rem #FFF;
    }

    &:is(.type2, .type3) {
        --_block-spacing: 0.1em;
        --_inline-spacing: 0.4em;

        margin-inline: calc(-1 * var(--_inline-spacing));
        padding: var(--_block-spacing) var(--_inline-spacing);
        border-radius: calc(2 * var(--_inline-spacing)) calc(3 * var(--_block-spacing));
        font-weight: 500;
        background-image: linear-gradient(to right,
                color-mix(in srgb, var(--_color), transparent 90%),
                color-mix(in srgb, var(--_color), transparent 30%) 4%,
                color-mix(in srgb, var(--_color), transparent 70%));
        box-decoration-break: clone;
    }

    &.type2 {
        --_color: #FF0;
    }
}
```

```markdown allowHTML
<style class="visually-hidden">
.snippet mark {
    display: inline-block;
    background-color: transparent;
}

.snippet mark.type1,
.snippet mark.type3 {
    --_color: #82FFAD;
}

.snippet mark.type1 {
    --_spacing: 0.2rem;

    margin-inline: calc(-1 * var(--_spacing));
    padding-inline: var(--_spacing);
    background-image: linear-gradient(104deg,
            transparent 0.9%,
            var(--_color) 2.4%,
            color-mix(in srgb, var(--_color), transparent 50%) 5.8%,
            color-mix(in srgb, var(--_color), transparent 90%) 93%,
            color-mix(in srgb, var(--_color), transparent 30%) 96%,
            color-mix(in srgb, var(--_color), transparent 90%) 98%),
        linear-gradient(183deg,
            color-mix(in srgb, var(--_color), transparent 50%) 0%,
            color-mix(in srgb, var(--_color), transparent 70%) 7.9%,
            color-mix(in srgb, var(--_color), transparent 80%) 15%);
    text-shadow: -0.75rem 0.75rem 0.6125rem
            color-mix(in srgb, var(--_color), transparent 30%),
            1.25rem -0.6125rem  0.5rem #FFF,
            -1.125rem -1.6125rem 1.875rem #FFF;
}

.snippet mark.type2,
.snippet mark.type3 {
    --_block-spacing: 0.1em;
    --_inline-spacing: 0.4em;

    margin-inline: calc(-1 * var(--_inline-spacing));
    padding: var(--_block-spacing) var(--_inline-spacing);
    border-radius: calc(2 * var(--_inline-spacing)) calc(3 * var(--_block-spacing));
    font-weight: 500;
    background-image: linear-gradient(to right,
            color-mix(in srgb, var(--_color), transparent 90%),
            color-mix(in srgb, var(--_color), transparent 30%) 4%,
            color-mix(in srgb, var(--_color), transparent 70%));
    box-decoration-break: clone;
}

.snippet mark.type2 {
    --_color: #FF0;
}
</style>
```
