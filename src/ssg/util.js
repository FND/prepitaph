export function iso2date(value) { // TODO: validation
	let [year, month, day] = value.split("-").
		map(v => parseInt(v, 10));
	return new Date(Date.UTC(year, month - 1, day));
}
