import { siteTitle } from "./index.js"; // XXX: circular
import { renderMarkdown } from "../ssg/markdown.js";
import { txt2blocks } from "../ssg/ingestion.js";
import { html, trustedHTML, RAW } from "../ssg/html.js";
import Prism from "prismjs";

let { highlight, languages } = Prism;

let _html = await code("html");
export {
	markdown as "default", // awkward, but necessary
	markdown,
	_html as html
};
export let NONE = (content, params, context) => html`<pre>${content}</pre>`;
export let json = await code("json");
export let css = await code("css");
export let javascript = await code("javascript");
export let typescript = await code("typescript");
export let python = await code("python");

export async function feed(content, { category, title = siteTitle }, context) {
	let { renderAtom } = await import("./feed.js");
	let pages = retrievePages(category, context.store);
	return renderAtom(sortByDate(pages), title, context);
}

export async function topics(content, { category }, context) {
	let byTag = new Map();
	let tags = [];
	for(let page of retrievePages(category, context.store)) {
		for(let tag of page.tags) {
			let entries = byTag.get(tag);
			if(entries) {
				entries.push(page);
			} else {
				byTag.set(tag, [page]);
				tags.push(tag);
			}
		}
	}
	let { baseURL } = context.config;
	return html`<dl class="topics">${{
		[RAW]: tags.sort().map(tag => {
			return html`<dt>${tag}</dt><dd><ul><li>${{
				[RAW]: byTag.get(tag).map(page => html`
					<a${{ href: page.url(baseURL).pathname }}>${page.title}</a>
				`.trim()).join("</li><li>")
			}}</li></ul></dd>`;
		}).join("\n")
	}}</dl>`;
}

export async function list(content, { category }, context) {
	let res = [];
	for(let page of sortByDate(retrievePages(category, context.store))) {
		let html = page.render(context, {
			isDocument: false,
			heading: true,
			metadata: true,
			intro: true,
			main: false
		});
		res.push(html);
	}
	res = await Promise.all(res);
	return res.join("\n");
}

export async function figure(content, {
	filename = null,
	caption = filename,
	img = null,
	compact = false,
	id = null,
	lazy = false,
	backticks = "'''"
}, context) {
	let cls = compact && "is-compact ";
	let res = html`<figure${{ id }} class="${cls}stack">${
		img ? trustedHTML`<img${{
			src: img,
			alt: content,
			loading: lazy && "lazy"
		}}>` : {
			[RAW]: await render(content, { backticks }, context)
		}
	}${
		caption && trustedHTML`<figcaption${{
			class: filename && "is-filename"
		}}>${caption}</figcaption>`
	}</figure>`;
	return id === null ? res : html`<a${{ href: `#${id}` }}>${{ [RAW]: res }}</a>`;
}

export async function intro(content, params, context) {
	return render(content, params, context);
}

export async function infobox(content, params, context) {
	return html`<div class="infobox stack"><b class="visually-hidden">NB:</b>${{
		[RAW]: await render(content, params, context)
	}}</div>`;
}

export async function aside(content, params, context) {
	return html`<aside class="${params.compact && "is-compact "}stack"><b${{
		class: "visually-hidden"
	}}>Aside:</b>${{
		[RAW]: await render(content, params, context)
	}}</aside>`;
}

export async function embed(content, { uri }, context) {
	let page, path;
	if(uri.startsWith("./")) {
		page = context.page;
		path = uri.slice(2);
	} else {
		let [category, _page, ..._path] = uri.split("/");
		page = [category, _page].join("/");
		page = context.store.resolve(page);
		path = _path.join("/");
	}
	return html`<iframe ${{
		src: page.url(context.config.baseURL).href + path
	}}></iframe>`;
}

export async function footnote(content, params, context) {
	let name = Object.keys(params)[0];
	let i = context.footnotes.indexOf(name) + 1;
	return html`<aside${{ id: `fn:${name}` }} class="footnote stack"><sup${{
		"aria-label": `footnote #${i}`
	}}>${i}</sup>${{
		[RAW]: await render(content, params, context)
	}}</aside>`;
}

async function markdown(content, { allowHTML = false }, context) {
	let html = await renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase(), // XXX: crude
		allowHTML,
		resolveURI(uri, type, node) {
			if(uri === "footnote://") {
				let { footnotes } = context;
				let text = node.firstChild;
				let name = text.literal;
				text.literal = footnotes.push(name);
				return `#fn:${name}`;
			} else if(uri.startsWith("page://")) {
				let page = context.store.resolve(uri.slice(7));
				return page.url(context.config.baseURL).pathname;
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

function* retrievePages(category, store) {
	for(let page of store.retrieve(category)) {
		if(!page.tags.includes("unlisted")) {
			yield page;
		}
	}
}

function render(content, { backticks = "'''" }, context) {
	return context.transformer.
		render(txt2blocks(content.replaceAll(backticks, "```")), context);
}

function sortByDate(pages) {
	return [...pages].sort((a, b) => (b.updated || b.created) - (a.updated || a.created));
}
