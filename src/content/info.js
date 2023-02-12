import layout from "./layout.js";
import { Page, INVALID } from "../ssg/page.js";
import { html, RAW } from "../ssg/html.js";
import { siteTitle, css } from "../config.js";

export class InfoPage extends Page {
	static metadata = { // XXX: partially duplicates `Article`
		title: value => {
			if(value === "NONE") {
				return null;
			}
			return value || INVALID;
		},
		slug: value => value || null,
		category: value => value || null
	};

	static async from(doc) {
		return new this(doc.file, doc.metadata, doc.content);
	}

	async render(context) {
		let { title } = this.metadata;
		return layout({
			title: title || {
				isStandalone: true,
				text: siteTitle
			},
			content: html`<main class="stack">${{
				[RAW]: await context.transformer.render(this.content, context)
			}}</main>`,
			css: context.assets.register(css.default)
		});
	}
}
