title: Client-Side Secrets with Web Crypto
tags: web, javascript
author: FND
created: 2023-07-23
syntax: true
_origin_: https://burningchrome.com/~fnd/_/7aa2ddee-1c65-41c9-a932-9e1db93c6856.html

```intro
Reading about
[Excalidraw's end-to-end encryption](https://blog.excalidraw.com/end-to-end-encryption/)
a while back piqued my interest: Given my
[TiddlyWiki background](page://articles/creative-privacy), the idea of using a
server to exchange sensitive data without exposing details to anyone else seemed
compelling.
```

In fact, at the time I was working on an
[experiment](https://github.com/Jermolene/TiddlyWiki5/discussions/5568#discussioncomment-568504)
facing that very issue: Providing a way for users to exchange notes which only
they could access. Unlike Excalidraw, I needed secrets that humans can easily
exchange and remember (a conscious security trade-off), so I opted for
user-generated passphrases instead of auto-generated keys.

Nowadays we can rely on
[Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
being well supported, so let's work with that. (Previously one might have used
something like [SJCL](https://bitwiseshiftleft.github.io/) to similar effect.)

```infobox
Please note that I'm far from being a cryptography expert. Though I had this
reviewed by more knowledgeable folks, I'm not entirely confident I got
everything right. Plus the inherent security trade-offs here are not suitable in
every scenario.
```

We start out writing a function to encrypt text content using a password:

```javascript
let CRYTPO = window.crypto.subtle;
let ALGO = "AES-GCM";
let SALT = str2bytes("94211a24-0e7e-4a6a-ae17-6bdb5d25ce4b").buffer;

export async function encrypt(txt, password) {
    let key = await deriveKey(password);
    let iv = window.crypto.getRandomValues(new Uint8Array(16));
    let encrypted = await CRYTPO.encrypt({ name: ALGO, iv }, key,
            str2bytes(txt));
    return [iv, new Uint8Array(encrypted)].
        map(block => btoa(block.join(","))).
        join("|");
}

async function deriveKey(password) {
    let secret = await CRYTPO.importKey("raw", str2bytes(password),
            "PBKDF2", false, ["deriveBits", "deriveKey"]);
    return await CRYTPO.deriveKey({
        name: "PBKDF2",
        salt: SALT,
        iterations: 100000,
        hash: "SHA-256"
    }, secret, { name: ALGO, length: 256 }, true, ["encrypt", "decrypt"]);
}

function str2bytes(txt) {
    return new TextEncoder().encode(txt);
}
```

The encryption key is derived from the respective password, which constitutes
our shared secret. Note that we've settled on a
[particular algorithm](https://en.wikipedia.org/wiki/AES-GCM) and a hard-coded
(and thus public) [salt](https://en.wikipedia.org/wiki/Salt_%28cryptography%29)
value -- see conscious security trade-offs; you _really_ shouldn't use this
without understanding the consequences.

Encrypted content is paired with its
[unique IV](https://crypto.stackexchange.com/questions/26790/how-bad-it-is-using-the-same-iv-twice-with-aes-gcm)
so we can transmit it as a self-contained string. Decrypting that only requires
the password, so let's add the corresponding function:

```javascript
export async function decrypt(txt, password) {
    let key = await deriveKey(password);
    let [iv, encrypted] = txt.split("|").
        map(block => Uint8Array.from(atob(block).split(","), str2int));
    let decrypted = await CRYTPO.decrypt({ name: ALGO, iv }, key, encrypted);
    return new window.TextDecoder().decode(new Uint8Array(decrypted));
}

function str2int(txt) {
    return parseInt(txt, 10);
}
```

These little wrappers around native functionality are all we need to create a
simplistic demo:

```embed uri=./demo.html resize
```

That same code might also be used in a [simple command-line script](./cli.js).
