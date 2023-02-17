import { CustomError } from "./util.js";

export class ContentStore {
	constructor() {
		this._byCategory = new Map();
		this._bySpecifier = new Map();
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
		this._bySpecifier.set(`${category || ""}/${page.slug}.${page.format}`, page);

		let entries = index.get(category);
		if(entries) {
			entries.push(page);
		} else {
			index.set(category, [page]);
		}
	}

	retrieve(category, slug, format = "html") {
		if(slug === undefined) {
			let entries = this._byCategory.get(category);
			if(!entries) {
				throw new CustomError("INVALID_CATEGORY",
						`no such category:\`${category}\``);
			}
			return entries;
		}

		let specifier = `${category || ""}/${slug}.${format}`;
		let page = this._bySpecifier.get(specifier);
		if(!page) {
			throw new CustomError("INVALID_SPECIFIER", `no such page: \`${specifier}\``);
		}
		return page;
	}

	* [Symbol.iterator]() {
		for(let pages of this._byCategory.values()) {
			yield* pages;
		}
	}
}
