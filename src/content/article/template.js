import layout from "../layout.js";
import { encodeContent as html, encodeAttribute as attr } from "../../ssg/html.js";

export function document(article) {
	return layout({
		title: article.metadata.title,
		content: fragment(article, { isStandalone: true })
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
