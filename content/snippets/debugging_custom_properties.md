title: Debugging CSS Custom Properties
tags: css
author: FND
created: 2024-07-18
syntax: true

In sharing a technique for
[determining viewport dimensions with CSS](https://css-tip.com/screen-dimension/),
Temani Afif demonstrated that
[counters](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_counter_styles/Using_CSS_counters)
can be used to display the current (numeric) value of custom properties in any
given context.

```css
:root {
    --my-value: 123;
}

body::before {
    content: counter(my-counter);
    counter-reset: my-counter var(--my-value);
}
```

This seems useful for debugging purposes, revealing the respective value right
there on the page instead of arduously inspecting individual instances via
developer tools.
