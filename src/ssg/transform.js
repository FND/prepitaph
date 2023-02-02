export class TextTransformer {
	constructor(converters) {
		this.converters = converters instanceof Map ? converters :
			new Map(Object.entries(converters));
	}

	async* render(blocks, context) {
		for(let block of blocks) {
			let convert = this.converters.get(block.type);
			if(!convert) {
				let msg = "unrecognized content block";
				throw new Error(`${msg} in \`${context.filepath}\`: \`${block.type}\``);
			}
			yield convert(block.content, block.params, context);
		}
	}
}
