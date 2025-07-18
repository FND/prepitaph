import { html, RAW, trustedHTML } from "../ssg/html.js";

export async function renderAtom(pages, title, context) {
	let first = pages[0];
	let { config } = context;
	let { baseURL } = config;
	let id = baseURL; // XXX: somewhat incorrect, but retained for backwards compatibility
	let baseAttr = trustedHTML`${{ "xml:base": baseURL }}`;
	// XXX: is HTML encoding correct/sufficient here?
	// deno-fmt-ignore
	return html`
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<id>${id}</id>
	<title>${title}</title>
	<link${{ href: baseURL }}/>
	<link${{ href: context.selfURL }} rel="self"/>
	<updated>${(first.updated || first.created).toISOString()}</updated>
	${{
		[RAW]: await Promise.all(pages
			.map((page) => renderEntry(page, context, baseAttr)))
			.then((entries) => entries.join("\n")),
	}}
</feed>
	`.trim();
}

async function renderEntry(page, context, baseAttr) {
	let { config } = context;
	let { baseURL } = config;
	let url = page.url(baseURL).href;
	let summary = page.render(context, {
		isDocument: false,
		heading: false,
		metadata: true,
		teaser: true,
		main: false,
	});
	let content = page.render(context, {
		isDocument: false,
		heading: false,
		metadata: true,
		teaser: true,
		main: true,
	});
	summary = (await summary).replaceAll("\n", " "); // discard line breaks
	// deno-fmt-ignore
	return html`
<entry>
	<id>${url}</id>
	<title>${page.title}</title>
	<link${{ href: url }}/>
	<published>${page.created.toISOString()}</published>
	<updated>${(page.updated || page.created).toISOString()}</updated>
	<author><name>${page.author}</name></author>
	<summary type="html"${baseAttr}>${summary}</summary>
	<content type="html"${baseAttr}>${await content}</content>
</entry>
	`.trim();
}
