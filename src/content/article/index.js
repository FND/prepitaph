import { document } from "./template.js";
import { iso2date } from "../../ssg/util.js";

export class Article {
	static async from(page, transformer) {
		let blocks = page.content;
		// extract intro, if any
		if(blocks[0]?.type === "intro") {
			var [intro, ...content] = blocks; // eslint-disable-line no-var
			intro = await render([intro], page, transformer);
			content = await render(content, page, transformer);
		} else {
			content = await render(blocks, page, transformer);
		}
		return new this(page.filepath, page.metadata, intro, content);
	}

	constructor(filepath, metadata, intro, content) {
		// TODO: declarative metadata transformation
		// FIXME: validation required to reduce risk of subtle breakage
		metadata.created = iso2date(metadata.created);
		let { updated } = metadata;
		if(updated) {
			metadata.updated = iso2date(updated);
		}

		this.filepath = filepath;
		this.metadata = metadata;
		this.intro = intro;
		this.content = content;
	}

	async render() {
		return document(this);
	}
}

// XXX: smell
async function render(blocks, context, transformer) {
	let res = [];
	for await (let chunk of transformer.render(blocks, context)) {
		res.push(chunk);
	}
	return res.join("");
}
