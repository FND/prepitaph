import { CustomError } from "./util.js";
import { mkdir, readdir, realpath as _realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function createFile(filepath, content, dirCache = new Set()) {
	let dir = await dirname(filepath);
	if (!dirCache.has(dir)) {
		await mkdir(dir, { recursive: true });
		dirCache.add(dir);
	}
	try {
		await writeFile(filepath, content, { flag: "wx" });
	} catch (err) {
		if (err.code === "EEXIST") { // deno-fmt-ignore
			throw new CustomError("CONFLICT",
					`cannot create file; already exists: \`${err.path}\``);
		}
		throw err;
	}
	return dirCache;
}

export async function* readDir(dirPath) {
	let entries = await readdir(dirPath, { withFileTypes: true });
	for await (let entry of entries) {
		let { name } = entry;
		yield {
			filename: name,
			filepath: resolve(dirPath, name),
			isDirectory: entry.isDirectory(),
		};
	}
}

export async function realpath(filepath) {
	try {
		return await _realpath(filepath);
	} catch (err) {
		if (err.code === "ENOENT") { // deno-fmt-ignore
			throw new CustomError("CONFLICT",
					`no such file or directory: \`${filepath}\``);
		}
		throw err;
	}
}
