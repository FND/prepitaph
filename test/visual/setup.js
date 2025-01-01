import { ENTRY_POINT, BASE_URL, BROWSERS } from "./playwright.config.js";
import { createSiteMap, readSiteMap } from "./sitemap.js";
import playwright from "@playwright/test";

export default async function globalSetup(config) {
	// only create site map if it doesn't already exist
	try {
		readSiteMap();
		return;
	} catch(err) {}

	// launch browser and initiate crawler
	let browser = playwright.devices[BROWSERS[0]].defaultBrowserType;
	browser = await playwright[browser].launch();
	let page = await browser.newPage();
	await createSiteMap(BASE_URL + ENTRY_POINT, BASE_URL, page);
	await browser.close();
}
