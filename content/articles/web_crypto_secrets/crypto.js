let CRYTPO = window.crypto.subtle;
let ALGO = "AES-GCM";
let SALT = str2bytes("94211a24-0e7e-4a6a-ae17-6bdb5d25ce4b").buffer;

export async function encrypt(txt, password) {
	let iv = window.crypto.getRandomValues(new Uint8Array(16));
	let encrypted = await CRYTPO.encrypt({ name: ALGO, iv },
			await deriveKey(password), str2bytes(txt));
	return [iv, new Uint8Array(encrypted)].
		map(block => btoa(block.join(","))).
		join("|");
}

export async function decrypt(txt, password) {
	let [iv, encrypted] = txt.split("|").
		map(block => Uint8Array.from(atob(block).split(","), str2int));
	let decrypted = await CRYTPO.decrypt({ name: ALGO, iv },
			await deriveKey(password), encrypted);
	return new window.TextDecoder().decode(new Uint8Array(decrypted));
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

function str2bytes(txt) {
	return new TextEncoder().encode(txt);
}

function str2int(txt) {
	return parseInt(txt, 10);
}
