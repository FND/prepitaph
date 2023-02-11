export function iso2date(value) { // TODO: validation
	let [year, month, day] = value.split("-").
		map(v => parseInt(v, 10));
	return new Date(Date.UTC(year, month - 1, day));
}

export class CustomError extends Error {
	constructor(code, message) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
	}
}
