import layout from "../layout.js";
import { html, trustedHTML, RAW } from "../../ssg/html.js";

let TOPICS_LINK; // NB: cached; assumed to be identical for all articles

export async function renderArticle(article, { assets, store, config }, options) {
	let html = render(article, { store, config }, options);
	if(options.isDocument === false) {
		return html;
	}

	let { css } = config;
	let styles = article.syntax ? css.default.concat(css.syntax) : css.default;
	return layout({
		title: article.title,
		summary: await article.intro,
		canonicalURL: article.canonicalURL,
		content: await html,
		css: assets.register(styles),
		assets,
		store,
		config
	});
}

async function render(article, context,
		{ isDocument, heading, metadata, intro, main }) {
	if(heading !== false) {
		heading = isDocument ?
			trustedHTML`<h1>${article.title}</h1>` :
			trustedHTML`<h2><a${{
				href: article.url(context.config.baseURL).pathname
			}}>${article.title}</a></h2>`;
	}

	if(metadata !== false) {
		let ts = article.updated || article.created; // NB: design decision
		let datetime = ts.toISOString().substring(0, 10);
		let date = ts.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
		metadata = trustedHTML`<p class="metadata">
			by <b>${article.author}</b>
			<time${{ datetime }}>${date}</time>
		</p>`;
	}

	intro = intro !== false && article.intro;
	if(intro) {
		intro = trustedHTML`<div class="teaser stack">${{
			[RAW]: await intro
		}}</div>`;
	}

	if(heading !== false || metadata !== false || intro !== false) {
		// eslint-disable-next-line no-var
		var header = trustedHTML`<header class="stack">
			${heading}
			${metadata}
			${intro}
		</header>`;
	}

	if(main !== false) {
		if(!TOPICS_LINK) {
			TOPICS_LINK = trustedHTML`<a${{
				href: context.store.retrieve(null, "topics").
					url(context.config.baseURL).pathname
			}}>topics</a>`;
		}

		let content = await article.content;
		let tags = article.tags.join(", ");
		main = {
			[RAW]: content + html`<footer>${TOPICS_LINK}: ${tags}</footer>`
		};
	}

	let tag = {
		[RAW]: isDocument === false ? "article" : "main"
	};
	return html`
<${tag} class="article stack">
	${header}
	${main}
</${tag}>
	`.trim();
}
