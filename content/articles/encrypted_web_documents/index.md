title: Encrypted Web Documents
tags: web, javascript
author: FND
created: 2023-08-31
syntax: true

```intro
There are many options these days for securely sharing sensitive data, but they
all require some kind of shared infrastructure. Sometimes all you can rely on is
the web.
```

Say you've acquired an almanac from the future and want to share it with a
select group of people. You could use a secure messenger or S/MIME e-mail,
perhaps employ a cloud service or write your own CGI script, or just create an
encrypted file archive
([careful though](https://en.wikipedia.org/wiki/ZIP_(file_format)#Encryption)).

However, all of that requires some kinda setup and agreement among trustees. Web
browsers, on the other hand, can typically be considered ubiquitous -- so let's
apply what we've learned about [web crypto](page://articles/web-crypto-secrets)
and [DOM manipulation](page://articles/html2dom) to create a self-contained
alternative:

```markdown allowHTML
<iframe src="./demo.html"></iframe>
```

This example is just a single HTML file, containing two distinct documents: The
"Document Vault" decryption interface -- a small client-side form accompanied by
CSS and JavaScript -- as well as our secret almanac. The latter is encrypted and
resides within a `<template>`, thus starting out inert; the decryption
interface's job is to decrypt and display that embedded document.

```infobox
All the security caveats from
[Client-Side Secrets with Web Crypto](page://articles/web-crypto-secrets) apply
here just the same. There's no protection against brute-force attacks either.
```

```html
<form method="dialog">
    <label>
        <b>Password</b>
        <input type="password" name="password" required autofocus>
    </label>
    <button>Decrypt</button>
    <output></output>
</form>

<template>MjMzLDE…ywxNDU=</template>
```

Let's hook into the `submit` event to trigger decryption:

```javascript
let SRC = document.querySelector("template").content.textContent.trim();

document.querySelector("form").addEventListener("submit", async ev => {
    let form = ev.target;
    let msg = form.querySelector("output");
    msg.innerHTML = ""; // reset previous error, if any

    let password = new FormData(form).get("password");
    try {
        var html = await decrypt(SRC, password);
    } catch(err) {
        msg.innerHTML = `
<p class="error">Decryption failed; password might be incorrect?</p>
        `.trim();
        return;
    }

    // replace current document; cf. <https://prepitaph.org/articles/html2dom/>
    let doc = new DOMParser().parseFromString(html, "text/html");
    document.documentElement.innerHTML = doc.documentElement.innerHTML;
    for(let el of document.querySelectorAll("script")) { // evaluate
        let frag = document.createRange().
            createContextualFragment(el.outerHTML);
        el.replaceWith(fragment);
    }
});
```

I've omitted the `decrypt` implementation here; it's essentially identical to
the web-crypto demo's. View source for details.

One might also consider using `<iframe>` or `<dialog>` instead of replacing the
host document, but this proved to be the most straightforward approach.

Of course you'd still need a way to transmit both the HTML file and the
corresponding password to your trustees, ideally via separate and secure
channels. But apart from that, here we have a web-native document that only
requires recipients to have a reasonably modern, JavaScript-enabled browser.
