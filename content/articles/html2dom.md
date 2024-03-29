title: From HTML to DOM Nodes
tags: html, javascript
author: FND
created: 2023-08-17
syntax: true

```intro
Every once in a while, I need to turn HTML strings into DOM nodes. The
mechanisms for doing so are less than obvious and nuanced.
```

Having HTML but wanting DOM nodes is reasonably common in my little universe,
whether for
[simple templating](page://articles/lightweight-html-templating),
[transclusion](page://articles/means-of-transclusion) or a host of other use
cases.

Injecting HTML into a DOM node seems fairly straightforward at first: That's
what
[`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
(or even
[`outerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML))
is for! References to any particular DOM node can then be obtained via the usual
DOM-traversal APIs:

```javascript
let tmp = document.createElement("div");
tmp.innerHTML = "<p>hello world</p>";
let message = tmp.firstChild;
```

Even disregarding
[security concerns](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations)[sanitization](footnote://),
this might not be what we want though: It implies that our HTML string only
contains
[flow content](https://html.spec.whatwg.org/multipage/dom.html#flow-content), so
[metadata content](https://html.spec.whatwg.org/multipage/dom.html#metadata-content)
(think `<head>` or `<title>`) might lead to unexpected results. This particular
implementation also assumes that our HTML string contains exactly one root node,
which might not always be the case.

```footnote sanitization
Future browsers might support the
[HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)
to safely inject untrusted HTML.
```

We can avoid worrying about content categories by employing the built-in
parser's
[`parseFromString`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString)
method, which always returns a proper document:

```javascript
let parser = new DOMParser();
let doc = parser.parseFromString("<p>hello world</p>", "text/html");
let message = doc.body.firstChild;
```

While `<script>` elements will _not_ be executed here (for somewhat
[arcane reasons](https://www.w3.org/TR/2008/WD-html5-20080610/dom.html#dynamic0)
related to `document.write`), the aforementioned security concerns still apply:
There are other ways to inject markup which results in JavaScript being
evaluated.

Now, sometimes we _do_ want to execute `<script>` elements within our HTML
string (e.g. if we're perpretating crimes of transclusion). For that we can
employ the somewhat obscure
[`createContextualFragment`](https://developer.mozilla.org/en-US/docs/Web/API/range/createContextualFragment)
API:

```javascript
let fragment = document.createRange().createContextualFragment(`
<p>hello world</p>
<script>console.log("hello world");</script>
`.trim());
```

This works pretty much like the `innerHTML` approach above -- with all the
drawbacks -- except `<script>` tags are indeed executed as soon as the
respective element is added to the document (e.g. via
`document.body.append(fragment)`).

If we want to avoid worrying about content categories while also executing
`<script>` tags, we might combine both approaches:

```javascript
let tmp = new DOMParser().parseFromString(`
<head>
    <title>hello world</title>
</head>
<body>
    <h1>hello world</h1>
    <script>console.log("hello world");</script>
</body>
`.trim(), "text/html");
document.documentElement.innerHTML = tmp.documentElement.innerHTML;

for (let node of document.querySelectorAll("script")) {
    let fragment = document.createRange().createContextualFragment(node.outerHTML);
    node.replaceWith(fragment);
}
```

([Turns out](https://twitter.com/jaffathecake/status/1565355352962768896)
`node.replaceWith(node.cloneNode(true))` does _not_ suffice here.)

In this example, we're replacing the entire document. Well, almost: Transferring
`<html>` attributes between old and new document is left as an exercise for the
reader.

```aside
If you ever need to do the reverse, i.e. serialize the entire DOM, this might be
of use:

'''javascript
let doctype = new XMLSerializer().serializeToString(document.doctype);
let html = [doctype, document.documentElement.outerHTML].join("\n");
'''
```
