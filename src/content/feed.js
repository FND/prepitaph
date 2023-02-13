import { html, RAW } from "../ssg/html.js";
import { siteTitle, host, pathPrefix } from "../config.js";
import { collect } from "../ssg/util.js";

export async function renderAtom(pages, context) {
	pages = await collect(pages);
	let { metadata } = pages[0];
	let timestamp = metadata.updated || metadata.created;
	let baseURL = host + pathPrefix;
	// XXX: is HTML encoding correct/sufficient here?
	return html`
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<id>${baseURL}</id>
	<title>${siteTitle}</title>
	<link${{ href: baseURL }}/>
	<link${{ href: host + context.selfURI }} rel="self"/>
	<updated>${timestamp.toISOString()}</updated>
	${{
		[RAW]: await Promise.all(pages.map(page => renderEntry(page, context))).
			then(entries => entries.join("\n"))
	}}
</feed>
	`.trim();
}

async function renderEntry(page, context) {
	let url = host + page.uri(pathPrefix);
	let { metadata } = page;
	// TODO: use `<content>` instead of `<summary>`? requires rendering to
	// * distinguish more variants (full document vs. main vs. summary)
	// * use absolute URLs throughout (including media)
	return html`
<entry>
	<id>${url}</id>
	<title>${metadata.title}</title>
	<link${{ href: url }}/>
	<updated>${(metadata.updated || metadata.created).toISOString()}</updated>
	<author>
		<name>${metadata.author}</name>
	</author>
	<summary type="html">${await page.render(context, { isStandalone: false })}</summary>
</entry>
	`.trim();
}
