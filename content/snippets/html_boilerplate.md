title: HTML Boilerplate
tags: web, html, css
author: FND
created: 2023-12-17
syntax: true

```intro
I probably create dozens of HTML documents each month, usually for experiments
or [minimal test cases](https://css-tricks.com/reduced-test-cases/).
Consequently, I've long maintained a carefully crafted HTML template, included
below, which I typically reduce to only retain pieces that are strictly
necessary (e.g. removing the external style sheet or `.stack` utility).
```

Occasionally I refer to
[A Minimal HTML5 Document](https://brucelawson.co.uk/2010/a-minimal-html5-document/)
for the bare essentials (e.g. when constructing
[data URIs](page://articles/data-uris)).

My shell history always includes the following command for easy access:

```
$ cp /path/to/snippets/boilerplate.html /tmp/dev/testcase.html #testcase
```

`envsubst` might be used for basic templating:

```figure filename=template.html
'''html
…
<title>${TITLE}</title>
…
<h1>${TITLE}</h1>
<main>${CONTENT}</main>
…
'''
```

```
$ TITLE="hello world" CONTENT="lorem ipsum" envsubst < template.html
…
<title>hello world</title>
…
<h1>hello world</h1>
<main>lorem ipsum</main>
…
```

----

```figure filename=boilerplate.html
'''html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Test Case</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./styles/main.css">
    <style>
*,
*::before,
*::after {
    box-sizing: border-box;
}

:root {
    --h-size: 60ch;

    /* modular scale-ish; cf. https://www.modularscale.com/?1.5 */
    --spacing: 0.5rem;
    --spacing-sm1: calc(var(--spacing) * 0.667);
    --spacing-sm2: calc(var(--spacing) * 0.444);
    --spacing-sm3: calc(var(--spacing) * 0.296);
    --spacing-lg1: calc(var(--spacing) * 1.5);
    --spacing-lg2: calc(var(--spacing) * 2.25);
    --spacing-lg3: calc(var(--spacing) * 3.375);
}

body {
    max-width: calc(var(--h-size) + 2 * var(--spacing));
    margin: 1rem auto;
    padding-inline: var(--spacing);
    font-family: system-ui, sans-serif;
    line-height: 1.5;
}

select,
textarea,
input,
button {
    font: inherit;
}

.stack > * {
    margin-block: 0;

    & + * {
        margin-block-start: var(--spacing);
    }
}
    </style>
</head>

<body class="stack">
    <h1>Test Case</h1>
    <p>lorem ipsum dolor sit amet</p>

    <script type="module">
// …
    </script>
</body>

</html>
'''
```
