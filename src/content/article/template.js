import layout from "../layout.js";
import { html, RAW } from "../../ssg/html.js";
import { css, pathPrefix } from "../../config.js";

export async function document(article, { assets }) {
	let { title, syntax } = article.metadata;
	let styles = syntax === false ? css.default : css.default.concat(css.syntax);
	return layout({
		title,
		content: await fragment(article, { isStandalone: true }),
		css: assets.register(styles)
	});
}

export async function fragment(article, { isStandalone } = {}) {
	let { metadata, intro } = article;
	let ts = metadata.updated || metadata.created; // NB: design decision
	let timestamp = ts.toISOString().substring(0, 10);
	let date = ts.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	intro = intro === null ? "" : html`<div class="teaser stack">${{
		[RAW]: await intro
	}}</div>`;

	let tag = { [RAW]: isStandalone ? "main" : "article" };
	let title = isStandalone ? html`<h1>${metadata.title}</h1>` : html`<h2><a${{
		href: article.uri(pathPrefix)
	}}>${metadata.title}</a></h2>`;
	return html`
<${tag} class="article stack">
	<header class="stack">
		${{ [RAW]: title }}
		<p class="metadata">
			by <b>${metadata.author}</b>
			<time${{ datetime: timestamp }}>${date}</time>
		</p>
		${{ [RAW]: intro }}
	</header>
	${isStandalone ? { [RAW]: await article.content } : ""}
</${tag}>
	`.trim();
}
