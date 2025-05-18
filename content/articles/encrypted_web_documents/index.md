title: Encrypted Web Documents
tags: web, javascript
author: FND
created: 2023-08-31
syntax: true

```intro
There are many options these days for securely sharing sensitive data, but they
typically require some kind of shared infrastructure. Sometimes all you can rely
on is the web.
```

Say you've acquired an almanac from the future and want to share it with a
select group of people. You could use a secure messenger or S/MIME e-mail,
perhaps employ a cloud service or write your own CGI script, or just create an
encrypted file archive
([careful though](https://en.wikipedia.org/wiki/ZIP_(file_format)#Encryption)).

However, all of that requires some kinda setup and agreement among trustees. Web
browsers, on the other hand, can often be considered ubiquitous -- so let's
apply what we've learned about [web crypto](page://articles/web-crypto-secrets)
and [DOM manipulation](page://articles/html2dom) to create a self-contained
alternative:

```embed uri=./demo.html
```

This example is just a single HTML file, containing two distinct documents: The
"Document Vault" decryption interface -- a small client-side form accompanied by
CSS and JavaScript -- as well as our secret almanac. The latter is encrypted and
resides within a `<template>`, thus starting out inert; the decryption
interface's job is to decrypt and display that embedded document.

```disclosure caption="(I use a command-line script for generating such vaults.)"
'''figure backticks=^^^ filename=vault
^^^javascript
#!/usr/bin/env node

// usage:
// $ ./vault "my-password" < my_document.html

let CRYPTO = crypto.subtle;
let ALGO = "AES-GCM";
let SALT = crypto.randomUUID();

main();

async function main() {
    let [password] = process.argv.slice(2);
    if(!password) {
        abort("missing password argument");
    }
    let input = await consumeInput();
    console.log(render(await encrypt(input, password)));
}

function consumeInput() {
    let resolve;
    let res = new Promise(_resolve => {
        resolve = _resolve;
    });

    let { stdin } = process;
    let chunks = [];
    let decoder = new TextDecoder();
    stdin.on("readable", () => {
        while(true) {
            let data = stdin.read();
            if(data) {
                chunks.push(decoder.decode(data));
            } else {
                break;
            }
        }
    });
    stdin.on("end", () => {
        resolve(chunks.join(""));
    });
    return res;
}

async function encrypt(txt, password) {
    let iv = crypto.getRandomValues(new Uint8Array(16));
    let encrypted = await CRYPTO.encrypt({ name: ALGO, iv },
            await deriveKey(password), str2bytes(txt));
    return [iv, new Uint8Array(encrypted)].
        map(block => btoa(block.join(","))).
        join("|");
}

async function deriveKey(password) {
    let secret = await CRYPTO.importKey("raw", str2bytes(password), "PBKDF2",
            false, ["deriveBits", "deriveKey"]);
    return await CRYPTO.deriveKey({
        name: "PBKDF2",
        salt: str2bytes(SALT).buffer,
        iterations: 2 ** 20,
        hash: "SHA-256"
    }, secret, { name: ALGO, length: 256 }, true, ["encrypt", "decrypt"]);
}

function abort(...msg) {
    console.error(...msg);
    process.exit(1);
}

function str2bytes(txt) {
    return new TextEncoder().encode(txt);
}

function render(embed) {
    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Document Vault</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
*,
*::before,
*::after {
    box-sizing: border-box;
}

:root {
    --h-size: 45ch;
    --spacing: 0.5rem;
    /* modular scale-ish; cf. <https://www.modularscale.com/?1.5> */
    --spacing-sm1: calc(0.667 * var(--spacing));
    --spacing-lg2: calc(2.25 * var(--spacing));
}

html,
body {
    height: 100%;
    margin: 0;
}

body {
    display: flex;
    max-width: calc(var(--h-size) + 2 * var(--spacing));
    margin: 0 auto;
    padding-inline: var(--spacing);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: system-ui, sans-serif;
    line-height: 1.5;
}

h1:not(.extra-specificity) {
    --_size: 2rem;

    font-size: var(--_size);
    margin-top: calc(-2 * var(--_size)); /* XXX: hacky */
}

footer:not(.extra-specificity) {
    margin-top: var(--spacing-lg2);
    font-size: small;
}

p {
    text-align: center;
}

label,
label b {
    display: block;
}

label b {
    font-size: small;
}

form,
input {
    width: 100%;
}

input {
    padding: var(--spacing);
}

button {
    width: 100%;
    padding: var(--spacing-sm1);
    font-size: 1.125rem;
}

.stack > * {
    margin-block: 0;
}
.stack > * + * {
    margin-top: var(--spacing);
}

.error {
    border: 1px solid #F1AEB5;
    border-radius: var(--spacing);
    padding: var(--spacing);
    color: #58151C;
    background-color: #F8D7DA;
}
    </style>
</head>

<body class="stack">
    <h1>Document Vault</h1>
    <p>Please enter your password to access the document within.</p>

    <form method="dialog" class="stack">
        <label>
            <b>Password</b>
            <input type="password" name="password" required autofocus>
        </label>
        <button>Decrypt</button>
        <output></output>
    </form>

    <noscript>
        <p class="error">
            It appears client-side scripting is unavailable, thus private
            decryption is not possible.
        </p>
    </noscript>

    <footer>
        See
        <a href="https://prepitaph.org/articles/encrypted-web-documents/">Encrypted Web Documents</a>
        for details and rationale.
    </footer>

    <template>${embed}</template>

    <script type="module">
let FORM = document.querySelector("form");
let MSG = FORM.querySelector("output");
let SRC = document.querySelector("template").content.textContent.trim();
let SALT = "${SALT}";

FORM.addEventListener("submit", async ev => {
    let form = ev.target;
    MSG.innerHTML = ""; // reset previous error, if any

    let password = new FormData(form).get("password");
    try {
        var html = await decrypt(SRC, password);
    } catch(err) {
        MSG.innerHTML = \`
<p class="error">Decryption failed; password might be incorrect?</p>
        \`.trim();
        return;
    }

    // replace current document; cf. <https://prepitaph.org/articles/html2dom/>
    let doc = new DOMParser().parseFromString(html, "text/html");
    document.documentElement.innerHTML = doc.documentElement.innerHTML;
    for(let el of document.querySelectorAll("script")) {
        let fragment = document.createRange().createContextualFragment(el.outerHTML);
        el.replaceWith(fragment);
    }
});

/* crypto; cf. <https://prepitaph.org/articles/web-crypto-secrets/> */

let CRYPTO = globalThis.crypto.subtle;
let ALGO = "AES-GCM";
SALT = str2bytes(SALT).buffer;

async function decrypt(txt, password) {
    let [iv, encrypted] = txt.split("|").
        map(block => Uint8Array.from(atob(block).split(","), str2int));
    let decrypted = await CRYPTO.decrypt({ name: ALGO, iv },
            await deriveKey(password), encrypted);
    return new TextDecoder().decode(new Uint8Array(decrypted));
}

async function deriveKey(password) {
    let secret = await CRYPTO.importKey("raw", str2bytes(password), "PBKDF2",
            false, ["deriveBits", "deriveKey"]);
    return await CRYPTO.deriveKey({
        name: "PBKDF2",
        salt: SALT,
        iterations: 2 ** 20,
        hash: "SHA-256"
    }, secret, { name: ALGO, length: 256 }, true, ["encrypt", "decrypt"]);
}

function str2bytes(txt) {
    return new TextEncoder().encode(txt);
}

function str2int(txt) {
    return parseInt(txt, 10);
}
    </script>
</body>

</html>
    `.trim();
}
^^^
'''
```

```infobox
All the security caveats from
[Client-Side Secrets with Web Crypto](page://articles/web-crypto-secrets) apply
here just the same. There's no protection against brute-force attacks either.
```

```html
<form method="dialog">
    <label>
        <b>Password</b>
        <input type="password" name="password" required>
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

```aside compact
Note that even though we're replacing the entire DOM, it's still the same page
as far as the browser is concerned. As such, there's no way to unload the host
document's JavaScript -- all the more reason to keep that decryption interface
small and simple. (CSS, however, is effectively unloaded automatically when the
corresponding `<link>` or `<style>` element is removed.)
```

Of course you'd still need a way to transmit both the HTML file and the
corresponding password to your trustees, ideally via separate and secure
channels. But apart from that, here we have a web-native document that only
requires recipients to have a reasonably modern, JavaScript-enabled browser.
