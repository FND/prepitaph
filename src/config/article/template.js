import layout from "../layout.js";
import { html, trustedHTML, RAW } from "../../ssg/html.js";

let TOPICS_LINK; // NB: cached; assumed to be identical for all articles

export async function renderArticle(article, { assets, store, config }, options) {
	let isDocument = options.isDocument = options.isDocument !== false; // normalize
	let html = render(article, { store, config }, options);
	if(isDocument === false) {
		return html;
	}

	let { css } = config;
	let styles = article.syntax ? css.default.concat(css.syntax) : css.default;
	assets.register(config.js.embed);
	return layout({
		title: article.title,
		author: article.author,
		teaser: await (article.intro ?? article.teaser)?.
			then(teaser => teaser?.
				// NB: parsing HTML the Cthulhu way seems acceptable here
				replace(/<[A-Za-z/][^>]*>/g, "").replace(/\s+/g, " ").trim()),
		canonicalURL: article.canonicalURL,
		redirectURI: article.redirectURI,
		content: await html.then(injectPermalinks),
		css: assets.register(styles),
		assets,
		store,
		config
	});
}

async function render(article, context,
		{ isDocument, heading, metadata, teaser, main }) {
	let { store, config } = context;
	let { baseURL } = config;
	if(heading !== false) {
		let tag = isDocument === false ? "h2" : "h1";
		heading = trustedHTML`<${tag}><a${{
			href: article.url(baseURL).pathname
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
		let url = store.retrieve(article.category, "index"). // TODO: memoize?
			url(baseURL).pathname;
		metadata = trustedHTML`
			${article.renderType(url)}
			<p class="metadata">
				by <b>${article.author}</b>
				<time${{ datetime }}>${date}</time>
			</p>
		`;
	}

	if(main !== false && article.teaser) { // avoid duplication -- XXX: special-casing
		teaser = false;
	}
	teaser = teaser !== false && (article.intro ?? article.teaser);
	teaser &&= trustedHTML`<div class="teaser stack">${{
		[RAW]: await teaser
	}}</div>`;

	if(heading !== false || metadata !== false || teaser !== false) {
		// eslint-disable-next-line no-var
		var header = trustedHTML`<header>
			${heading}
			${metadata}
			${teaser}
		</header>`;
	}

	if(main !== false) {
		let { baseURL } = config;
		if(!TOPICS_LINK) {
			TOPICS_LINK = trustedHTML`<a${{
				href: store.retrieve(null, "topics").url(baseURL).pathname
			}}>topics</a>`;
		}

		let content = await article.content;
		main = {
			[RAW]: content + renderFooter(article, store, config, baseURL)
		};
	}

	let tag = {
		[RAW]: isDocument === false ? "article" : "main"
	};
	let { typeIdentifier } = article;
	return html`
<${tag}${{
	class: [...new Set([typeIdentifier, "article", "stack"])].join(" "),
	style: `--vt-name: ${typeIdentifier}-${article.slug}`
}}>
	${header}
	${main}
</${tag}>
	`.trim();
}

function renderFooter(article, store, config, baseURL) { // TODO: memoize
	let authorURL = config.AUTHORS.get(article.author).url;
	let contactURL = store.retrieve(null, "colophon").url(baseURL).pathname;
	return html`
<footer>
	${TOPICS_LINK}: ${article.tags.join(", ")}
	<p class="feedback">
		For feedback, feel free to <a${{ href: contactURL }}>send an e-mail</a>
		or contact the author <a${{ href: authorURL }}>via social media</a>.
	</p>
</footer>
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
