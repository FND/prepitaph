#!/usr/bin/env node
let CRYTPO = crypto.subtle;
let ALGO = "AES-GCM";
let SALT;

main();

async function main() {
	let [cmd, password, salt] = process.argv.slice(2);
	SALT = str2bytes(salt).buffer;
	if(!password) {
		abort("missing password argument");
	}
	if(!salt) {
		abort("missing salt argument");
	}
	let input = await consumeInput();

	let fn = { encrypt, decrypt }[cmd];
	if(!fn) {
		abort(`invalid command: \`${cmd}\` - expected "encrypt" or "decrypt"`);
	}
	console.log(await fn(input, password));
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
	let encrypted = await CRYTPO.encrypt({ name: ALGO, iv },
			await deriveKey(password), str2bytes(txt));
	return [iv, new Uint8Array(encrypted)].
		map(block => btoa(block.join(","))).
		join("|");
}

async function decrypt(txt, password) {
	let [iv, encrypted] = txt.split("|").
		map(block => Uint8Array.from(atob(block).split(","), str2int));
	let decrypted = await CRYTPO.decrypt({ name: ALGO, iv },
			await deriveKey(password), encrypted);
	return new TextDecoder().decode(new Uint8Array(decrypted));
}

async function deriveKey(password) {
	let secret = await CRYTPO.importKey("raw", str2bytes(password), "PBKDF2",
			false, ["deriveBits", "deriveKey"]);
	return await CRYTPO.deriveKey({
		name: "PBKDF2",
		salt: SALT,
		iterations: 100000,
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

function str2int(txt) {
	return parseInt(txt, 10);
}
