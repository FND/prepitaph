import { TextTransformer } from "./transform.js";
import { file2doc } from "./parser.js";
import { createFile, getFiles, realpath, File } from "./fs.js";
import { CustomError } from "./util.js";
import * as config from "../config.js";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve, dirname, basename, parse, sep } from "node:path";

try {
	await main();
} catch(err) {
	if(err instanceof CustomError) {
		abort(`[${err.code}] ${err.message}`);
	}
	throw err;
}

async function main() {
	let contentDir = await realpath(config.contentDir);
	let outputDir = resolve(config.outputDir);
	let assetsDir = resolve(outputDir, config.assetsDir);

	console.error(`starting content discovery in \`${contentDir}\``);
	let pages = []; // TODO: proper index
	for await (let doc of discoverContent(contentDir)) {
		let { category } = doc.metadata;
		console.error(`[${category}]`, doc.file.localPath);

		let getClass = config.categories[category];
		if(!getClass) {
			throw new CustomError("INVALID_CONTENT",
					`unrecognized category in \`${doc.file.path}\`: \`${category}\``);
		}

		let resource = getClass().
			then(cls => cls.from(doc));
		pages.push(resource);
		// guard against unhandled rejections
		// cf. https://jakearchibald.com/2023/unhandled-rejections/
		resource.catch(() => {});
	}

	// NB: separate rendering loop allows for validating interlinked content
	let transformer = new TextTransformer(config.blocks);
	let assets = new Set();
	let cache;
	for await (let page of pages) {
		let html = await page.render({ pages, assets, transformer });
		let { dir, name } = parse(page.file.localPath);
		let filepath = resolve(outputDir, dir, page.metadata.slug || name, "index.html");
		cache = await createFile(filepath, html, cache);
	}

	// copy any assets discovered during rendering
	await mkdir(assetsDir, { recursive: true });
	await Promise.all([...assets].map(filepath => {
		let target = resolve(assetsDir, basename(filepath));
		console.error(`copying asset \`${filepath}\` to \`${target}\``);
		return copyFile(filepath, target);
	}));
}

async function* discoverContent(rootDir) {
	for await (let filepath of getFiles(rootDir)) {
		let file = new File(filepath, rootDir);
		let category = dirname(file.localPath);
		if(category.includes(sep)) {
			let reason = "multiple subdirectories are not supported";
			throw new CustomError("INVALID_CONTENT",
					`invalid content file \`${file.localPath}\`; ${reason}`);
		}
		yield file2doc(file, { category });
	}
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
