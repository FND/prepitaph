import { siteTitle } from "./index.js"; // XXX: circular
import { renderMarkdown } from "../ssg/markdown.js";
import { txt2blocks } from "../ssg/ingestion.js";
import { html, RAW } from "../ssg/html.js";
import Prism from "prismjs";

let { highlight, languages } = Prism;

export {
	markdown as "default", // awkward, but necessary
	markdown,
	markdown as intro
};
export let NONE = (content, params, context) => html`<pre>${content}</pre>`;
export let javascript = await code("javascript");
export let python = await code("python");

export async function feed(content, { category, title = siteTitle }, context) {
	let { renderAtom } = await import("./feed.js");
	let pages = context.store.retrieve(category);
	return renderAtom(pages, title, context);
}

export async function list(content, { category }, context) {
	let res = [];
	for(let page of context.store.retrieve(category)) {
		let html = page.render(context, { isStandalone: false });
		res.push(html);
	}
	res = await Promise.all(res);
	return res.join("\n");
}

export async function aside(content, { backticks = "'''" }, context) {
	content = content.replaceAll(backticks, "```");
	return html`<aside class="stack">${{
		[RAW]: await context.transformer.render(txt2blocks(content), context)
	}}</aside>`;
}

async function markdown(content, { allowHTML }, { store, config }) {
	let html = await renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase(), // XXX: crude
		allowHTML: allowHTML === "true",
		resolveURI(uri, type) {
			if(uri.startsWith("page://")) {
				let page = store.resolve(uri.substring(7));
				return page.url(config.baseURL).pathname;
			}
			return uri;
		}
	});
	// hack to work around excessive HTML sanitization disallowing `data:` URIs
	return html.replaceAll('<img src="inline://', '<img src="data:');
}

async function code(lang, grammar = lang) {
	let _grammar = languages[grammar];
	if(!_grammar) {
		let { default: loadLanguages } = await import("prismjs/components/index.js");
		loadLanguages([lang]);
		return code(lang, grammar);
	}
	return (content, params, context) => {
		return html`<pre><code${{ class: `language-${lang}` }}>${{
			[RAW]: highlight(content, _grammar, lang)
		}}</code></pre>`;
	};
}
