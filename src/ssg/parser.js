import { CustomError } from "./util.js";
import txtParse from "lampenfieber";
import colonParse from "metacolon";

export async function file2doc(file, metadata) {
	let { headers, body } = await colonParse(file.path);

	// flag conflicting metadata
	let fields = new Set(Object.keys(headers));
	let conflicts = Object.keys(metadata).filter(key => fields.has(key));
	if(conflicts.length) {
		throw new CustomError("INVALID_CONTENT",
				`metadata in \`${file.path}\` overrides global preset: ` +
				conflicts.map(entry => `\`${entry}\``).join(", "));
	}

	return {
		file,
		metadata: { ...headers, ...metadata },
		content: txt2blocks(body)
	};
}

export function txt2blocks(content) {
	// XXX: could be more efficient if Lampenfieber used `yield` instead
	return txtParse(content).map(normalizeBlock);
}

function normalizeBlock(segment) {
	return typeof segment === "string" ? {
		type: "default",
		params: {},
		content: segment
	} : {
		type: segment.type ?? "NONE", // XXX: rename
		params: segment.params,
		content: segment.content
	};
}
