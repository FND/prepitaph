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

export class CustomError extends Error {
	constructor(code, message) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
	}
}
