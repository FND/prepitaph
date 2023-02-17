import { CustomError } from "./util.js";

export class ContentStore {
	constructor() {
		this._byCategory = new Map();
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

	retrieve(category) {
		let entries = this._byCategory.get(category);
		if(!entries) {
			throw new CustomError("INVALID_CATEGORY", `no such category:\`${category}\``);
		}
		return entries;
	}

	* [Symbol.iterator]() {
		for(let pages of this._byCategory.values()) {
			yield* pages;
		}
	}
}
