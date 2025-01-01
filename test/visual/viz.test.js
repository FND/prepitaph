import { WIDTH, HEIGHT } from "./playwright.config.js";
import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

let OPTIONS = {
	stylePath: join(__dirname, "./viz.tweaks.css")
};

let sitemap = [];
try {
	sitemap = readSiteMap();
} catch(err) {
	test("site map", ({ page }) => {
		throw new Error("missing site map");
	});
}

for(let url of sitemap) {
	test(`page at ${url}`, async ({ page }) => {
		await checkSnapshot(url, page);
	});
}

async function checkSnapshot(url, page) {
	// determine page height with default viewport
	await page.setViewportSize({
		width: WIDTH,
		height: HEIGHT
	});
	await page.goto(url);
	await page.waitForLoadState("networkidle");
	let height = await page.evaluate(getFullHeight);

	// resize viewport for before snapshotting
	await page.setViewportSize({
		width: WIDTH,
		height: Math.ceil(height)
	});
	await page.waitForLoadState("networkidle");
	await expect(page).toHaveScreenshot(OPTIONS);
}

function getFullHeight() {
	return document.documentElement.getBoundingClientRect().height;
}
