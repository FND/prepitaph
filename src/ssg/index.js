import { TextPage } from "./page.js";
import { TextTransformer } from "./transform.js";
import { getFiles, realpath } from "./fs.js";
import config from "../config.js";
import { relative, dirname, sep } from "node:path";

try {
	await main();
} catch(err) {
	abort(err.message); // XXX: complicates debugging
}

async function main() {
	let contentDir = await realpath(config.contentDir);
	let transformer = new TextTransformer(config.blocks);

	console.error(`starting content discovery in \`${contentDir}\``);
	for await (let { page, localPath } of discoverContent(contentDir)) {
		let { category } = page.metadata;
		console.error(`[${category}]`, localPath);

		let getClass = config.categories[category];
		if(!getClass) {
			let msg = "unrecognized category";
			throw new Error(`${msg} in \`${page.filepath}\`: \`${category}\``);
		}
		let cls = await getClass();

		page = await cls.from(page, transformer);
		console.log(page);
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

		let page = await TextPage.from(filepath, { category });
		yield { page, localPath };
	}
}

function abort(msg) {
	console.error("\nERROR!", msg);
	process.exit(1);
}
