export let RAW = Symbol("raw HTML");

export function html(strings, ...values) {
	let i = 0;
	let res = [strings[i]];
	for(let value of values) {
		i++;
		if(typeof value === "string") {
			res.push(encodeContent(value));
		} else {
			res.push(value[RAW] || serializeAttributes(value));
		}
		res.push(strings[i]);
	}
	return res.join("");
}

function serializeAttributes(attribs) {
	let res = Object.entries(attribs).reduce((memo, [name, value]) => {
		return value ? memo.concat(`${name}="${encodeAttribute(value)}"`) : memo;
	}, []);
	return res.length === 0 ? "" : [""].concat(res).join(" ");
}

// adapted from TiddlyWiki <http://tiddlywiki.com> and Python 3's `html` module

function encodeContent(str) {
	return str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
}

function encodeAttribute(str) {
	return str.replace(/&/g, "&amp;"). // XXX: unnecessary?
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;").
		replace(/"/g, "&quot;").
		replace(/'/g, "&#x27;");
}
