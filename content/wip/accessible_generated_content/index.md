title: Accessible Generated Content
tags: css
author: FND
created: 2024-07-11
syntax: true

Let's assume we have a simple collection of articles of different types:

```html
<article>
    <h2>Hello World</h2>
    <small class="content-type">blog post</small>
</article>

<article>
    <h2>Lipsum</h2>
    <small class="content-type" data-symbol="✏️">work in progress</small>
</article>
```

```embed uri=./demo.html resize
```

We're using CSS's
[`attr()`](https://developer.mozilla.org/en-US/docs/Web/CSS/attr) to add a
decorative icon: Either a default or drawn from `data-symbol`. Unfortunately,
fallback values are not yet widely supported there, resulting in `content:
attr(data-symbol, "📝")` possibly being ignored. But we can employ the cascade
for a universal fallback:

```css
content: "📝 ";
content: attr(data-symbol, "📝") " ";
```

If we now want to
[improve accessibility](https://front-end.social/@mayank/112764025458966324) via
alternative text, also not universally supported yet, we need account for
additional permutations:

```css
/* baseline */
content: "📝 ";
content: "📝 " / "";

/* dynamic */
content: attr(data-symbol, "📝") " ";
content: attr(data-symbol, "📝") " " / "";
```

This seems less than ideal, but perhaps inevitable at this point? When in doubt,
rely on [Jeremy Keith's guiding principles](https://adactio.com/journal/7706):

> given the choice between making something my problem, and making something the
> user's problem, I'll choose to make it my problem every time
