title: Tricking Browsers into Nesting Forms
tags: html, javascript
author: FND
created: 2024-05-04
syntax: true

```intro
Turns out the HTML parser and DOM APIs don't always agree on semantic
constraints.
```

HTML does not permit nesting `<form>` elements:

```html
<form method="dialog">
    <button>Submit</button>
    <dialog>
        <form method="dialog">
            <button>Close</button>
        </form>
    </dialog>
</form>
```

```embed uri=./demo1.html resize
```

Here the _HTML parser_ discards the nested `<form>` element, leaving its
`<button>` as a direct descendant of `<dialog>`.

However, the same structure works if we insert our nested form via the DOM
instead:

```html
<form method="dialog">
    <button>Submit</button>
    <dialog></dialog>
</form>
```

```javascript
let form = document.createElement("form");
form.setAttribute("method", "dialog");

let btn = document.createElement("button");
btn.textContent = "Close";
form.appendChild(btn);

document.querySelector("form dialog").appendChild(form);
```

```embed uri=./demo2.html resize
```

Brian Kardell [points out](https://bkardell.com/blog/known-knowns.html) that
this is expected behavior:

> it's [possible] to create trees that are impossible to create with the parser
> itself, if you do it dynamically. With the DOM API, you can create whatever
> wild constructs you want

In fact, that nested form appears to behave just like a regular one: It properly
closes the dialog without any custom JavaScript. (There's a custom `submit`
event handler in both demos above to _open_ the respective dialog.)

Note that all this appears to be independent of `<dialog>`, i.e. it works the
same way with a `<div>`.

Either way, this is probably not something we should rely on. There are
[other options](https://www.htmhell.dev/adventcalendar/2023/3/) these days.
