import { siteTitle } from "./index.js"; // XXX: circular
import { renderMarkdown } from "../ssg/markdown.js";
import { isPageReference, resolvePageReference } from "../ssg/page.js";
import { txt2blocks } from "../ssg/ingestion.js";
import { html, RAW, trustedHTML } from "../ssg/html.js";
import Prism from "prismjs";

let { highlight, languages } = Prism;

let _html = await code("html");
export {
	_html as html,
	markdown,
	markdown as "default", // awkward, but necessary
};
export let NONE = (content, _params, _context) => {
	// deno-fmt-ignore
	return html`<source-view><pre>${content}</pre></source-view><script type="module"${{
		src: "/assets/source.js", // TODO: fingerprinting
	}} async></script>`;
};
export let ini = await code("ini");
export let xml = await code("xml");
export let json = await code("json");
export let css = await code("css");
export let javascript = await code("javascript");
export let typescript = await code("typescript");
export let shell = await code("shell");
export let python = await code("python");
export let go = await code("go");
export let docker = await code("docker");

export async function feed(_content, { categories, title = siteTitle }, context) {
	let { renderAtom } = await import("./feed.js");
	let pages = retrievePages(categories, context.store);
	return renderAtom(sortByDate(pages), title, context);
}

// deno-lint-ignore require-await
export async function topics(_content, { categories }, context) {
	let byTag = new Map();
	let tags = [];
	for (let page of retrievePages(categories, context.store)) {
		for (let tag of page.tags) {
			let entries = byTag.get(tag);
			if (entries) {
				entries.push(page);
			} else {
				byTag.set(tag, [page]);
				tags.push(tag);
			}
		}
	}
	let { baseURL } = context.config;
	// deno-fmt-ignore
	return html`<dl class="topics">${{
		[RAW]: tags.sort().map((tag) => {
			return html`<dt>${tag}</dt><dd><ul><li>${{
				// deno-fmt-ignore
				[RAW]: byTag.get(tag).map(page => html`
					<a${{ href: page.url(baseURL).pathname }}>${page.title}</a>
					${page.renderType()}
				`.trim()).join("</li><li>"),
			}}</li></ul></dd>`;
		}).join("\n"),
	}}</dl>`;
}

export async function list(_content, { categories }, context) {
	let res = [];
	for (let page of sortByDate(retrievePages(categories, context.store))) {
		let html = page.render(context, {
			isDocument: false,
			heading: true,
			metadata: true,
			teaser: true,
			main: false,
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
	backticks = "'''",
}, context) {
	if (caption && filename === null) {
		caption = {
			[RAW]: await render(caption, { backticks }, context),
		};
	}
	let cls = compact && "is-compact ";
	// deno-fmt-ignore
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
			class: filename && "is-filename",
		}}>${caption}</figcaption>`
	}</figure>`;
	// deno-fmt-ignore
	return id === null ? res : html`<a${{ href: `#${id}` }}>${{ [RAW]: res }}</a>`;
}

export let intro = teaser;

// deno-lint-ignore require-await
export async function teaser(content, params, context) {
	return render(content, params, context);
}

export async function infobox(content, params, context) {
	// deno-fmt-ignore
	return html`<div class="infobox stack"><b class="nonvisual">NB: </b>${{
		[RAW]: await render(content, params, context),
	}}</div>`;
}

export async function aside(content, params, context) {
	// deno-fmt-ignore
	return html`<aside class="${params.compact && "is-compact "}stack"><b${{
		class: "nonvisual",
	}}>Aside: </b>${{
		[RAW]: await render(content, params, context),
	}}</aside>`;
}

// deno-lint-ignore require-await
export async function embed(_content, { uri, resize }, context) {
	let page, path;
	if (uri.startsWith("./")) {
		page = context.page;
		path = uri.slice(2);
	} else {
		let [category, _page, ..._path] = uri.split("/");
		page = [category, _page].join("/");
		page = context.store.resolve(page);
		path = _path.join("/");
	}

	// deno-fmt-ignore
	return html`<web-demo${{ resize }}><iframe${{
		src: page.url(context.config.baseURL).href + path,
	}}></iframe></web-demo><script type="module"${{
		src: "/assets/embed.js", // TODO: fingerprinting
	}} async></script>`;
}

export async function disclosure(content, params, context) {
	let { caption } = params;
	if (params.markdown) {
		caption = {
			[RAW]: await render(caption, params, context),
		};
	}
	// deno-fmt-ignore
	return html`<details class="disclosure stack"><summary>${caption}</summary>${{
		[RAW]: await render(content, params, context),
	}}</details>`;
}

export async function footnote(content, params, context) {
	let name = Object.keys(params)[0];
	let i = context.footnotes.indexOf(name) + 1;
	// deno-fmt-ignore
	return html`<aside${{ id: `fn:${name}` }} class="footnote stack"><sup${{
		"aria-label": `footnote #${i}`,
	}}>${i}</sup>${{
		[RAW]: await render(content, params, context),
	}}</aside>`;
}

export async function ref(content, params, context) {
	let name = Object.keys(params)[0];
	// deno-fmt-ignore
	return html`<a${{ id: `ref:${name}` }}></a>${{
		[RAW]: await render(content, params, context),
	}}`;
}

async function markdown(content, { allowHTML = false }, context) {
	let html = await renderMarkdown(content, {
		fragIDs: (txt) => txt.replace(/\s/g, "-").toLowerCase(), // XXX: crude
		allowHTML,
		resolveURI(uri, _type, node) {
			if (uri === "footnote://") {
				let { footnotes } = context;
				let text = node.firstChild;
				let name = text.literal;
				text.literal = footnotes.push(name);
				return `#fn:${name}`;
			} else if (isPageReference(uri)) {
				return resolvePageReference(uri, context);
			}
			return uri;
		},
	});
	// hack to work around excessive HTML sanitization disallowing `data:` URIs
	return html.replaceAll('<img src="inline://', '<img src="data:');
}

async function code(lang, grammar = lang) {
	let _grammar = languages[grammar];
	if (!_grammar) {
		let { default: loadLanguages } = await import("prismjs/components/index.js");
		loadLanguages([lang]);
		return code(lang, grammar);
	}
	return (content, _params, _context) => {
		// deno-fmt-ignore
		return html`<source-view><pre><code${{ class: `language-${lang}` }}>${{
			[RAW]: highlight(content, _grammar, lang)
				.replaceAll("«", "<mark>")
				.replaceAll("»", "</mark>"),
		}}</code></pre></source-view><script type="module"${{
			src: "/assets/source.js", // TODO: fingerprinting
		}} async></script>`;
	};
}

function* retrievePages(categories, store) {
	for (let category of categories.split(",")) {
		for (let page of store.retrieve(category)) {
			if (!page.tags.includes("unlisted")) {
				yield page;
			}
		}
	}
}

function render(content, { backticks = "'''" }, context) {
	return context.transformer
		.render(txt2blocks(content.replaceAll(backticks, "```")), context);
}

function sortByDate(pages) {
	return [...pages].sort((a, b) => (b.updated || b.created) - (a.updated || a.created));
}
