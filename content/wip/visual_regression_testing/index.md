title: Visual Regression Testing
tags: web, testing, unlisted
author: FND
created: 2024-12-23
syntax: true

```intro
Comparing visual artifacts can be a powerful approach to automated testing.
Playwright makes this surprisingly straightforward for websites.
```

To my chagrin, [prepitaph's style sheet](/assets/main.css) suffers from
predictable issues: ~500 lines of organically grown CSS. While certainly not
chaotic, it's still a bit of a maintenance headache and overdue for some
refactoring -- especially with the advent of
[CSS nesting](page://snippets/css-nesting-esbuild), plus we now have a good idea
of our [authoring components](page://articles/authoring). More importantly,
cleaner foundations should make it easier to introduce a dark mode so we can
finally respect users' preferred color scheme.

Being of the apprehensive persuasion[tense](footnote://), I was reluctant to
make large changes for fear of unwittingly introducing bugs. After vacillating
for a while[snapshot-testing](footnote://), I've turned to visual regression
testing to establish a reliable baseline for such refactoring efforts.

```footnote tense
mkhl
[aptly described](https://social.treehouse.systems/@mkhl/112992725181551392)
this condition as "assigned tense at birth"
```

```footnote snapshot-testing
Snapshot testing is notoriously brittle, as results are influenced by a
multitude of factors which might not always be fully controllable. It
additionally requires maintaining state between test runs as we're comparing
results against a baseline that's not described by the test itself.
```

Fortunately, I had vague recollections of past research and quickly rediscovered
[Playwright's built-in visual comparison](https://playwright.dev/docs/test-snapshots).
Playwright itself is also [light on dependencies](page://wip/web-devspair#npm).
Nevertheless, the recommended setup with `npm init playwright@latest` emitted
too much barf for my minimalist taste (unnecessary sample files, CommonJS
instead of ESM etc.), so I set everything up from scratch instead:

In this case, I expect snapshot testing to only be used on special occasions, so
I wanted to isolate everthing in a dedicated folder `./test/visual`; that will
be our working directory from here on out.

```figure filename=package.json
'''json
{
    "scripts": {
        "test": "playwright test",
        "report": "playwright show-report",
        "update": "playwright test --update-snapshots",
        "reset": "rm -r ./playwright-report ./test-results ./viz.test.js-snapshots || true"
    },
    "devDependencies": {
        "@playwright/test": "^1.49.1"
    }
}
'''
```

```aside compact
I don't like having `node_modules` directories hidden in some subdirectory, so I
never actually run `npm install` there. Because I also don't want to burden the
root project with this rarely-used dependency though, I resort to invoking
`npm install --no-save @playwright/test` in the root directory when needed.
YMMV.
```

With that in place, `npx playwright install` serves to download a range of
headless browsers.

Playwright then needs a configuration file to define the test environment:

```figure filename=playwright.config.js
'''javascript
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
'''
```

Here we expect our website to already reside within the root directory's `dist`
folder and to be served at localhost:8000 (I prefer Python because that's
[universally available](https://en.wikipedia.org/wiki/Linux_Standard_Base)).
I've included a range of browsers for illustration purposes, but we might trim
this down to speed things up a bit. Similarly, continuous integration is
[YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) for my
scenario, so the whole `IS_CI` dance might be discarded.

That leaves the actual test file, which we want to be a simplistic crawler that
gathers all local URLs before comparing snapshots for each. Fortunately we can
rely on our [topics page](page://topics) to provide a comprehensive index of all
pages:

```figure filename=viz.test.js
'''javascript
import { BASE_URL } from "./playwright.config.js";
import { test, expect } from "@playwright/test";
import { join } from "node:path";

let ENTRY_POINT = "/topics";

test("all pages", async ({ page }) => {
    await page.goto(ENTRY_POINT);
    const pages = await page.evaluate(extractLinks, BASE_URL);

    await expect(page).toHaveScreenshot();
    for(let url of pages) {
        await page.goto(url);
        await expect(page).toHaveScreenshot();
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
'''
```

`npm test` executes this little test suite. The initial run always fails because
it only creates the baseline snapshots against which subsequent runs compare
their results.

Because some of our demos have randomized content, we inject a custom style
sheet to ignore those parts entirely:

```figure filename=viz.tweaks.css
'''css
/* suppress randomness */
iframe[src$="/articles/signals-reactivity/demo.html"] {
    visibility: hidden;
}
'''
```

```figure filename=viz.test.js
'''javascript
let OPTIONS = {
    stylePath: join(__dirname, "./viz.tweaks.css")
};
// …
        await expect(page).toHaveScreenshot(OPTIONS);
'''
```

```aside compact
`__dirname` is available despite our file being ESM; apparently some Babel
shenanigans are happening behind the scenes; using `import.meta` resulted in a
confusing exception.
```

I'll leave you with a sample of randomness-induced deviations in a
[signals demo](page://snippets/css-nesting-esbuild) resulting in test failures:

```figure img=./sample.png lazy caption
sample image of randomness-induced deviations
```
