import { normalizeFilename, clone, CustomError } from "./util.js";
import { join } from "node:path";

let REF_PREFIX = "page://";

export let INVALID = Symbol("invalid field");

export function assertPageReference(uri) {
	if(!isPageReference(uri)) {
		throw new Error(`invalid page reference: \`${uri}\``);
	}
}

export function isPageReference(uri) {
	return uri.startsWith(REF_PREFIX);
}

export function resolvePageReference(uri, context) {
	assertPageReference(uri);
	let [ref, fragID] = uri.slice(REF_PREFIX.length).split("#");
	let page = context.store.resolve(ref);
	let suffix = fragID ? `#${fragID}` : "";
	return page.url(context.config.baseURL).pathname + suffix;
}

export class Page {
	static fields = {
		slug: {
			isPrivate: true,
			call: value => value || null
		},
		category: value => value || null,
		format: value => value || "html"
	};

	constructor(name, metadata, blocks, source, assets = null) {
		this.name = name;
		this.source = source;
		this.assets = assets;
		this.blocks = blocks;
		// populate fields from metadata
		for(let [field, convert] of Object.entries(this.constructor.fields)) {
			if(Object.hasOwn(this, field)) {
				throw new CustomError("INVALID_CONTENT",
						`invalid metadata \`${field}\` in \`${source}\`: reserved field`);
			}

			let value = metadata.get(field);
			value = Object.hasOwn(convert, "call") ? convert.call(value) : convert(value);
			if(value === INVALID) {
				throw new CustomError("INVALID_CONTENT",
						`invalid \`${field}\` value in \`${source}\``);
			}

			if(convert.isPrivate) {
				field = `_${field}`;
			} else if(convert.prop) {
				field = convert.prop;
			}
			this[field] = value;
		}

		let path = localPath(this);
		if(path.at(-2) === "index") { // category index -- XXX: special-casing
			path = path.toSpliced(-2, 1);
			this.categoryIndex = true;
		}
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

	url(baseURL) { // TODO: memoize?
		return new URL(this._uri, baseURL);
	}

	get slug() {
		return this._slug || normalizeFilename(this.name);
	}
}

function localPath({ category, slug, format }) {
	let isHTML = format === "html";
	let root = category === null;
	if(root && isHTML && slug === "index") { // NB: special-casing front page
		return ["index.html"];
	}
	let res = isHTML ? [slug, "index.html"] : [`${slug}.${format}`];
	return root ? res : [category, ...res];
}
