import layout from "../layout.js";
import { html, trustedHTML, RAW } from "../../ssg/html.js";

let TOPICS_LINK;

export async function document(article, { includeHost, assets, store, config }) {
	let { css } = config;
	let styles = article.syntax ? css.default.concat(css.syntax) : css.default;
	return layout({
		title: article.title,
		summary: await article.intro,
		content: await fragment(article, {
			isStandalone: true,
			includeHost,
			store,
			config
		}),
		css: assets.register(styles),
		store,
		config
	});
}

export async function fragment(article,
		{ isStandalone = false, includeHost, store, config }) {
	let ts = article.updated || article.created; // NB: design decision
	let timestamp = ts.toISOString().substring(0, 10);
	let date = ts.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	let { baseURL } = config;
	if(!TOPICS_LINK) { // NB: cached; assumed to be identical for all articles
		TOPICS_LINK = trustedHTML`<a${{
			href: store.retrieve(null, "topics").url(baseURL).pathname
		}}>topics</a>`;
	}

	let url = article.url(baseURL);
	let title = isStandalone ?
		html`<h1>${article.title}</h1>` :
		html`<h2><a${{
			href: includeHost ? url.href : url.pathname
		}}>${article.title}</a></h2>`;

	let { intro } = article;
	intro = intro && {
		[RAW]: html`<div class="teaser stack">${{ [RAW]: await intro }}</div>`
	};

	let tag = { [RAW]: isStandalone ? "main" : "article" };
	return html`
<${tag} class="article stack">
	<header class="stack">
		${{ [RAW]: title }}
		<p class="metadata">
			by <b>${article.author}</b>
			<time${{ datetime: timestamp }}>${date}</time>
		</p>
		${intro}
	</header>
	${isStandalone && {
		[RAW]: await article.content.
			then(content => content + html`
				<footer>${TOPICS_LINK}: ${article.tags.join(", ")}</footer>
			`.trim())
	}}
</${tag}>
	`.trim();
}
