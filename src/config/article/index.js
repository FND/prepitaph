import { renderArticle } from "./template.js";
import { Page, INVALID } from "../../ssg/page.js";
import { iso2date, clone } from "../../ssg/util.js";

export class Article extends Page {
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
}
