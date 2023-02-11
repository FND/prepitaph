import { document } from "./template.js";
import { renderAll } from "../../ssg/transform.js";
import { iso2date } from "../../ssg/util.js";

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
		// TODO: declarative metadata transformation
		// FIXME: validation required to reduce risk of subtle breakage
		metadata.created = iso2date(metadata.created);
		let { updated } = metadata;
		if(updated) {
			metadata.updated = iso2date(updated);
		}
		metadata.syntax = metadata.syntax === "true";

		this.filepath = filepath;
		this.metadata = metadata;
		this.intro = intro;
		this.content = content;
	}

	async render(context) {
		return document(this, context);
	}
}
