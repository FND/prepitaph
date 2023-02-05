// adapted from TiddlyWiki <http://tiddlywiki.com> and Python 3's `html` module

export function encodeContent(str) {
	return str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
}

export function encodeAttribute(str) {
	return str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;").
		replace(/"/g, "&quot;").
		replace(/'/g, "&#x27;");
}
