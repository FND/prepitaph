import { readDir } from "./fs.js";
import { CustomError } from "./util.js";
import txtParse from "lampenfieber";
import colonParse from "metacolon";
import { parse } from "node:path";

export async function* ingestContent(rootDir, categories) {
	for await (let {
		name, filepath, assets, metadata, blocks
	} of parseContent(rootDir)) {
		let { category } = metadata;
		let loadClass = categories[category === null ? "NONE" : category];
		if(!loadClass) {
			throw new CustomError("INVALID_CONTENT",
					`unrecognized category \`${category}\` in \`${filepath}\``);
		}

		// NB: avoiding `await` because we want non-blocking iteration here
		let resource = loadClass(). // eslint-disable-next-line new-cap
			then(cls => new cls(name, metadata, blocks, filepath, assets));
		yield resource;
		// guard against unhandled rejections
		// cf. https://jakearchibald.com/2023/unhandled-rejections/
		resource.catch(() => {});
	}
}

export function txt2blocks(content) {
	// XXX: could be more efficient if Lampenfieber used `yield` instead
	return txtParse(content).map(normalizeBlock);
}

async function* parseContent(rootDir) {
	for await (let { name, filepath, assets, category } of discoverContent(rootDir)) {
		// NB: avoiding `await` because we want non-blocking iteration here
		yield colonParse(filepath).
			then(({ headers, body }) => ({
				name,
				filepath,
				assets,
				metadata: { // XXX: `Map`ify? should be fixed within metacolon
					...disallow("category", headers, filepath),
					category
				},
				blocks: txt2blocks(body)
			}));
	}
}

async function* discoverContent(rootDir) {
	for await (let { filename, filepath, isDirectory } of readDir(rootDir)) {
		if(isDirectory) { // category directory
			yield* ingestCategory(filename, filepath);
		} else { // root-level content file
			let { name } = parse(filename);
			yield { name, filepath, category: null };
		}
	}
}

async function* ingestCategory(category, dirPath) {
	for await (let { filename, filepath, isDirectory } of readDir(dirPath)) {
		if(isDirectory) { // content directory
			// NB: avoiding `await` because we want non-blocking iteration here
			yield ingestContentDirectory(filepath).
				then(({ index, assets }) => ({
					name: filename,
					filepath: index,
					assets,
					category
				}));
		} else { // content file
			let { name } = parse(filename);
			yield { name, filepath, category };
		}
	}
}

async function ingestContentDirectory(dirPath) {
	let index;
	let assets = [];
	for await (let { filename, filepath, isDirectory } of readDir(dirPath)) {
		if(isDirectory) {
			let reason = "must not include subdirectories";
			throw new CustomError("INVALID_CONTENT",
					`invalid content directory \`${filepath}\`: ${reason}`);
		} else if(filename.startsWith("index.")) { // XXX: crude
			if(index) {
				let reason = "must not include more than one `index.*` file";
				throw new CustomError("INVALID_CONTENT",
						`invalid content directory \`${filepath}\`: ${reason}`);
			}
			index = filepath;
		} else {
			assets.push(filepath);
		}
	}
	return { index, assets };
}

function disallow(field, headers, filepath) {
	if(Object.hasOwn(headers, field)) {
		throw new CustomError("INVALID_CONTENT",
				`invalid \`category\` metadata in \`${filepath}\``);
	}
	return headers;
}

function normalizeBlock(segment) {
	return typeof segment === "string" ? {
		type: "default",
		params: {},
		content: segment
	} : {
		type: segment.type ?? "NONE", // XXX: rename
		params: segment.params,
		content: segment.content
	};
}
