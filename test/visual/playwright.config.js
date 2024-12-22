import { defineConfig, devices } from "@playwright/test";

export let BASE_URL = "http://localhost:8000";
let SERVER = "cd ../../dist && python3 -m http.server";
let BROWSERS = [{
	name: "firefox",
	use: { ...devices["Desktop Firefox"] }
}, {
	name: "chromium",
	use: { ...devices["Desktop Chrome"] }
}, {
	name: "webkit",
	use: { ...devices["Desktop Safari"] }
}];

let IS_CI = !!process.env.CI;

export default defineConfig({
	testDir: "./",
	fullyParallel: true,
	forbidOnly: IS_CI,
	retries: IS_CI ? 2 : 0,
	workers: IS_CI ? 1 : undefined,
	reporter: "html",
	webServer: {
		command: SERVER,
		url: BASE_URL,
		reuseExistingServer: !IS_CI
	},
	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry"
	},
	projects: BROWSERS
});
