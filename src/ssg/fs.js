import { CustomError } from "./util.js";
import { writeFile, mkdir, readdir, realpath as _realpath } from "node:fs/promises";
import { resolve, dirname } from "node:path";

export async function createFile(filepath, content, dirCache = new Set()) {
	let dir = await dirname(filepath);
	if(!dirCache.has(dir)) {
		await mkdir(dir, { recursive: true });
		dirCache.add(dir);
	}
	try {
		await writeFile(filepath, content, { flag: "wx" });
	} catch(err) {
		if(err.code === "EEXIST") {
			throw new CustomError("CONFLICT",
					`cannot create file; already exists: \`${err.path}\``);
		}
		throw err;
	}
	return dirCache;
}

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
			throw new CustomError("CONFLICT",
					`no such file or directory: \`${filepath}\``);
		}
		throw err;
	}
}
