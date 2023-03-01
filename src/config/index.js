import * as blocks from "./converters.js";
import { fileURLToPath } from "node:url";
import { resolve, normalize, dirname } from "node:path";

let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export let contentDir = "./content"; // NB: relative to current working directory
export let outputDir = "./dist"; // NB: relative to current working directory
export let assetsDir = "./assets"; // NB: relative to `outputDir`
export let host = "https://prepitaph.org";
export let pathPrefix = process.env.PATH_PREFIX || "";

export let siteTitle = "prepitaph";
export let css = { // TODO: use `AssetManager` for URI generation
	default: [{
		source: `${ROOT_DIR}/src/assets/main.css`,
		uri: normalize(`${pathPrefix}/${assetsDir}/main.css`)
	}],
	syntax: [{ // TODO: use `import.meta.resolve`
		source: `${ROOT_DIR}/node_modules/prismjs/themes/prism.min.css`,
		uri: normalize(`${pathPrefix}/${assetsDir}/prism.min.css`)
	}]
};
export let categories = {
	NONE: () => import("./info_page.js").
		then(m => m.InfoPage),
	articles: () => import("./article/index.js").
		then(m => m.Article)
};
export { blocks };
