import { txt2blocks } from "./parser.js";
import { CustomError } from "./util.js";
import colonParse from "metacolon";

export class TextPage {
	static async from(filepath, metadata) {
		let { headers, body } = await colonParse(filepath);
		// flag metadata conflicts (global presets take precedence)
		let _headers = new Set(Object.keys(headers));
		let conflicts = Object.keys(metadata).filter(key => _headers.has(key));
		if(conflicts.length) {
			throw new CustomError("INVALID_CONTENT",
					`metadata in \`${filepath}\` overrides global preset: ` +
					conflicts.map(entry => `\`${entry}\``).join(", "));
		}
		return new this(filepath, { ...headers, ...metadata }, txt2blocks(body));
	}

	constructor(filepath, metadata, blocks) {
		this.filepath = filepath;
		this.metadata = metadata;
		this.content = blocks;
	}
}
