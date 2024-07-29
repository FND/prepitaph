title: Garbage Collection for Event Listeners
tags: javascript
author: FND
created: 2024-07-29
syntax: true

```intro
In order to avoid memory leaks and prevent subtle bugs, we typically need to
remove event listeners when the respective DOM element disappears. Except the
browser already takes care of this for descendants.
```

This is best exemplified with a custom element:

```embed uri=./demo.html resize
```

```javascript
customElements.define("dummy-dialog", class extends HTMLElement {
    connectedCallback() {
        // …

        this.addEventListener("pointerenter", this);
        this.addEventListener("pointerleave", this);
        this.addEventListener("input", this);

        this._container = document.body;
        this._container.addEventListener("click", this);
    }

    disconnectedCallback() {
        this._container.removeEventListener("click", this);
    }

    handleEvent(ev) {
        // …
    }
});
```

`connectedCallback` sets up event handlers to respond to

* cursor movements on the element itself (`pointerenter` and `pointerleave`)
* value changes on the form field within (`input`)[bubbling](footnote://)
* clicks anywhere outside our custom element

```footnote bubbling
We're taking advantage of event delegation here to avoid having to select a
specific form field, letting the `input` event bubble up to our custom element.
The behavior would remain the same with something like
`this.querySelector("input").addEventListener("input", this)`.
```

Yet `disconnectedCallback` only needs to de-register the last event handler
there. That's because when an element is removed from the
DOM[disconnect](footnote://), the browser automatically scraps event listeners
for that element and its children, so we don't have to take care of those
ourselves: In the demo above, the console's instrumentation shows that none of
the listeners are invoked after discarding our element.

```footnote disconnect
Note that changing an element's location in the DOM (e.g. moving it to the
bottom via `document.body.appendChild(document.querySelector("dummy-dialog"))`)
also invokes `disconnectedCallback`, before invoking `connectedCallback` again.
```

The browser can't reasonably do the same for elements beyond those immediately
affected by the removal; it doesn't know about the connection between our custom
element and its parent container.
