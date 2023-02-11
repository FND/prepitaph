import { renderMarkdown } from "./ssg/markdown.js";
import { renderAll } from "./ssg/transform.js";
import { txt2blocks } from "./ssg/parser.js";
import { encodeContent as html } from "./ssg/html.js";
import Prism from "prismjs";
import { fileURLToPath } from "node:url";
import { resolve, normalize, dirname } from "node:path";

let { highlight, languages } = Prism;

let OUTPUT_DIR = "./dist";
let ASSETS_DIR = "./assets";
let { PATH_PREFIX = "" } = process.env;
let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default {
	contentDir: "./content", // NB: relative to current working directory
	outputDir: OUTPUT_DIR, // NB: relative to current working directory
	assetsDir: ASSETS_DIR, // NB: relative to `outputDir`

	siteTitle: "prepitaph",
	css: {
		default: [{
			source: `${ROOT_DIR}/src/assets/main.css`,
			uri: normalize(`${PATH_PREFIX}/${ASSETS_DIR}/main.css`)
		}],
		syntax: [{ // TODO: use `import.meta.resolve`
			source: `${ROOT_DIR}/node_modules/prismjs/themes/prism.min.css`,
			uri: normalize(`${PATH_PREFIX}/${ASSETS_DIR}/prism.min.css`)
		}]
	},
	categories: {
		articles: () => import("./content/article/index.js").
			then(m => m.Article)
	},
	blocks: {
		default: markdown,
		none: (content, params, context) => `<pre>${html(content)}</pre>`,
		intro: markdown,
		aside: async (content, { backticks = "'''" }, context) => {
			content = content.replaceAll(backticks, "```");
			let html = await renderAll(txt2blocks(content), context, context.transformer);
			return `<aside class="stack">${html}</aside>`;
		},
		javascript: code("javascript")
	}
};

function markdown(content) {
	return renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase() // XXX: crude
	});
}

function code(lang, grammar = lang) {
	return (content, params, context) => {
		let html = highlight(content, languages[grammar], lang);
		return `<pre><code class="language-${lang}">${html}</code></pre>`;
	};
}
