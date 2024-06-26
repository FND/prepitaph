import layout from "../layout.js";
import { html, trustedHTML, RAW } from "../../ssg/html.js";

let TOPICS_LINK; // NB: cached; assumed to be identical for all articles

export async function renderArticle(article, { assets, store, config }, options) {
	let isDocument = options.isDocument = options.isDocument !== false; // normalize
	let html = render(article, { store, config }, options);
	if(isDocument === false) {
		return html;
	}

	let summary = await article.intro;
	if(summary) { // NB: parsing HTML the Cthulhu way seems acceptable here
		summary = summary.replace(/<[A-Za-z/][^>]*>/g, "").replace(/\s+/g, " ").trim();
	}
	let { css } = config;
	let styles = article.syntax ? css.default.concat(css.syntax) : css.default;
	assets.register(config.js.embed);
	return layout({
		title: article.title,
		summary,
		canonicalURL: article.canonicalURL,
		content: await html.then(injectPermalinks),
		css: assets.register(styles),
		assets,
		store,
		config
	});
}

async function render(article, context,
		{ isDocument, heading, metadata, intro, main }) {
	if(heading !== false) {
		let tag = isDocument === false ? "h2" : "h1";
		heading = trustedHTML`<${tag}><a${{
			href: article.url(context.config.baseURL).pathname
		}}>${article.title}</a></${tag}>`;
	}

	if(metadata !== false) {
		let ts = article.updated || article.created; // NB: design decision
		let datetime = ts.toISOString().slice(0, 10);
		let date = ts.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
		metadata = trustedHTML`
			${article.renderType()}
			<p class="metadata">
				by <b>${article.author}</b>
				<time${{ datetime }}>${date}</time>
			</p>
		`;
	}

	intro = intro !== false && article.intro;
	if(intro) {
		intro = trustedHTML`<div class="teaser stack">${{
			[RAW]: await intro
		}}</div>`;
	}

	if(heading !== false || metadata !== false || intro !== false) {
		// eslint-disable-next-line no-var
		var header = trustedHTML`<header>
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
<${tag}${{
	class: [...new Set([article.typeIdentifier, "article", "stack"])].join(" ")
}}>
	${header}
	${main}
</${tag}>
	`.trim();
}

function injectPermalinks(html) {
	return html + `
<script class="nonvisual">
document.querySelectorAll(":is(h2, h3, h4, h5, h6)[id]").forEach(node => {
	let link = document.createElement("a");
	link.href = "#" + node.id;
	link.className = "permalink";
	link.setAttribute("aria-label", "permalink");
	link.textContent = "#";
	node.append(document.createTextNode(" "), link);
});
</script>
	`.trim();
}
