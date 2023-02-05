// `smart`, if `true`, activates typographic enhancements
// `fragIDs` adds IDs to headings, generated either automatically (if `true`) or
// by invoking a function with the respective heading's text
// `allowHTML`, if `true`, permits embedding raw HTML
// `resolveURI` allows modifying link targets
export async function render(txt, { smart = true, fragIDs, allowHTML, resolveURI } = {}) {
	let { HtmlRenderer, Parser } = await import("commonmark");

	let reader = new Parser({ smart });
	let root = reader.parse(txt);
	if(resolveURI) {
		visit(root, "link", node => {
			node.destination = resolveURI(node.destination);
		});
	}

	let writer = new HtmlRenderer({ safe: !allowHTML });
	if(fragIDs) {
		let { attrs } = writer;
		writer.attrs = function(node) {
			let res = attrs.call(this, node);
			if(node.type !== "heading") {
				return res;
			}

			let txt = "";
			visit(node, "text", node => {
				txt += node.literal;
			});
			let id = fragIDs.call ? fragIDs(txt) : idify(txt);
			return [["id", id], ...res];
		};
	}
	return writer.render(root);
}

function idify(txt) {
	return txt.replace(/\s/g, "-").toLowerCase();
}

function visit(node, type, callback) {
	let walker = node.walker();
	let event = walker.next();
	while(event) {
		let { node } = event;
		if(event.entering && node.type === type) {
			callback(node);
		}
		event = walker.next();
	}
}
