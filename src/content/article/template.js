import layout from "../layout.js";
import { encodeContent as html, encodeAttribute as attr } from "../../ssg/html.js";
import config from "../../config.js";

export function document(article, { assets }) {
	let { css } = config;
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
	let { metadata } = article;
	let ts = metadata.updated || metadata.created; // NB: design decision
	let timestamp = ts.toISOString().substring(0, 10);
	let date = ts.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});
	let tag = isStandalone ? "main" : "article";
	let intro = article.intro;
	return `
<${tag} class="article stack">
	<header class="stack">
		<h1>${html(metadata.title)}</h1>
		<p class="metadata">
			by <b>${html(metadata.author)}</b>
			<time datetime="${attr(timestamp)}">${html(date)}</time>
		</p>
		${!intro ? "" : `<div class="teaser stack">${intro}</div>`}
	</header>
	${article.content}
</${tag}>
	`.trim();
}
