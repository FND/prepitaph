import { renderMarkdown } from "./ssg/markdown.js";
import { txt2blocks } from "./ssg/parser.js";
import { html, RAW } from "./ssg/html.js";
import { collect } from "./ssg/util.js";
import Prism from "prismjs";
import { fileURLToPath } from "node:url";
import { resolve, normalize, dirname } from "node:path";

let { highlight, languages } = Prism;

let ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export let contentDir = "./content"; // NB: relative to current working directory
export let outputDir = "./dist"; // NB: relative to current working directory
export let assetsDir = "./assets"; // NB: relative to `outputDir`
export let pathPrefix = process.env.PATH_PREFIX || "";

export let siteTitle = "prepitaph";
export let css = {
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
	NONE: () => import("./content/info.js").
		then(m => m.InfoPage),
	articles: () => import("./content/article/index.js").
		then(m => m.Article)
};
export let blocks = {
	default: markdown,
	NONE: (content, params, context) => html`<pre>${content}</pre>`,
	list: async (content, { collection, category }, context) => {
		let res = list(collection, category, context);
		return collect(res, "\n");
	},
	intro: markdown,
	aside: async (content, { backticks = "'''" }, context) => {
		content = content.replaceAll(backticks, "```");
		return html`<aside class="stack">${{
			[RAW]: await context.transformer.render(txt2blocks(content), context)
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

async function* list(collection, category, context) {
	for await (let page of context[collection]) {
		if(page.metadata.category === category) {
			yield page.render(context, { isStandalone: false });
		}
	}
}
