import { html, trustedHTML, RAW } from "../ssg/html.js";

// NB: cached; these are assumed to be identical on all pages
let ICON;
let NAV = {
	index: "prepitaph",
	topics: "topics",
	colophon: "colophon"
};

export default ({
	title,
	summary = null,
	canonicalURL = null,
	content,
	css = [],
	assets,
	store,
	config
}) => {
	if(!ICON) {
		ICON = trustedHTML`<link rel="icon" type="image/svg+xml"${{
			href: assets.register(config.favicon)
		}}>`;
		let { baseURL } = config;
		NAV = trustedHTML`<nav>${{
			[RAW]: Object.entries(NAV).map(([slug, caption], i) => {
				let uri = store.retrieve(null, slug).url(baseURL).pathname;
				return html`<a${{ href: uri }}>${
					i === 0 ? trustedHTML`<b>${caption}</b>` : caption
				}</a>`;
			}).join("\n")
		}}</nav>`;
	}

	title = title.isStandalone ? title.text : `${title} | ${config.siteTitle}`;
	// NB: layout will always be EN
	return html`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>${title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${canonicalURL && {
		[RAW]: html`<link rel="canonical"${{ href: canonicalURL }}>`
	}}
	${summary && {
		[RAW]: html`<meta name="description"${{ content: summary }}>`
	}}
	${ICON}
	${{
		[RAW]: css.
			map(uri => html`<link rel="stylesheet"${{ href: uri }}>`).
			join("\n")
	}}
</head>

<body class="stack">
	<header class="site-header">${NAV}</header>
	${{ [RAW]: content }}
</body>

</html>
	`.trim();
};
