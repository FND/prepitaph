import { CustomError } from "./util.js";

export class ContentStore {
	constructor() {
		this._byCategory = new Map();
	}

	resolve(specifier) {
		let parts = specifier.split("/");
		switch(parts.length) {
		case 1:
			parts = [null, parts[0]]; // eslint-disable-next-line no-fallthrough
		case 2: {
			let [category, id] = parts;
			let [slug, format] = id.split(".");
			return this.retrieve(category, slug, format || undefined);
		}
		default:
			throw new CustomError("INVALID_REFERENCE",
					`invalid page specifier \`${specifier}\``);
		}
	}

	add(page) {
		let index = this._byCategory;
		let { category } = page;
		let entries = index.get(category);
		if(entries) {
			entries.push(page);
		} else {
			index.set(category, [page]);
		}
	}

	retrieve(category, slug, format = "html") {
		let entries = this._byCategory.get(category);
		if(!entries) {
			throw new CustomError("INVALID_CATEGORY", `no such category:\`${category}\``);
		}
		if(slug === undefined) {
			return entries;
		}

		for(let page of entries) { // XXX: inefficient; use indexing
			if(page.slug === slug && page.format === format) {
				return page;
			}
		}
		throw new CustomError("INVALID_PAGE",
				`invalid page reference \`${category}/${slug}\``);
	}

	* [Symbol.iterator]() {
		for(let pages of this._byCategory.values()) {
			yield* pages;
		}
	}
}
