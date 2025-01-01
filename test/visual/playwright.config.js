import { defineConfig, devices } from "@playwright/test";

export let ENTRY_POINT = "/topics";
export let BASE_URL = "http://localhost:8000";
export let BROWSERS = ["Desktop Firefox", "Desktop Chrome", "Desktop Safari"];
export let WIDTH = 800;
export let HEIGHT = WIDTH;
let SERVER = "cd ../../dist && python3 -m http.server";

let IS_CI = !!process.env.CI;

export default defineConfig({
	testDir: "./",
	fullyParallel: true,
	forbidOnly: IS_CI,
	retries: 2,
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
	globalSetup: require.resolve("./setup.js"),
	projects: BROWSERS.map(ua => ({
		name: ua.toLowerCase().replaceAll(" ", "-"),
		use: {
			...devices[ua],
			viewport: {
				width: WIDTH,
				height: HEIGHT
			}
		}
	}))
});
