// XXX: smell
export async function renderAll(blocks, context, transformer) {
	let res = [];
	for await (let chunk of transformer.render(blocks, context)) {
		res.push(chunk);
	}
	return res.join("");
}

export class TextTransformer {
	constructor(converters) {
		this.converters = converters instanceof Map ? converters :
			new Map(Object.entries(converters));
	}

	async* render(blocks, context) {
		for(let block of blocks) {
			let convert = this.converters.get(block.type);
			if(!convert) {
				let msg = "unrecognized content block in";
				throw new Error(`${msg} \`${context.page.filepath}\`: \`${block.type}\``);
			}
			yield convert(block.content, block.params, context);
		}
	}
}
