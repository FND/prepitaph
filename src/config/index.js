import { Article } from "./article/index.js";
import { fileURLToPath } from "node:url";
import { dirname, normalize, resolve } from "node:path";

let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export let AUTHORS = {
	FND: {
		handle: "@FND@hachyderm.io",
		url: "https://hachyderm.io/@FND",
	},
	cdent: {
		handle: "@anticdent@hachyderm.io",
		url: "https://hachyderm.io/@anticdent",
	},
	get(name) {
		try { // deno-lint-ignore no-var no-inner-declarations
			var res = this[name]; // deno-lint-ignore no-empty
		} catch (_err) {}
		if (res === undefined) {
			throw new Error(`unknown author: \`${name}\``);
		}
		return res;
	},
};

export * as blocks from "./converters.js";

export let contentDir = "./content"; // NB: relative to current working directory
export let outputDir = "./dist"; // NB: relative to current working directory
export let assetsDir = "./assets"; // NB: relative to `outputDir`
export let host = "https://prepitaph.org";
// deno-lint-ignore no-process-globals
export let pathPrefix = process.env.PATH_PREFIX || "";

let _assetsDir = `${pathPrefix}/${assetsDir}`;

export let siteTitle = "prepitaph";
export let favicon = {
	source: `${ROOT_DIR}/src/assets/icon.svg`,
	uri: normalize(`${_assetsDir}/icon.svg`),
};

// TODO: use `AssetManager` for URI generation
let prism = `${ROOT_DIR}/node_modules/prismjs`; // TODO: use `import.meta.resolve`
export let css = {
	default: [{
		source: `${ROOT_DIR}/src/assets/main.css`,
		uri: normalize(`${_assetsDir}/main.css`),
	}],
	syntax: [{
		source: `${prism}/themes/prism.min.css`,
		uri: normalize(`${_assetsDir}/prism.min.css`),
	}],
};
export let js = {
	source: [{
		source: `${ROOT_DIR}/src/assets/source.js`,
		uri: normalize(`${_assetsDir}/source.js`),
	}],
	embed: [{
		source: `${ROOT_DIR}/src/assets/embed.js`,
		uri: normalize(`${_assetsDir}/embed.js`),
	}, {
		source: `${prism}/components/prism-core.min.js`,
		uri: normalize(`${_assetsDir}/prism-core.min.js`),
	}, {
		source: `${prism}/components/prism-markup.min.js`,
		uri: normalize(`${_assetsDir}/prism-markup.min.js`),
	}, {
		source: `${prism}/components/prism-css.min.js`,
		uri: normalize(`${_assetsDir}/prism-css.min.js`),
	}, {
		source: `${prism}/components/prism-clike.min.js`,
		uri: normalize(`${_assetsDir}/prism-clike.min.js`),
	}, {
		source: `${prism}/components/prism-javascript.min.js`,
		uri: normalize(`${_assetsDir}/prism-javascript.min.js`),
	}, {
		source: `${prism}/plugins/autoloader/prism-autoloader.min.js`,
		uri: normalize(`${_assetsDir}/prism-autoloader.min.js`),
	}],
};

// deno-fmt-ignore
export let categories = {
	NONE: () => import("./info_page.js")
		.then((m) => m.InfoPage),
	// deno-lint-ignore require-await
	articles: async () => Article,
	// deno-lint-ignore require-await
	snippets: async () => class Snippet extends Article {
		static type = "snippet";
	},
	// deno-lint-ignore require-await
	journal: async () => class Journal extends Article {
		static type = "journal";
		static symbol = "📓";
	},
	// deno-lint-ignore require-await
	wip: async () => class WIP extends Article {
		static type = "work in progress";
		static symbol = "✏️";
	},
};
