export function normalizeURI(uri) {
	return uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri;
}

export function iso2date(value) { // TODO: validation
	let [year, month, day] = value.split("-").
		map(v => parseInt(v, 10));
	return new Date(Date.UTC(year, month - 1, day));
}

// consumes an asynchronous generator, returning either an array or combining
// all items into a string using `joiner`
export async function collect(stream, joiner) {
	let res = [];
	for await (let item of stream) {
		res.push(item);
	}
	return typeof joiner === "string" ? res.join(joiner) : res;
}

export function clone(obj, props) {
	obj = Object.create(obj); // XXX: prototype cascade might be inefficient?
	return Object.assign(obj, props);
}

export class CustomError extends Error {
	constructor(code, message) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
	}
}
