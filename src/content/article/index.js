import { document } from "./template.js";
import { renderAll } from "../../ssg/transform.js";
import { iso2date, CustomError } from "../../ssg/util.js";

let INVALID = Symbol("invalid field value");
let METADATA = { // TODO: stricter validation required to reduce risk of subtle breakage
	title: value => value || INVALID,
	slug: value => value || null,
	author: value => value || INVALID,
	created: value => value ? iso2date(value) : INVALID,
	updated: value => value ? iso2date(value) : null,
	syntax: value => value === "true",
	category: value => value || null,
	localPath: value => value || null
};

export class Article {
	static async from(page, transformer) {
		let blocks = page.content;
		let context = { page, transformer };
		if(blocks[0]?.type === "intro") { // extract intro, if any
			var intro = blocks.shift(); // eslint-disable-line no-var
			intro = await renderAll([intro], context, transformer);
		}
		return new this(page.filepath, page.metadata, intro,
				await renderAll(blocks, context, transformer));
	}

	constructor(filepath, metadata, intro = null, content) {
		this.filepath = filepath;
		this.metadata = Object.entries(METADATA).reduce((memo, [field, convert]) => {
			let value = metadata[field];
			value = convert(value);
			if(value === INVALID) {
				throw new CustomError("INVALID_CONTENT",
						`invalid \`${field}\` value in \`${filepath}\``);
			}
			memo[field] = value;
			return memo;
		}, {});
		this.intro = intro;
		this.content = content;
	}

	async render(context) {
		return document(this, context);
	}
}
