import { document, fragment } from "./template.js";
import { Page, INVALID } from "../../ssg/page.js";
import { iso2date } from "../../ssg/util.js";

export class Article extends Page {
	// TODO: stricter validation required to reduce risk of subtle breakage
	static metadata = {
		title: value => value || INVALID,
		slug: value => value || null,
		author: value => value || INVALID,
		created: value => value ? iso2date(value) : INVALID,
		updated: value => value ? iso2date(value) : null,
		syntax: value => value === "true",
		category: value => value || null
	};

	static from(doc) {
		let blocks = doc.content;
		if(blocks[0]?.type === "intro") { // extract intro, if any
			var intro = blocks.shift(); // eslint-disable-line no-var
		}
		return new this(doc.file, doc.metadata, intro, blocks);
	}

	constructor(file, metadata, intro = null, content) {
		super(file, metadata, content);
		this.intro = intro;
	}

	async render(context, { isStandalone = true } = {}) {
		let { intro } = this;
		let { transformer } = context;
		let page = this.clone({
			intro: intro && transformer.render([intro], context),
			content: transformer.render(this.content, context)
		});
		return isStandalone ? document(page, context) : fragment(page);
	}
}
