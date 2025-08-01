import { resolvePageReference } from "../ssg/page.js";
import { html, RAW, trustedHTML } from "../ssg/html.js";

let REDIRECT_DELAY = 5;
// NB: cached; these are assumed to be identical on all pages
let FEED, ICON;
let NAV = {
	index: "prepitaph",
	topics: "topics",
	colophon: "colophon",
};

export default ({
	title,
	author,
	teaser = null,
	canonicalURL = null,
	redirectURI = null,
	content,
	css = [],
	assets,
	store,
	config,
}) => {
	if (!FEED) {
		let { baseURL } = config;
		FEED = trustedHTML`<link rel="alternate" type="application/atom+xml"${{
			href: store.retrieve(null, "index", "atom").url(baseURL).pathname,
		}}>`;
		ICON = trustedHTML`<link rel="icon" type="image/svg+xml"${{
			href: assets.register(config.favicon),
		}}>`;
		NAV = trustedHTML`<nav>${{
			[RAW]: Object.entries(NAV).map(([slug, caption], i) => {
				let uri = store.retrieve(null, slug).url(baseURL).pathname;
				// deno-fmt-ignore
				return html`<a${{ href: uri }}>${
					i === 0 ? trustedHTML`<b>${caption}</b>` : caption
				}</a>`;
			}).join("\n"),
		}}</nav>`;
	}

	title = title.isStandalone ? title.text : `${title} | ${config.siteTitle}`;
	let handle = author && config.AUTHORS.get(author).handle;

	let redirect, redirectURL, redirectNotice;
	if (redirectURI) {
		redirectURL = resolvePageReference(redirectURI, { store, config });
		redirect = `${REDIRECT_DELAY}; url=${redirectURL}`;
		redirectNotice = trustedHTML`<p class="redirect-notice">
	This page was moved to a <a${{ href: redirectURL }}>new URL</a>.
	<small>
		You should be automatically redirected within ${REDIRECT_DELAY} seconds.
	</small>
</p>`;
	}

	// NB: layout will always be EN
	// deno-fmt-ignore
	return html`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>${title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${canonicalURL &&
			trustedHTML`<link rel="canonical"${{ href: canonicalURL }}>`}
	${redirect &&
			trustedHTML`<meta http-equiv="refresh"${{ content: redirect }}>`}
	${teaser &&
			trustedHTML`<meta name="description"${{ content: teaser }}>`}
	${handle &&
			trustedHTML`<meta property="fediverse:creator"${{ content: handle }}>`}
	${FEED}
	${ICON}
	${{
		[RAW]: css
			.map((uri) => html`<link rel="stylesheet"${{ href: uri }}>`)
			.join("\n"),
	}}
</head>

<body class="stack">
	<header class="site-header">${NAV}</header>
	${redirectNotice}
	${{ [RAW]: content }}
</body>

</html>
	`.trim();
};
