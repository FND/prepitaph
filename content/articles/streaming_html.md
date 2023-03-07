title: Streaming HTML
tags: http, html, performance
author: FND
created: 2023-03-03

```intro
Browsers begin rendering HTML even before the document has been fully downloaded,
which can greatly improve perceived performance. Servers can support such
progressive rendering by emitting partial HTML chunks as soon as possible.
```

Try entering
[`nc -l 9999`](https://explainshell.com/explain?cmd=nc+-l+9999) in a Unix
terminal, then direct your browser to [localhost:9999](http://localhost:9999)
and return to your terminal; there you'll see a raw HTTP request show up. Let's
respond with a
[minimal HTML document](https://brucelawson.co.uk/2010/a-minimal-html5-document/)
by typing out some raw HTTP of our own:

```
HTTP/1.1 200 OK
Content-Type: text/html

<title>Hello World</title>
<h1>Welcome</h1>
<p>Nice to
see you here.</p>
```

Keep an eye on your browser while doing so: As soon as you enter the `<title>`
line, "Hello World" should show up in the browser's title
bar[buffering](footnote://) -- while the page itself remains blank for the
moment. Continuing your response with the next line, you should see the
corresponding heading appear ... and so on. (You'll note that
[chunked encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding)
is not necessary for this to work.)

```footnote buffering
Buffering might get in the way here: Some browsers require a minimum amount of
bytes before they start rendering. Firefox seems to have a threshold of ~1 kB
while Chrome starts rendering immediately.
```

It's easy to imagine how this can make a page appear much more responsive to end
users. Plus it enables user agents to start fetching auxiliary resources (e.g.
style sheets or images) early on, which further improves
performance.[dsd](footnote://)

```footnote dsd
One recent experiment demonstrated how this mechanism can also be employed for
application-specific enhancements, in this case by re-arranging the source order
of elements:

> I've been playing with streaming Declarative Shadow DOM recently and it
> enables some pretty unique behaviour - e.g.
> [enamel.pages.dev](https://enamel.pages.dev) - a completely JS free, backend
> agnostic way to deliver your page shell instantly and progressively load in
> slotted content as it's received

-- [Web Component Bytes](https://twitter.com/wcbytes/status/1541546418539732997)
```

Progressive rendering has
[long](https://blog.codinghorror.com/the-lost-art-of-progressive-html-rendering/)
been a feature of web browsers, yet many applications and frameworks flat out
ignore this possibility, instead generating the entire document -- potentially
held up by database queries or other complex operations -- before sending the
first byte over the wire[servers](footnote://) (not to mention
[SPAs'](https://en.wikipedia.org/wiki/Single-page_application) empty-`<body>`
approach).

```footnote servers
I sometimes illustrate the difference with minimal server implementations, e.g.
using [WSGI](https://gist.github.com/FND/76cf34ddca1e258aa502d70ec98d551d) or
[Express](https://gist.github.com/FND/b0db6be61b71b19acf555171be0f9022). Those
of course don't address templating libraries or any other part of the system
which might interfere.
```

Critics sometimes point to a perceived mismatch with HTTP status codes, which
need to be determined before sending body content (given it's the first line in
our response there): How can we emit content before we're sure that the entire
document was generated successfully? While that can be a valid concern, in
practice its significance is often easy to refute upon investigating the
respective domain logic and its actual error scenarios. On a more prosaic level,
it's worth remembering that connections might drop mid-transmission for any
number of reasons -- so that's a scenario we have to contend with one way or
another.

[The weirdly obscure art of Streamed HTML](https://dev.to/tigt/the-weirdly-obscure-art-of-streamed-html-4gc2)
goes into more detail while
[the year of web streams](https://jakearchibald.com/2016/streams-ftw/) and
[Fun hacks for faster content](https://jakearchibald.com/2016/fun-hacks-faster-content/)
explain how to utilize the same principles in conjunction with client-side
JavaScript.
