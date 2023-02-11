import txtParse from "lampenfieber";

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
		type: segment.type ?? "none", // XXX: rename
		params: segment.params,
		content: segment.content
	};
}
