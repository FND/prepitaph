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
		this.filepath = filepath;
		this.metadata = metadata;
		this.intro = intro;
		this.content = content;
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
