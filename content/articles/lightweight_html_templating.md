title: Lightweight HTML Templating with JavaScript
tags: html, javascript
author: FND
created: 2023-02-10
syntax: true

```intro
Sometimes I need to generate HTML without relying on external dependencies.
```

In such cases, I might resort to the simplest thing that could possibly work:
string stitching.

```javascript
let link = `<a href="${uri}">${caption}</a>`;
```

Of course that's a surefire way to risk code injection: Even if we trust the
purveyor of those `uri` and `caption` values, it becomes that source's
responsibility to sanitize those values.

Consequently, I've been carrying around this little function for escaping
HTML:

```javascript
// adapted from TiddlyWiki <https://tiddlywiki.com> and Python 3's `html` module
function encodeHTML(str, isAttribute) {
    str = str.replaceAll("&", "&amp;");
    if(isAttribute) {
        return str.replaceAll('"', "&quot;").
            replaceAll("'", "&#x27;");
    }
    return str.replaceAll("<", "&lt;").
        replaceAll(">", "&gt;");
}
```

```aside compact
Yes, that `isAttribute` boolean makes for an awkward function signature; flag
arguments tend to be a code smell. This particular implementation might also
result in spurious encoding for attribute values. Let's ignore all that here; I
have yet to find an approach I'm truly comfortable with.

Also see [this discussion](https://github.com/complate/complate-stream/pull/52)
for performance considerations.

Note that there's now an experimental
[API for sanitizing HTML](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)
in some browsers.
```

We can use that for safer stitches:

```javascript
let link = `<a href="${encodeHTML(uri, true)}">${encodeHTML(caption)}</a>`;
```

That's better, but still makes escaping the respective author's responsibility;
such things are very easy to forget or overlook. Relying on
individuals' discipline is rarely a robust strategy.

We can employ
[tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates)
to ensure dynamic values -- i.e. interpolated parts of our template strings --
are always encoded:

```javascript
let link = html`<a href=${uri}>${caption}</a>`;

function html(strings, ...values) {
    let i = 0;
    let res = [strings[i]];
    for(let value of values) {
        i++;
        res.push(encodeHTML(value, true));
        res.push(strings[i]);
    }
    return res.join("");
}
```

That's a lot safer and more convenient, but it doesn't distinguish between
attributes and content, resulting in some unnecessary encoding.

```aside
Generator functions can come in handy for this kind of tagged template, e.g.
when streaming is desirable:

'''javascript
function* recombine(strings, ...values) {
    let i = 0;
    yield strings[i];
    for(let val of values) {
        i++;
        yield val;
        yield strings[i];
    }
}
'''
```

How about this instead:

```javascript
let link = html`<a${{ href: uri }}>${caption}</a>`;

function html(strings, ...values) {
    let i = 0;
    let res = [strings[i]];
    for(let value of values) {
        i++;
        res.push(typeof value === "string" ? encodeHTML(value) :
                serializeAttributes(value));
        res.push(strings[i]);
    }
    return res.join("");
}

function serializeAttributes(attribs) {
    let res = Object.entries(attribs).reduce((memo, [name, value]) => {
        return value ? memo.concat(`${name}="${encodeHTML(value, true)}"`) : memo;
    }, []);
    return res.length === 0 ? "" : [""].concat(res).join(" ");
}
```

Here we use the respective value's type to distinguish content (strings) from
attributes (objects) -- which also makes for declarative authoring syntax.

Caveat: This implementation doesn't encode attribute names, though I'm not sure
whether that'd ever be a sensible thing to do.

We also don't support consciously injecting raw HTML. Let's remedy that:

```javascript
let RAW = Symbol("raw HTML");

let link = html`<a${{ href: uri }}>${{
    [RAW]: "my <em>other</em> website"
}}</a>`;

function html(strings, ...values) {
    let i = 0;
    let res = [strings[i]];
    for(let value of values) {
        i++;
        if(typeof value === "string") {
            res.push(encodeHTML(value));
        } else if(value) {
            res.push(value[RAW] || serializeAttributes(value));
        }
        res.push(strings[i]);
    }
    return res.join("");
}
```

Note that we snuck in a convenience feature: If a value is
[falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy), nothing will
be emitted there -- which allows for shorthand expressions like
`${condition && value}`. In fact, `serializeAttributes` already ignores falsy
attributes.

One could even imagine an asynchronous version which supports promises; that
would be particularly handy for streaming HTML. A colleague created
[Staggard](https://deno.land/x/staggard) for that exact purpose.

```disclosure markdown caption="Here's the final implementation ([augmented](page://articles/typed-javascript) with static types, just in case)."
'''javascript
let RAW = Symbol("raw HTML");

/**
 * @param {string} str
 * @returns {TrustedContent}
 */
export let trustedHTML = str => ({
    [RAW]: str,
    toString: () => str,
});

/**
 * @param {TemplateStringsArray} strings
 * @param {...(HTMLContent | HTMLContent[])} values
 * @returns {TrustedContent}
 */
export function html(strings, ...values) {
    let i = 0;
    let res = [strings[i]];
    for(let value of values) {
        i++;
        if(typeof value === "number") {
            value = value.toString();
        }
        if(typeof value === "string") {
            res.push(encodeHTML(value));
        } else if(value === false || value === null || value === undefined) {
            // no-op
        } else if(RAW in value) {
            res.push(value[RAW]);
        } else if(Array.isArray(value)) { // XXX: crude
            for(let entry of value) {
                res.push(html`${entry}`[RAW]);
            }
        } else {
            value = serializeAttributes(/** @type {Attributes} */ (value));
            res.push(value);
        }
        res.push(strings[i]);
    }
    return trustedHTML(res.join(""));
}

/** @param {Attributes} attribs */
function serializeAttributes(attribs) {
    let res = Object.entries(attribs).reduce((memo, [name, value]) => {
        if(typeof value === "number") {
            value = value.toString();
        }
        switch(value) {
            case false:
            case null:
            case undefined:
                return memo;
            case true:
                value = "";
                break;
        }
        return memo.concat(`${name}="${encodeHTML(value, true)}"`);
    }, /** @type {string[]} */ ([]));
    return res.length === 0 ? "" : [""].concat(res).join(" ");
}

/** @param {string} str */
function encodeHTML(str, isAttribute = false) {
    str = str.replaceAll("&", "&amp;");
    if(isAttribute) {
        return str.replaceAll('"', "&quot;").
            replaceAll("'", "&#x27;");
    }
    return str.replaceAll("<", "&lt;").
        replaceAll(">", "&gt;");
}

/**
 * @typedef {Content | false | TrustedContent | Attributes} HTMLContent
 * @typedef {Record<string, Content | boolean>} Attributes
 * @typedef {Record<typeof RAW, string> & { toString: () => string }} TrustedContent
 * @typedef {string | number | null | undefined} Content
 */
'''
```
