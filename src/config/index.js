import { fileURLToPath } from "node:url";
import { resolve, normalize, dirname } from "node:path";

let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export * as blocks from "./converters.js";

export let contentDir = "./content"; // NB: relative to current working directory
export let outputDir = "./dist"; // NB: relative to current working directory
export let assetsDir = "./assets"; // NB: relative to `outputDir`
export let host = "https://prepitaph.org";
export let pathPrefix = process.env.PATH_PREFIX || "";

let _assetsDir = `${pathPrefix}/${assetsDir}`;

export let siteTitle = "prepitaph";
export let favicon = {
	source: `${ROOT_DIR}/src/assets/icon.svg`,
	uri: normalize(`${_assetsDir}/icon.svg`)
};

// TODO: use `AssetManager` for URI generation
export let css = {
	default: [{
		source: `${ROOT_DIR}/src/assets/main.css`,
		uri: normalize(`${_assetsDir}/main.css`)
	}],
	syntax: [{ // TODO: use `import.meta.resolve`
		source: `${ROOT_DIR}/node_modules/prismjs/themes/prism.min.css`,
		uri: normalize(`${_assetsDir}/prism.min.css`)
	}]
};
export let js = {
	embed: [{
		source: `${ROOT_DIR}/src/assets/embed.js`,
		uri: normalize(`${_assetsDir}/embed.js`)
	}]
};

export let categories = {
	NONE: () => import("./info_page.js").
		then(m => m.InfoPage),
	articles: () => import("./article/index.js").
		then(m => m.Article),
	snippets: () => import("./snippet.js").
		then(m => m.Snippet)
};
