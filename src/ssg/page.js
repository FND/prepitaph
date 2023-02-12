import { CustomError } from "./util.js";
import { join, parse } from "node:path";

export let INVALID = Symbol("invalid field value");

export class Page {
	constructor(file, metadata, content) {
		this.file = file;
		this.metadata = Object.entries(this.constructor.metadata).
			reduce((memo, [field, convert]) => {
				let value = convert(metadata[field]);
				if(value === INVALID) {
					throw new CustomError("INVALID_CONTENT",
							`invalid \`${field}\` value in \`${file.path}\``);
				}
				memo[field] = value;
				return memo;
			}, {});
		this.content = content;
	}

	uri(pathPrefix) {
		return pathPrefix + this.basePath + "/";
	}

	clone(props) {
		let page = Object.create(this);
		return Object.assign(page, props);
	}

	get basePath() {
		let { slug } = this.metadata;
		if(slug === "NONE") { // XXX: special-casing
			return "";
		}

		let { dir, name } = parse(this.file.localPath);
		return join(dir, slug || name);
	}
}
