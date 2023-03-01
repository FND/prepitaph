import { ingestContent } from "./ingestion.js";
import { TextTransformer } from "./transform.js";
import { AssetRegistry } from "./assets.js";
import { ContentStore } from "./store.js";
import { createFile, realpath } from "./fs.js";
import { normalizeURI, clone, CustomError } from "./util.js";
import * as globalConfig from "../config.js";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";

try {
	await main();
} catch(err) {
	if(err instanceof CustomError) {
		abort(`[${err.code}] ${err.message}`);
	}
	throw err;
}

async function main() {
	let host = normalizeURI(globalConfig.host);
	let pathPrefix = normalizeURI(globalConfig.pathPrefix);
	let config = clone(globalConfig, {
		baseURL: new URL(pathPrefix + "/", host).href,
		host,
		pathPrefix
	});

	let contentDir = await realpath(config.contentDir);
	let outputDir = resolve(config.outputDir);
	let assetsDir = resolve(outputDir, config.assetsDir);

	console.error(`starting content discovery in \`${contentDir}\``);
	let store = new ContentStore();
	for await (let page of ingestContent(contentDir, config.categories)) {
		console.error(`... \`${page.localPath}\``);
		console.error(`    → ${page.url(config.baseURL).href}`);
		store.add(page);
	}

	// NB: separate rendering loop allows for validating interlinked content
	console.error(`rendering pages into \`${outputDir}\``);
	let transformer = new TextTransformer(config.blocks);
	let assets = new AssetRegistry();
	let context = { store, assets, transformer, config };
	let cache = new Set();
	let output = [];
	for(let page of store) {
		let filepath = resolve(outputDir, page.localPath);
		// NB: avoiding `await` because we want non-blocking iteration here
		let op = page.render(context).
			then(html => createFile(filepath, html, cache));
		output.push(op);
	}
	await Promise.all(output);

	// copy any assets discovered during rendering
	await mkdir(assetsDir, { recursive: true });
	await Promise.all([...assets].map(filepath => {
		let target = resolve(assetsDir, basename(filepath));
		console.error(`copying asset \`${filepath}\` to \`${target}\``);
		return copyFile(filepath, target);
	}));
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
