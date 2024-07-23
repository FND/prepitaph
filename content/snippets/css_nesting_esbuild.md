title: CSS Nesting Syntax Conversion
tags: css
author: FND
created: 2024-07-13
syntax: true

[CSS nesting syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting)
is not universally supported yet, so we can either avoid or convert it. For the
latter I've come to appreciate [esbuild](https://esbuild.github.io).

```figure filename=sample.css
'''css
article {
    h2 {
        color: cadetblue;
    }
}
'''
```

```shell
$ esbuild --supported:nesting=false ./sample.css
article h2 {
    color: cadetblue;
}
```

Sometimes we might want to go a little further, using a JavaScript file as our
entry point -- which can be particularly useful for front-end widgets:

```figure filename=component.js
'''javascript
import "./sample.css";
import "./sample.js";
'''
```

```figure filename=sample.js
'''javascript
customElements.define("sample-component", class extends HTMLElement {
    // …
});
'''
```

```shell
$ esbuild --bundle --format=esm --supported:nesting=false \
        --outdir=./dist ./component.js
```

This will generate two independent files, `dist/component.js` and
`dist/component.css`, clearly separating JavaScript and CSS (i.e. there's no
magic integration happening here).

Note that bundling changes the way assets are handled, so we might need to
specify a loader:

```css
article {
    background-image: url(./bg.png);
}
```

```shell
$ esbuild … --bundle --loader:.png=copy --outdir=./dist
```

This will generate a fingerprinted copy of `bg.png` within `dist` and make sure
that the reference within CSS is transformed accordingly.
