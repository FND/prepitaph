import { document } from "./template.js";
import { iso2date, CustomError } from "../../ssg/util.js";

let INVALID = Symbol("invalid field value");
let METADATA = { // TODO: stricter validation required to reduce risk of subtle breakage
	title: value => value || INVALID,
	slug: value => value || null,
	author: value => value || INVALID,
	created: value => value ? iso2date(value) : INVALID,
	updated: value => value ? iso2date(value) : null,
	syntax: value => value === "true",
	category: value => value || null
};

export class Article {
	static from(doc) {
		let blocks = doc.content;
		if(blocks[0]?.type === "intro") { // extract intro, if any
			var intro = blocks.shift(); // eslint-disable-line no-var
		}
		return new this(doc.file, doc.metadata, intro, blocks);
	}

	constructor(file, metadata, intro = null, content) {
		this.file = file;
		this.metadata = Object.entries(METADATA).reduce((memo, [field, convert]) => {
			let value = metadata[field];
			value = convert(value);
			if(value === INVALID) {
				throw new CustomError("INVALID_CONTENT",
						`invalid \`${field}\` value in \`${file.path}\``);
			}
			memo[field] = value;
			return memo;
		}, {});
		this.intro = intro;
		this.content = content;
	}

	async render(context) {
		let { intro } = this;
		let { transformer } = context;
		let page = Object.create(this);
		page = Object.assign(page, {
			intro: intro && transformer.render([intro], context),
			content: transformer.render(this.content, context)
		});
		return document(page, context);
	}
}
