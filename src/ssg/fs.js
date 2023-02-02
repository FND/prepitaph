import { readdir, realpath as _realpath } from "node:fs/promises";
import { resolve } from "node:path";

export async function* getFiles(rootDir) {
	let entries = await readdir(rootDir, { withFileTypes: true });
	for(let entry of entries) {
		let filepath = resolve(rootDir, entry.name);
		if(entry.isDirectory()) {
			yield* getFiles(filepath);
		} else {
			yield filepath;
		}
	}
}

export async function realpath(filepath) {
	try {
		return await _realpath(filepath);
	} catch(err) {
		if(err.code === "ENOENT") {
			throw new Error(`no such file or directory: \`${filepath}\``);
		}
		throw err;
	}
}
