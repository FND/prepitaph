import { HtmlRenderer, Parser } from "commonmark";

// `smart`, if `true`, activates typographic enhancements
// `fragIDs` allows adding IDs to headings by invoking the provided function, if
// any, with the respective heading's text
// `allowHTML`, if `true`, permits embedding raw HTML
// `resolveURI` allows modifying link and image targets
export async function renderMarkdown(txt,
		{ smart, fragIDs, allowHTML, resolveURI } = {}) {
	let reader = new Parser({ smart });
	let root = reader.parse(txt);
	if(resolveURI) {
		for(let type of ["link", "image"]) {
			visit(root, type, node => {
				node.destination = resolveURI(node.destination, type, node);
			});
		}
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
			return [["id", fragIDs(txt)], ...res];
		};
	}
	return writer.render(root);
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
