import { html, RAW } from "../ssg/html.js";
import { collect } from "../ssg/util.js";

export async function renderAtom(pages, title, context) {
	pages = await collect(pages);
	let first = pages[0];
	let { config } = context;
	let baseURL = new URL(config.pathPrefix, config.host).href;
	// XXX: is HTML encoding correct/sufficient here?
	return html`
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<id>${baseURL}</id>
	<title>${title}</title>
	<link${{ href: baseURL }}/>
	<link${{ href: context.selfURL }} rel="self"/>
	<updated>${(first.updated || first.created).toISOString()}</updated>
	${{
		[RAW]: await Promise.all(pages.map(page => renderEntry(page, context))).
			then(entries => entries.join("\n"))
	}}
</feed>
	`.trim();
}

async function renderEntry(page, context) {
	let { config } = context;
	let url = page.url(config.host, config.pathPrefix);
	// TODO: use `<content>` instead of `<summary>`? requires rendering to
	// * distinguish more variants (full document vs. main vs. summary)
	// * use absolute URLs throughout (including media)
	return html`
<entry>
	<id>${url}</id>
	<title>${page.title}</title>
	<link${{ href: url }}/>
	<updated>${(page.updated || page.created).toISOString()}</updated>
	<author>
		<name>${page.author}</name>
	</author>
	<summary type="html">${await page.render(context, { isStandalone: false })}</summary>
</entry>
	`.trim();
}
