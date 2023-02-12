import { TextPage } from "./page.js";
import { TextTransformer } from "./transform.js";
import { createFile, getFiles, realpath } from "./fs.js";
import { CustomError } from "./util.js";
import * as config from "../config.js";
import { copyFile, mkdir } from "node:fs/promises";
import { relative, resolve, dirname, basename, parse, sep } from "node:path";

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
	let transformer = new TextTransformer(config.blocks);

	console.error(`starting content discovery in \`${contentDir}\``);
	let pages = []; // TODO: proper index
	for await (let page of discoverContent(contentDir)) {
		let { metadata } = page;
		let { category } = metadata;
		console.error(`[${category}]`, metadata.localPath);

		let getClass = config.categories[category];
		if(!getClass) {
			throw new CustomError("INVALID_CONTENT",
					`unrecognized category in \`${page.filepath}\`: \`${category}\``);
		}
		pages.push(getClass().
			then(cls => cls.from(page, transformer)));
	}

	// NB: separate rendering loop allows for validating interlinked content
	let assets = new Set();
	let cache;
	for(let page of pages) {
		page = await page;
		let html = await page.render({ pages, assets });
		let { slug, localPath } = page.metadata;

		let { dir, name } = parse(localPath);
		let filepath = resolve(outputDir, dir, slug || name, "index.html");
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
		let localPath = relative(rootDir, filepath);
		let category = dirname(localPath);
		if(category.includes(sep)) {
			let reason = "multiple subdirectories are not supported";
			throw new CustomError("INVALID_CONTENT",
					`invalid content file \`${localPath}\`; ${reason}`);
		}
		yield TextPage.from(filepath, { category, localPath });
	}
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
