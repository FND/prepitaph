import { getFiles, File } from "./fs.js";
import { CustomError } from "./util.js";
import txtParse from "lampenfieber";
import colonParse from "metacolon";
import { dirname, parse, sep } from "node:path";

let { hasOwnProperty } = Object.prototype;

export async function* ingestContent(rootDir, categories) {
	for await (let { file, metadata, blocks } of discoverContent(rootDir)) {
		let { category } = metadata;
		let loadClass = categories[category === null ? "NONE" : category];
		if(!loadClass) {
			throw new CustomError("INVALID_CONTENT",
					`unrecognized category \`${category}\` in \`${file.path}\``);
		}

		let { name } = parse(file.localPath);
		// NB: avoiding `await` because we want non-blocking iteration here
		let resource = loadClass(). // eslint-disable-next-line new-cap
			then(cls => new cls(file.path, name, metadata, blocks));
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

async function* discoverContent(rootDir) {
	for await (let filepath of getFiles(rootDir)) {
		let file = new File(filepath, rootDir);

		let category = dirname(file.localPath);
		if(category === ".") {
			category = null; // XXX: special-casing
		} else if(category.includes(sep)) {
			let reason = "multiple subdirectories are not supported";
			throw new CustomError("INVALID_CONTENT",
					`invalid content file \`${file.path}\`; ${reason}`);
		}

		// NB: avoiding `await` because we want non-blocking iteration here
		yield colonParse(filepath).
			then(({ headers, body }) => ({
				file,
				metadata: { // XXX: `Map`ify? should be fixed within metacolon
					...disallow("category", headers, file),
					category
				},
				blocks: txt2blocks(body)
			}));
	}
}

function disallow(field, headers, file) {
	if(hasOwnProperty.call(headers, field)) {
		throw new CustomError("INVALID_CONTENT",
				`invalid \`category\` metadata in \`${file.path}\``);
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
