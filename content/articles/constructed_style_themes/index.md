title: Theming with Constructed Style Sheets
tags: web, css, javascript
author: FND
created: 2023-11-26
syntax: true

```intro
Constructable Style Sheets are useful to inject and control styles via
JavaScript.
```

Let's assume we're building a client-side, JavaScript-heavy component or
application. (In rare cases, such transgressions might actually be warranted.)
Our theme colors might reside in a JavaScript module:

```javascript
export let light = {
    foreground: "#000",
    background: "#FFF",
    shadow: "#0008"
};

export let dark = {
    foreground: "#FFF",
    background: "#000"
};
```

Naturally we wanna turn those into CSS custom properties:

```css
:root {
    &.theme-light {
        --color-foreground: #000;
        --color-background: #FFF;
        --color-shadow: #0008;
    }

    &.theme-dark {
        --color-foreground: #FFF;
        --color-background: #000;
    }
}

my-component {
    color: var(--color-foreground);
    background-color: var(--color-background);
    box-shadow: 0 0.2rem 0.8rem var(--color-shadow);
}
```

We might add those custom properties directly to our
[root element](https://developer.mozilla.org/en-US/docs/Web/API/Document/documentElement):

```javascript
import { light, dark } from "./themes.js";

let colors = Math.random < 0.5 ? light : dark;

let root = document.documentElement;
for(let [name, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${name}`, value);
}
```

Here we only apply a single theme's values instead of relying on `.theme-*`
classes as sketched out above; imagine there's a button to toggle between
`light` and `dark` value assignments.

This works fine for the most part, but there are two subtle issues:

* Applying styles to an element like that creates inline styles, resulting in
  distracting DOM pollution: `<html … style="--color-foreground: #000; …">`.
* You might have noticed that our dark theme is missing `--color-shadow`. That's
  intentional, so when switching themes, we have to make sure to not just
  overwrite existing values but also remove unused ones.

Fortunately, there's a simple way around that now:
[constructed style sheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet).

```javascript
let THEME = new CSSStyleSheet();
document.adoptedStyleSheets.push(THEME);

function applyTheme(colors) {
    let css = Object.entries(colors).
        map(([name, value]) => `--color-${name}: ${value};`).
        join("\n");
    THEME.replace(`:root { ${css} }`);
}
```

While this capability was
[originally introduced](https://web.dev/articles/constructable-stylesheets) to
improve efficiency for Shadow DOM, it's useful for manipulating style sheets in
general. The downside is that this kind of string concatenation always feels a
little icky compared to key-value assignments, though it doesn't seem so bad in
this context.

```embed uri=./demo.html
```

```aside
Actually, there's another downside: This being me, I remain unsure whether to
use "constructed", "constructable" or both (contextually, as evidenced here).
[Such issues](https://martinfowler.com/bliki/TwoHardThings.html) are
[nothing new](https://github.com/w3c/ServiceWorker/issues/705), of course -- on
the other hand, here's yet another reason to avoid
[web sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).
```
