title: Virtual JavaScript Modules
tags: javascript
author: FND
created: 2024-03-23
syntax: true

```intro
Given my penchant for [minimal test cases](page://snippets/html-boilerplate) and
[local applications](page://articles/web-fs), I sometimes run into situations
where I can't load external JavaScript files. Typically that's because ESM is
[unsupported](page://articles/banishing-npm#fn:bundling) for `file://` URIs or
because I don't wanna rely on additional assets for a Web Worker.
```

In such cases, we can resort to creating a
[`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) from the
respective source code:

```javascript
function code2uri(txt, type = "text/javascript") {
    let blob = new Blob([txt], { type });
    let uri = URL.createObjectURL(blob);
    return {
        uri,
        release: () => URL.revokeObjectURL(uri)
    };
}
```

([Remember](page://articles/web-fs#ref:memleak) that we should discard blobs
after use. Nevertheless, they are preferable to
[`data:` URIs](page://articles/data-uris) in this particular context.)

I might then instantiate the aforementioned worker from within the same HTML
document:

```html
<script type="text/x-worker-module" id="my-worker">
self.addEventListener("message", ev => {
    self.postMessage(`pong ${ev.data}`);
});
</script>
```

```html
<script type="module">
let worker = script2worker("#my-worker");
worker.addEventListener("message", ev => {
    console.log("received", ev.data);
});
worker.postMessage("ping");
</script>
```

```javascript
function script2worker(selector) {
    let code = document.querySelector(selector).textContent;
    let { uri, release } = code2uri(code)
    let worker = new Worker(uri, { type: "module" });
    release();
    return worker;
}
```

```markdown allowHTML
For example, if you misguidedly employ
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), you
might wanna <s>ridicule</s> mock such connections for testing purposes:
```

```embed uri=./demo.html
```

```aside
This demo also uses a simplistic DOM console:

'''css
output {
    display: block;
    white-space: pre;
    font-family: monospace;
    line-height: 1.2;
}
'''

'''javascript
let LOG = document.createElement("output");
document.body.appendChild(LOG);

function log(...msg) {
    console.log(...msg);

    let txt = msg.map(item => {
        return typeof item === "string" ? item : `\`${jsonify(item)}\``;
    }).join(" ");
    LOG.appendChild(document.createTextNode(txt + "\n"));
}

function jsonify(value) {
    return JSON.stringify(value, null, 1).
        replace(/\n */g, " "). // discard line breaks
        replace(/([^ ]) \]/g, "$1]").replace(/\[ ([^ ])/g, "[$1"); // prettify arrays
}
'''
```
