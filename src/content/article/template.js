import layout from "../layout.js";
import { html, RAW } from "../../ssg/html.js";
import { css } from "../../config.js";

export function document(article, { assets }) {
	let { title, syntax } = article.metadata;
	let styles = syntax === false ? css.default : css.default.concat(css.syntax);
	return layout({
		title,
		content: fragment(article, { isStandalone: true }),
		css: styles.map(({ source, uri }) => {
			assets.add(source); // XXX: ideally we'd want to move this into converters?
			return uri;
		})
	});
}

export function fragment(article, { isStandalone } = {}) {
	let { metadata, intro } = article;
	let ts = metadata.updated || metadata.created; // NB: design decision
	let timestamp = ts.toISOString().substring(0, 10);
	let date = ts.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	intro = intro === null ? "" : html`<div class="teaser stack">${{
		[RAW]: intro
	}}</div>`;

	let tag = { [RAW]: isStandalone ? "main" : "article" };
	return html`
<${tag} class="article stack">
	<header class="stack">
		<h1>${metadata.title}</h1>
		<p class="metadata">
			by <b>${metadata.author}</b>
			<time${{ datetime: timestamp }}>${date}</time>
		</p>
		${{ [RAW]: intro }}
	</header>
	${{ [RAW]: article.content }}
</${tag}>
	`.trim();
}
