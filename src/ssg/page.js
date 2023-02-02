import txtParse from "lampenfieber";
import colonParse from "metacolon";

export class TextPage {
	static async from(filepath, metadata) {
		let { headers, body } = await colonParse(filepath);
		// flag metadata conflicts (global presets take precedence)
		let _headers = new Set(Object.keys(headers));
		let conflicts = Object.keys(metadata).filter(key => _headers.has(key));
		if(conflicts.length) {
			throw new Error(`metadata in \`${filepath}\` overrides global preset: ` +
				conflicts.map(entry => `\`${entry}\``).join(", "));
		}
		return new this(filepath, { ...headers, ...metadata },
				txtParse(body).map(normalizeBlock));
	}

	constructor(filepath, metadata, blocks) {
		this.filepath = filepath;
		this.metadata = metadata;
		this.content = blocks;
	}
}

function normalizeBlock(segment) {
	return typeof segment === "string" ? {
		type: "default",
		params: {},
		content: segment
	} : {
		type: segment.type ?? "default",
		params: segment.params,
		content: segment.content
	};
}
