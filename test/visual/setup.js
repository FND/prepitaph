import { BASE_URL, BROWSERS, ENTRY_POINT } from "./playwright.config.js";
import { createSiteMap, readSiteMap } from "./sitemap.js";
import playwright from "@playwright/test";

export default async function globalSetup(_config) {
	// only create site map if it doesn't already exist
	try {
		readSiteMap();
		return; // deno-lint-ignore no-empty
	} catch (_err) {}

	// launch browser and initiate crawler
	let browser = playwright.devices[BROWSERS[0]].defaultBrowserType;
	browser = await playwright[browser].launch();
	let page = await browser.newPage();
	await createSiteMap(BASE_URL + ENTRY_POINT, BASE_URL, page);
	await browser.close();
}
