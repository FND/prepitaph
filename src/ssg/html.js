export let RAW = Symbol("raw HTML");

export function html(strings, ...values) {
	let i = 0;
	let res = [strings[i]];
	for(let value of values) {
		i++;
		if(typeof value === "number") {
			value = value.toString();
		}
		if(typeof value === "string") {
			res.push(value.replaceAll("&", "&amp;").
				replaceAll("<", "&lt;").
				replaceAll(">", "&gt;"));
		} else if(value !== null && value !== undefined && value !== false) {
			res.push(value[RAW] || serializeAttributes(value));
		}
		res.push(strings[i]);
	}
	return res.join("");
}

export function trustedHTML(...args) {
	return {
		[RAW]: html(...args)
	};
}

function serializeAttributes(attribs) {
	let res = Object.entries(attribs).reduce((memo, [name, value]) => {
		if(!value) {
			return memo;
		}
		value = value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
		return memo.concat(`${name}="${value}"`);
	}, []);
	return res.length === 0 ? "" : [""].concat(res).join(" ");
}
