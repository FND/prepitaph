title: File-System Access in the Browser
tags: web, javascript
author: FND
created: 2024-02-04
syntax: true

```intro
Every so often I create another
[local web application](https://paul.kinlan.me/the-local-only-web/), for myself
or others -- mostly because not relying on a server seems more sustainable and
[eternally](https://stephango.com/file-over-app)
[trustworthy](page://articles/creative-privacy), especially for personal,
single-purpose projects. Sometimes all you want to rely on is a web browser.
```

In the [early TiddlyWiki](https://classic.tiddlywiki.com/archive/) days, local
persistence was a stroke of genius.[tiddlywiki](footnote://) These days it's an
underappreciated commodity in many scenarios, as browsers now give us controlled
access to the file system.

```footnote tiddlywiki
The entire history of TiddlyWiki's saving mechanisms is fascinating: It all
started with
[hacks](https://github.com/TiddlyWiki/TiddlyWiki/blob/6c9cdb7fe3626f3a15caf5f00c561dfb851a5981/js/FileSystem.js#L241)
which no longer work in modern browsers due to legitimate security concerns.

TiddlyWiki then
[introduced](https://github.com/TiddlyWiki/TiddlyWiki/commit/41831f30412d1d1d2c044c330c832a7eebfb1217#diff-632a7b3237f04683b8bc99235fe5044116bda1ff186068cc4bcbbfbc6ac1e75aR2088)
[`data:` URIs](page://articles/data-uris) in 2006, though it took
[until 2013](https://github.com/TiddlyWiki/TiddlyWiki/commit/9042417c8a9856927df8e2386cb4bc6464819b14)
for them to be used in conjunction with HTML5 download links for the
document itself. `Blob` usage
[followed](https://github.com/Jermolene/TiddlyWiki5/commit/aef8e63cf8c00845155ff94371efbb559efdfac9)
not long after
[for efficiency](https://github.com/Jermolene/TiddlyWiki5/pull/173).
```

While the field is still a little uneven, we can employ progressive enhancement
to choose the right saving strategy: Browsers supporting the
[File System Access API](https://css-tricks.com/getting-started-with-the-file-system-access-api/)
can manipulate files directly while other browsers resort to virtual downloads.

Let's begin with a convenience abstraction for text files:

```javascript
let supported = !!window.showSaveFilePicker;

let TextFile = supported && class TextFile {
    static async select(extension = ".txt") {
        let types = [{
            accept: {
                "text/plain": Array.isArray(extension) ? extension : [extension]
            }
        }];
        try {
            var fh = await window.showSaveFilePicker({ types });
        } catch(err) {
            if(err.name === "AbortError") {
                return null;
            }
            throw err;
        }
        return new this(fh);
    }

    constructor(fh) {
        this._fh = fh;
    }
};
```

Here we use
[`showSaveFilePicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker)
as a [canary](https://decadecity.net/blog/2014/03/06/cutting-the-mustard): If
that's available, we can obtain file handles to read and write content by
prompting the user to choose a file they wanna entrust us with.
`TextFile.select` is a little a wrapper to do just that, limiting selection to
`*.txt` by default.

Next we'll add a couple of instance methods:

```javascript
class TextFile {
    // …

    async write(content) {
        let stream = await this._fh.createWritable();
        try {
            await stream.write(content);
        } finally {
            await stream.close();
        }
    }

    get name() {
        return this._fh.name;
    }
}
```

For our fallback, we can programmatically generate
[download links](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download)
(i.e. `<a href="…" download="…">`) for virtual documents, prompting users to
download the respective file instead:

```javascript
function generateDownloadLink(filename, content, type = "text/plain") {
    // create virtual document
    let blob, uri;
    try {
        blob = new Blob([content], { type });
        uri = URL.createObjectURL(blob);
    } catch(err) { // fallback for ancient browsers
        uri = `data:${type},${encodeURIComponent(content)}`;
    }

    // generate corresponding link
    let el = document.createElement("a");
    el.setAttribute("download", filename);
    el.setAttribute("href", uri);
    return {
        el,
        release: () => blob && URL.revokeObjectURL(blob)
    };
}
```

**NB:** `revokeObjectURL` is required to
[avoid memory leaks](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static#memory_management),
discarding `blob` when it's no longer needed (thanks,
[tillsc](https://nrw.social/@tillsc)). It depends on the respective application
when best to invoke `release`, though a custom element's `disconnectedCallback`
would make that fairly straightforward.

Now that we have those two saving mechanisms, we can put them to use:

```javascript
let file = TextFile && await TextFile.select();

let download = generateDownloadLink("sample.txt", "hello world\n");
let link = download.el;
if(file) {
    link.textContent = "download backup";
    await file.write("hello world\n");
} else {
    link.textContent = "download";
}
document.body.appendChild(link);
// …
download.release();
```

Of course user experience can be a little cumbersome for this: A download prompt
for each individual change might end up frustrating users. Even with direct
file-system access, users still need to re-select their file each time they
revisit the page. As such, this approach might not be suitable for every
scenario and GUI affordances should be carefully considered.

A simplistic demo is included below while a
[more elaborate sample](https://github.com/FND/automemo) is available on a less
sustainable website, where there's also a
[real-world example](https://github.com/ddd-crew/bounded-context-canvas/pull/36).

```embed uri=./demo.html resize
```
