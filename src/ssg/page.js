import { clone, CustomError } from "./util.js";
import { join } from "node:path";

export let INVALID = Symbol("invalid field");

export class Page {
	static fields = {
		slug: {
			isPrivate: true,
			call: value => value || null
		},
		category: value => value || null,
		format: value => value || "html"
	};

	constructor(source, name, metadata, blocks) {
		this.source = source;
		this.name = name;
		this.blocks = blocks;
		// populate fields from metadata
		for(let [field, convert] of Object.entries(this.constructor.fields)) {
			if(Object.hasOwn(this, field)) {
				throw new CustomError("INVALID_CONTENT",
						`invalid metadata \`${field}\` in \`${source}\`: reserved field`);
			}

			let value = Object.hasOwn(convert, "call") ?
				convert.call(metadata[field]) :
				convert(metadata[field]);
			if(value === INVALID) {
				throw new CustomError("INVALID_CONTENT",
						`invalid \`${field}\` value in \`${source}\``);
			}
			this[convert.isPrivate ? `_${field}` : field] = value;
		}

		let path = localPath(this);
		this.localPath = join(...path);
		// NB: `index.html` is implicit via trailing slash
		if(path.at(-1) === "index.html") { // XXX: special-casing
			path = path.slice(0, -1).concat("");
		}
		this._uri = path.join("/");
	}

	render(context) { // TODO: memoize?
		throw new CustomError("NOT_IMPLEMENTED",
				`\`render\` method not implemented for \`${this.constructor.name}\``);
	}

	augmentContext(context) {
		return clone(context, { page: this });
	}

	url(host, pathPrefix) { // TODO: memoize?
		return new URL(`${pathPrefix}/${this._uri}`, host).href;
	}

	get slug() {
		return this._slug || this.name.replaceAll("_", "-"); // NB: design decision
	}
}

function localPath({ slug, category, name, format }) {
	if(category === null) {
		return [`${slug}.${format}`];
	}
	// NB: support for implicit `index.html` via trailing slash in URIs
	if(format === "html") {
		return [category, slug, "index.html"];
	}
	return [category, `${slug}.${format}`];
}
