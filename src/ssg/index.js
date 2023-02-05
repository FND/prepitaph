import { TextPage } from "./page.js";
import { TextTransformer } from "./transform.js";
import { createFile, getFiles, realpath } from "./fs.js";
import config from "../config.js";
import { relative, resolve, dirname, parse, sep } from "node:path";

try {
	await main();
} catch(err) {
	abort(err.message); // XXX: complicates debugging
}

async function main() {
	let contentDir = await realpath(config.contentDir);
	let outputDir = resolve(config.outputDir);
	let transformer = new TextTransformer(config.blocks);

	console.error(`starting content discovery in \`${contentDir}\``);
	let pages = []; // TODO: proper index
	for await (let page of discoverContent(contentDir)) {
		let { metadata } = page;
		let { category } = metadata;
		console.error(`[${category}]`, metadata.localPath);

		let getClass = config.categories[category];
		if(!getClass) {
			let msg = "unrecognized category";
			throw new Error(`${msg} in \`${page.filepath}\`: \`${category}\``);
		}
		pages.push(getClass().
			then(cls => cls.from(page, transformer)));
	}

	// NB: separate rendering loop allows for validating interlinked content
	let cache;
	for(let page of pages) {
		page = await page;
		let html = await page.render({ pages });

		let { dir, name } = parse(page.metadata.localPath);
		let filepath = resolve(outputDir, dir, `${name}.html`);
		cache = await createFile(filepath, html, cache);
	}
}

async function* discoverContent(rootDir) {
	for await (let filepath of getFiles(rootDir)) {
		let localPath = relative(rootDir, filepath);
		let category = dirname(localPath);
		if(category.includes(sep)) {
			let reason = "multiple subdirectories are not supported";
			throw new Error(`invalid content file \`${localPath}\`; ${reason}`);
		}
		yield TextPage.from(filepath, { category, localPath });
	}
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
