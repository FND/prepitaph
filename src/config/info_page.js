import layout from "./layout.js";
import { Page, INVALID } from "../ssg/page.js";
import { html, RAW } from "../ssg/html.js";

export class InfoPage extends Page {
	static fields = {
		...super.fields,
		title: value => value === "NONE" ? null : // XXX: special-casing
			(value || INVALID)
	};

	async render(context) {
		context = this.augmentContext(context);
		let { config } = context;
		if(this.format === "atom") { // XXX: special-casing
			context.selfURL = this.url(config.baseURL).href;
			return context.transformer.render(this.blocks, context);
		}

		let { title } = this;
		return layout({
			title: title || {
				isStandalone: true,
				text: config.siteTitle
			},
			content: html`<main class="stack">${title && {
				[RAW]: html`<h1>${title}</h1>`
			}}${{
				[RAW]: await context.transformer.render(this.blocks, context)
			}}</main>`,
			css: context.assets.register(config.css.default),
			store: context.store,
			config
		});
	}
}
