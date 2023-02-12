import { renderMarkdown } from "./ssg/markdown.js";
import { renderAll } from "./ssg/transform.js";
import { txt2blocks } from "./ssg/parser.js";
import { html, RAW } from "./ssg/html.js";
import Prism from "prismjs";
import { fileURLToPath } from "node:url";
import { resolve, normalize, dirname } from "node:path";

let { highlight, languages } = Prism;

let { PATH_PREFIX = "" } = process.env;
let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export let contentDir = "./content"; // NB: relative to current working directory
export let outputDir = "./dist"; // NB: relative to current working directory
export let assetsDir = "./assets"; // NB: relative to `outputDir`

export let siteTitle = "prepitaph";
export let css = {
	default: [{
		source: `${ROOT_DIR}/src/assets/main.css`,
		uri: normalize(`${PATH_PREFIX}/${assetsDir}/main.css`)
	}],
	syntax: [{ // TODO: use `import.meta.resolve`
		source: `${ROOT_DIR}/node_modules/prismjs/themes/prism.min.css`,
		uri: normalize(`${PATH_PREFIX}/${assetsDir}/prism.min.css`)
	}]
};
export let categories = {
	articles: () => import("./content/article/index.js").
		then(m => m.Article)
};
export let blocks = {
	default: markdown,
	none: (content, params, context) => html`<pre>${content}</pre>`,
	intro: markdown,
	aside: async (content, { backticks = "'''" }, context) => {
		content = content.replaceAll(backticks, "```");
		return html`<aside class="stack">${{
			[RAW]: await renderAll(txt2blocks(content), context,
					context.transformer)
		}}</aside>`;
	},
	javascript: code("javascript")
};

function markdown(content) {
	return renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase() // XXX: crude
	});
}

function code(lang, grammar = lang) {
	grammar = languages[grammar];
	return (content, params, context) => {
		return html`<pre><code${{ class: `language-${lang}` }}>${{
			[RAW]: highlight(content, grammar, lang)
		}}</code></pre>`;
	};
}
