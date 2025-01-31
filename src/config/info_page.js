import layout from "./layout.js";
import { INVALID, Page } from "../ssg/page.js";
import { html, RAW } from "../ssg/html.js";

export class InfoPage extends Page {
	static fields = {
		...super.fields,
		title: (value) => value === "NONE" ? null : (value || INVALID), // XXX: special-casing
	};

	async render(context) {
		context = this.augmentContext(context);
		let { assets, config } = context;
		if (this.format === "atom") { // XXX: special-casing
			context.selfURL = this.url(config.baseURL).href;
			return context.transformer.render(this.blocks, context);
		}

		let { title } = this;
		return layout({
			title: title || {
				isStandalone: true,
				text: config.siteTitle,
			},
			// deno-fmt-ignore
			content: html`<main class="stack">${title && {
				[RAW]: html`<h1>${title}</h1>`
			}}${{
				[RAW]: await context.transformer.render(this.blocks, context)
			}}</main>`,
			css: assets.register(config.css.default),
			assets,
			store: context.store,
			config,
		});
	}
}
