title: Text Compression with Web Standards
tags: javascript
author: FND
created: 2026-01-25
syntax: true

```intro
An ill-advised return to the rabbit hole of
[personal web apps](https://codeberg.org/FND) and
[client-side secrets](page://articles/web-crypto-secrets) left me with a series
of usability challenges. Naturally, those could only be addressed by fumbling
with byte streams.
```

For environmental reasons _\*scowls at mobile operating systems*_, I felt the
need to encode non-trivial amounts of
[state in the URL](https://plus.excalidraw.com/blog/end-to-end-encryption).[affordances](footnote://)
That inevitably led to a desire to at least keep the URL as short as possible by
smooshing redundant bits.

```footnote affordances
Turns out iOS's recalcitrant
[PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) support
also means that web views don't reliably remember HTTP credentials, so I had to
resort to an application-level solution instead.

I also needed to store additional details, so in compliance with the law of
single-page applications, I ended up ignoring existing affordances to build a
semi-secure DIY solution.
```

Fortunately, browsers now expose their compression routines to JavaScript. These
APIs are designed around the assumption of network traffic, so we have to deal
with streams, which isn't always intuitive.

```embed uri=./demo.html resize
```

All we want here is a function that accepts a string and returns a compressed
byte representation:

```javascript
/**
 * @param {string} txt
 * @returns {Promise<Uint8Array>}
 */
function compress(txt) {
    let stream = txt2stream(txt).
        pipeThrough(new TextEncoderStream()).
        pipeThrough(new CompressionStream("gzip"));
    return stream2bytes(stream);
}
```

In our case, we can use
[`toBase64`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64)
(where supported[base64](footnote://)) to convert those bytes to text again so
we can stuff that into the URL.

```footnote base64
'''markdown allowHTML
For ASCII-only strings, we might use
[ancient technology](https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa)
instead:<br>
`btoa(new TextDecoder().decode(bytes))`
'''
```

Now we just need to implement those conversion helpers. Let's start with turning
our string into a stream so we can start piping data through the compressor:

```javascript
/** @param {string} txt */
function txt2stream(txt) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(txt);
            controller.close();
        },
    });
}
```

Kinda awkward, but tests are green. Eventually we'll be able to just use
[`ReadableStream.from`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/from_static)
instead.

Next we want to turn streamed data into a byte array:

```javascript
/**
 * @param {ReadableStream} stream
 * @returns {Promise<Uint8Array>}
 */
async function stream2bytes(stream) {
    let reader = stream.getReader();
    let res, chunk;
    while (chunk = await reader.read()) {
        if (chunk.done) {
            break;
        }

        res = res ? combine(res, chunk.value) : chunk.value;
    }
    return res ?? new Uint8Array();
}

/**
 * @param {Uint8Array} first
 * @param {Uint8Array} second
 */
function combine(first, second) {
    let res = new Uint8Array(first.length + second.length);
    res.set(first);
    res.set(second, first.length);
    return res;
}
```

That seems even more cumbersome, but I guess we'll have to live with it? Well,
with those aforemention network assumptions in mind, we can apply one weird
trick (thanks,
[foxy Jake](https://mastodon.social/@firefoxwebdevs/115933745141491485)):

```javascript
async function stream2bytes(stream) {
    let blob = await new Response(stream).blob();
    return new Uint8Array(await blob.arrayBuffer());
}
```

In fact, it gets even simpler, so we might as well inline it:

```javascript
function compress(txt) {
    let stream = txt2stream(txt).
        pipeThrough(new TextEncoderStream()).
        pipeThrough(new CompressionStream("gzip"));
    let blob = await new Response(stream).blob();
    return blob.bytes();
}
```

Resolving Base64-encoded data from the URL is left as an exercise for the
reader.
