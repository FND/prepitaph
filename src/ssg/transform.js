import { CustomError } from "./util.js";

export class TextTransformer {
	constructor(converters) {
		this.converters = converters instanceof Map ? converters :
			new Map(Object.entries(converters));
	}

	async render(blocks, context) {
		let res = [];
		for await (let chunk of this.renderChunks(blocks, context)) {
			res.push(chunk);
		}
		return res.join("");
	}

	async* renderChunks(blocks, context) {
		for(let block of blocks) {
			let convert = this.converters.get(block.type);
			if(!convert) {
				let msg = "unrecognized content block";
				throw new CustomError("INVALID_CONTENT",
						`${msg} in \`${context.page.file.path}\`: \`${block.type}\``);
			}
			yield convert(block.content, block.params, context);
		}
	}
}
