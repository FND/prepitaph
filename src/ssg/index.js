import { ingestContent } from "./ingestion.js";
import { TextTransformer } from "./transform.js";
import { AssetRegistry } from "./assets.js";
import { ContentStore } from "./store.js";
import { createFile, realpath } from "./fs.js";
import { clone, CustomError, normalizeFilename, normalizeURI } from "./util.js";
import * as globalConfig from "../config/index.js";
import { constants, copyFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

let CREATE_ONLY = constants.COPYFILE_EXCL;

try {
	await main();
} catch (err) {
	if (err instanceof CustomError) {
		abort(`[${err.code}] ${err.message}`);
	}
	throw err;
}

async function main() {
	let host = normalizeURI(globalConfig.host);
	let pathPrefix = normalizeURI(globalConfig.pathPrefix);
	let baseURL = new URL(pathPrefix + "/", host).href;
	let config = clone(globalConfig, { baseURL, host, pathPrefix });

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
	let context = {
		store,
		assets: new AssetRegistry(),
		transformer: new TextTransformer(config.blocks),
		config,
	};
	let cache = new Set();
	let pages = [];
	for (let page of store) {
		console.error(`... ${page.url(baseURL).href}`);
		let { assets, localPath } = page;
		let filepath = resolve(outputDir, localPath);
		// NB: avoiding `await` because we want non-blocking iteration here
		let op = page.render(context)
			.then((html) => createFile(filepath, html, cache));
		if (assets) { // copy page-specific assets
			let targetDir = resolve(outputDir, dirname(localPath));
			// deno-fmt-ignore
			op = op. // wait for directory to be created
				then(() => Promise.all(assets.map(filepath => {
					return copy(filepath, targetDir, "page asset");
				})));
		}
		pages.push(op);
	}
	await Promise.all(pages);

	// copy global assets discovered during rendering
	await mkdir(assetsDir, { recursive: true });
	await Promise.all([...context.assets].map((filepath) => {
		return copy(filepath, assetsDir, "global asset");
	}));
}

// deno-lint-ignore require-await
async function copy(filepath, targetDir, designation) {
	let filename = normalizeFilename(basename(filepath));
	let target = resolve(targetDir, filename);
	console.error(`copying ${designation} \`${filepath}\`\n    to \`${target}\``);
	return copyFile(filepath, target, CREATE_ONLY);
}

function abort(msg) {
	console.error("\nERROR!", msg);
	// deno-lint-ignore no-process-globals
	process.exit(1);
}
