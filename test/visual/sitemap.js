import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let SITEMAP = join(__dirname, "./sitemap.json"); // XXX: use environment variable?

let UTF8 = { encoding: "utf-8" };

export async function createSiteMap(url, baseURL, page) {
	await page.goto(url);
	let urls = await page.evaluate(extractLocalLinks, baseURL);
	let data = JSON.stringify(urls, null, 4);
	writeFileSync(SITEMAP, data, UTF8);
}

export function readSiteMap() {
	try { // deno-lint-ignore no-var no-inner-declarations
		var data = readFileSync(SITEMAP, UTF8);
	} catch (err) {
		if (err.code === "ENOENT") {
			throw new Error("missing site map");
		}
		throw err;
	}
	return JSON.parse(data);
}

function extractLocalLinks(baseURL) {
	let res = new Set();
	let offset = baseURL.length;
	for (let { href } of document.links) {
		if (href.startsWith(baseURL)) {
			res.add(href.slice(offset));
		}
	}
	return Array.from(res);
}
