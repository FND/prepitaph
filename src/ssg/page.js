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
		let { format } = this;
		let res = pathPrefix + this.basePath;
		if(format === "html") { // implicit `index.html` via trailing slash
			// guard against spurious trailing slashes when combined with host URL
			return res && res + "/";
		}
		return `${res}index.${format}`;
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

	get format() {
		return this.metadata.format || "html";
	}
}
