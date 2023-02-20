import { document, fragment } from "./template.js";
import { Page, INVALID } from "../../ssg/page.js";
import { iso2date, clone } from "../../ssg/util.js";

export class Article extends Page {
	// TODO: stricter validation required to reduce risk of subtle breakage
	static fields = {
		...super.fields,
		title: value => value || INVALID,
		author: value => value || INVALID,
		created: value => value ? iso2date(value) : INVALID,
		updated: value => value ? iso2date(value) : null,
		syntax: value => value === "true"
	};

	constructor(name, metadata, blocks, source, assets) {
		if(blocks[0]?.type === "intro") { // extract intro, if any
			var intro = blocks.shift(); // eslint-disable-line no-var
		}
		super(name, metadata, blocks, source, assets);
		this.intro = intro || null;
	}

	async render(context, { isStandalone = true, includeHost } = {}) {
		context = this.augmentContext(context);
		let { intro } = this;
		let { transformer } = context;
		let page = clone(this, {
			intro: intro && transformer.render([intro], context),
			content: transformer.render(this.blocks, context)
		});
		return isStandalone ? document(page, {
			includeHost,
			assets: context.assets,
			store: context.store,
			config: context.config
		}) : fragment(page, {
			includeHost,
			config: context.config
		});
	}
}
