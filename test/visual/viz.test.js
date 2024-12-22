import { BASE_URL } from "./playwright.config.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

let ENTRY_POINT = "/topics";
let OPTIONS = {
	stylePath: join(__dirname, "./viz.tweaks.css")
};

test("all pages", async ({ page }) => {
	await page.goto(ENTRY_POINT);
	const pages = await page.evaluate(extractLinks, BASE_URL);

	await expect(page).toHaveScreenshot(OPTIONS);
	for(let url of pages) {
		await page.goto(url);
		await expect(page).toHaveScreenshot(OPTIONS);
	}
});

function extractLinks(baseURL) {
	let res = new Set();
	for(let { href } of document.links) {
		if(href.startsWith(baseURL)) {
			res.add(href);
		}
	}
	return Array.from(res);
}
