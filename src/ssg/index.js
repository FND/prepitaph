import { ingestContent } from "./ingestion.js";
import { TextTransformer } from "./transform.js";
import { AssetRegistry } from "./assets.js";
import { ContentStore } from "./store.js";
import { createFile, realpath } from "./fs.js";
import { normalizeURI, clone, CustomError } from "./util.js";
import * as globalConfig from "../config.js";
import { copyFile, mkdir, constants } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";

let CREATE_ONLY = constants.COPYFILE_EXCL;

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
		store.add(page);
	}

	// NB: separate rendering loop allows for validating interlinked content
	console.error(`rendering pages into \`${outputDir}\``);
	let transformer = new TextTransformer(config.blocks);
	let assets = new AssetRegistry();
	let context = { store, assets, transformer, config };
	let { baseURL } = config;
	let cache = new Set();
	let output = [];
	for(let page of store) {
		console.error(`... ${page.url(baseURL).href}`);
		let { assets, localPath } = page;
		let filepath = resolve(outputDir, localPath);
		// NB: avoiding `await` because we want non-blocking iteration here
		let op = page.render(context).
			then(html => createFile(filepath, html, cache));
		if(assets) { // copy page-specific assets
			let targetDir = resolve(outputDir, dirname(localPath));
			op = op. // wait for directory to be created
				then(() => Promise.all(assets.map(filepath => {
					return copy(filepath, targetDir, "page asset");
				})));
		}
		output.push(op);
	}
	await Promise.all(output);

	// copy global assets discovered during rendering
	await mkdir(assetsDir, { recursive: true });
	await Promise.all([...assets].map(filepath => {
		return copy(filepath, assetsDir, "global asset");
	}));
}

async function copy(filepath, targetDir, designation) {
	let filename = basename(filepath).replaceAll("_", "-"); // NB: design decision
	let target = resolve(targetDir, filename);
	console.error(`copying ${designation} \`${filepath}\`\n    to \`${target}\``);
	return copyFile(filepath, target, CREATE_ONLY);
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
