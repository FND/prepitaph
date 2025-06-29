title: HTML Templating Lessons
tags: html, javascript
author: FND
created: 2026-06-29
syntax: true

```intro
Joe Lanman's
[inquiry about server-side templating](https://hachyderm.io/@joelanman/114766728099631282)
prompted me to connect some dots for myself.
```

I used to be a staunch proponent of logicless templating. Years of
conversations with folks like [Till](https://nrw.social/@tillsc) and
[Lucas](https://lucas.dohmen.io), along with countless experiments and
real-world experience, gradually led me to the following realizations:

* There are [three types of markup](page://wip/dom-rendering#markup-categories):
  static boilerplate, variable parts defined once upon instantiation and
  dynamically-updated portions. The latter is irrelevant for server-side
  templating.
* Any dedicated templating language often turns out to be less than ideal,
  possibly even problematic -- especially with regard to
  [composable abstractions](page://articles/markup-abstractions). Thus it's
  generally preferable to just
  [rely on the well-defined language](https://justinfagnani.com/2025/06/26/the-time-is-right-for-a-dom-templating-api/#:~:text=usually%20expressions)
  you're already using for your system anyway.
* ... which is particularly feasible with JavaScript's tagged templates. Those
  also provide decent ergonomics, which is an important factor.
* Generating HTML isn't magic; it's actually
  [fairly straightforward](page://articles/lightweight-html-templating).

While I hesitate to recommend the DIY approach described in that last post -- in
part because it currently lacks proper authoring documentation -- I increasingly
find myself relying on
[my own single-module implementation](https://github.com/FND/wintertc-app/blob/567ef42bec5e491d07d18a82c163b0da9a64f26e/src/lib/html.js)
(remember that I've become very
[wary of dependencies](page://articles/banishing-npm)) -- especially for
experiments and small prototypes. That typically looks something like this:

```javascript
import { renderDocument } from "./doc.js";
import { html } from "./html.js";

let title = "Hello World";
renderDocument({
    lang: "en",
    title
}, html`
<h1>${title}</h1>
<form method="post"${{ action: url }}>
    ${textField("Name", "name")}
    ${textField("Description", "desc", { multiline: true })}
    <button>Submit</button>
</form>
`);

function textField(caption, name, { multiline }) {
    let field = multiline
            ? html`<input type="text"${{ name }}>`
            : html`<textarea${{ name }}></textarea>`;
    return html`
<label>
    <b>${caption}</b>
    ${field}
</label>
    `;
}
```

YMMV.
