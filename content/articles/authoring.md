title: Authoring Guide
tags: unlisted
author: FND
created: 2023-09-03
syntax: true

Pages are generated from `content/<category>/<name>.md` or `…/<name>/index.md`
(i.e. either as a stand-alone Markdown file or as `index.md` within a
subdirectory); the latter allows including additional assets. Page categories
are defined within `src/config/index.js`.

[Markdown](https://commonmark.org) files start with an
[RFC 822-style block](https://github.com/FND/metacolon) for metadata, with
fields being defined by the respective page category.

A page's URL slug is determined by `slug: …` metadata or derived from the
respective file/directory name.

[Canonical URLs](https://en.wikipedia.org/wiki/Canonical_link_element) are
supported via `canonical: https://…`.


Links
-----

Internal links should use `page://<category>/<slug>` as URI instead of
hard-coding the entire URL:

[Authoring Guide](page://articles/authoring)

```
[Authoring Guide](page://articles/authoring)
```

Images using `data:` URIs must be expressed via `inline://` instead (for
technical reasons):

![sample image](inline://image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC)

```
![sample image](inline://image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC)
```


Redirects
---------

Existing pages can be migrated to a new URL via `redirect: page://…` metadata.
When doing so, they should typically tagged with "unlisted" (see below).


Syntax Highlighting
-------------------

Metadata must include `syntax: true` to activate syntax highlighting for fenced
code blocks: This results in corresponding CSS being included along with the
respective markup. Supported languages are registered within
`src/config/converters.js`.

Code portions can be highlighted by wrapping them in guillemets:

```html
<article>
    <h2>«Hello World»</h2>
    <small>detected ««123»» backlinks</small>
</header>
```

```
'''html
<article>
    <h2>«Hello World»</h2>
    <small>detected ««123»» backlinks</small>
</header>
'''
```


Components
----------

Fenced code blocks can also be used as
[parameterized content blocks](https://github.com/FND/lampenfieber) for
arbitrary components, using names exported from `src/config/converters.js`:

```
'''formula caption="mass-energy equivalence" prominent
E = mc^2
'''
```

(Showing `'''` and `^^^` here in place of backticks, for technical reasons.)


### Markdown

This is typically used to inject arbitrary HTML:

```markdown allowHTML
<details>
    <summary>hello world</summary>
    <p>lorem ipsum dolor sit amet</p>
</details>
```

```
'''markdown allowHTML
<details>
    <summary>hello world</summary>
    <p>lorem ipsum dolor sit amet</p>
</details>
'''
```


### Preview Teaser

When the very first content block is marked as `intro`, it is used as preview
teaser within article listings. This block itself may consist of multiple
content blocks which are treated as Markdown by default.

```
'''intro backticks=~~~
Today I learned […].

~~~infobox
Updated to reflect new insights.
~~~
'''
```

Note the use of `backticks` to permit embedding other components.

In rare cases, we might use `teaser` instead to mark an arbitrary content block
to be used as preview:

```
Today I learned […].

'''teaser
Nothing beats simplicity.
'''
```


### Infobox

An infobox constitutes a prominent note, typically used for cautionary remarks
or to explain significant updates. It may consist of multiple content blocks
which are treated as Markdown by default.

```infobox
Don't depend on this behavior.
```

```
'''infobox
Don't depend on this behavior.
'''
```


### Aside

An aside constitutes a brief digression. It may consist of multiple content
blocks which are treated as Markdown by default.

```aside
Someone else had this idea much earlier.
```

```
'''aside
Someone else had this idea much earlier.
'''
```

There's also a less prominent variant:

```aside compact
Sure, that's awkward sometimes, but that's something we're gonna have to live
with.
```

```
'''aside compact
Sure, that's awkward sometimes, but that's something we're gonna have to live
with.
'''
```

Also supports custom `backticks`; cf. [Intro](#intro).


### Footnote

Footnotes consist of two parts: reference (link) and definition. They're
typically used as inline notes, with the definition positioned directly beneath
the corresponding reference's paragraph.

_Lorem ipsum dolor[fun-fact](footnote://) sit amet, consectetur adipisicing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua._

```footnote fun-fact
Did you know this was never intended to be used?
```

_Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
aliquip ex ea commodo consequat._

```
_Lorem ipsum dolor[fun-fact](footnote://) sit amet, consectetur adipisicing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua._

'''footnote fun-fact
Did you know this was never intended to be used?
'''

_Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
aliquip ex ea commodo consequat._
```

Link caption and definition name must be identical.


### Reference

A reference inserts an invisible anchor which we can link to via
[`#ref:$name`](#ref:lipsum):

```ref lipsum
Lorem ipsum dolor sit amet.
```

```
'''ref lipsum
Lorem ipsum dolor sit amet.
'''
```


### Figure

A figure can be used to caption images, quotations or
[similar content elements](https://html5doctor.com/the-figure-figcaption-elements/).

```figure compact
> I don't believe you.

--- Everyone
```

```
'''figure compact
> I don't believe you.

--- Everyone
'''
```

```figure img="data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg'><rect x='0' y='0' width='100%' height='100%' fill='teal' /></svg>" caption
A placeholder image.
```

```
'''figure img="data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg'><rect x='0' y='0' width='100%' height='100%' fill='teal' /></svg>" caption
A placeholder image.
'''
```

```figure filename=util.js
'''javascript
export function log(prefix, ...msg) {
    console.log(`[${prefix}]`, ...msg);
}
'''
```

```
'''figure filename=util.js
^^^javascript
export function log(prefix, ...msg) {
    console.log(`[${prefix}]`, ...msg);
}
^^^
'''
```

Available parameters:

* `compact` can be used to reduce prominence.
* `caption` results in the respective block's content being used as caption.
* `filename` works just like `caption`, but results in custom styling for code
  blocks.
* `img` generates an image element using the parameter value as URI, with the
  respective block's content being used as fallback content.
* `lazy` activates lazy loading for image elements (i.e. only valid in
  combination with `img`).
* `id` allows injecting a custom ID for deep linking.
* `backticks` works as described for [Intro](#intro).


### Embed

Embeds are typically used for demo pages:

```embed uri=articles/encrypted-web-documents/demo.html resize
```

```
'''embed uri=articles/encrypted-web-documents/demo.html resize
'''
```

* URIs starting with `./` are treated as assets from the respective page.
* `resize` activates automatic resizing based on the respective content. In rare
  cases, we might want `resize=once`, which disables auto-resizing after the
  initial adjustment.


### Disclosure

Disclosures hide content which can then be revealed via user interaction.

NB: Often we want these to be wrapped in an [aside](#aside).

```disclosure caption="Here's some additional context."
ES5-style code might looks like this:

'''javascript
var foo = "bar";
'''

YMMV.
```

```
'''disclosure caption="Here's some additional context."
ES5-style code might looks like this:

^^^javascript
var foo = "bar";
^^^
'''

YMMV.
```

Available parameters:

* `caption` (required) provides the summary description.
* `markdown` optionally activates Markdown support for that caption.


### List

Used to generate a list of pages for the respective categories (`,`-delimited).
Pages tagged with "unlisted" are excluded.


### Topics

Used to generate an index of topics for the respective categories
(`,`-delimited). Pages tagged with "unlisted" are excluded.


### Feed

Used to generate an Atom feed for the respective categories (`,`-delimited).
Pages tagged with "unlisted" are excluded.
