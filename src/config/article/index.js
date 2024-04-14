import { renderArticle } from "./template.js";
import { InfoPage } from "../info_page.js";
import { Page, INVALID } from "../../ssg/page.js";
import { trustedHTML } from "../../ssg/html.js";
import { iso2date, clone } from "../../ssg/util.js";

export class Article extends Page {
	static type = "article";

	// TODO: stricter validation required to reduce risk of subtle breakage
	static fields = {
		...super.fields,
		title: value => value || INVALID,
		tags: value => value ? value.split(/, +/) : INVALID,
		author: value => value || INVALID,
		created: value => value ? iso2date(value) : INVALID,
		updated: value => value ? iso2date(value) : null,
		canonical: {
			prop: "canonicalURL",
			call: value => value || null
		},
		syntax: value => value === "true"
	};

	constructor(name, metadata, blocks, source, assets) {
		if(blocks[0]?.type === "intro") { // extract intro, if any
			var intro = blocks.shift(); // eslint-disable-line no-var
		}
		super(name, metadata, blocks, source, assets);
		this.intro = intro || null;
	}

	async render(context, options = {}) {
		if(this.categoryIndex) {
			// XXX: switching to a different class is very awkward and brittle
			return InfoPage.prototype.render.call(this, context);
		}

		context = this.augmentContext(context);
		context.footnotes = []; // XXX: hacky

		let { transformer } = context;
		let intro = options.intro !== false && this.intro;
		let page = clone(this, {
			intro: intro && transformer.render([intro], context),
			content: options.main !== false && transformer.render(this.blocks, context)
		});

		return renderArticle(page, {
			assets: context.assets,
			store: context.store,
			config: context.config
		}, options);
	}

	renderType() {
		let { type, symbol } = this.constructor;
		return type !== Article.type && trustedHTML`<small class="content-type"${{
			"data-type": symbol
		}}>${type}</small>`;
	}

	get typeIdentifier() {
		let { type } = this.constructor;
		if(/[^a-z0-9 -]/.test(type)) { // just to be safe
			throw new Error(`invalid type: \`${type}\``);
		}
		return type.replaceAll(" ", "-");
	}
}
