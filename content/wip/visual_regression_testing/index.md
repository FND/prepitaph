title: Visual Regression Testing
tags: web, testing
author: FND
created: 2025-01-01
syntax: true
canonical: https://css-tricks.com/automated-visual-regression-testing-with-playwright/

```infobox
This article ended up being
[published via CSS-Tricks](https://css-tricks.com/automated-visual-regression-testing-with-playwright/)
under a different title, improved thanks the editorial expertise of
[Geoff Graham](https://geoffgraham.me). This draft version is archived here for
historical purposes.
```

```teaser
Comparing visual artifacts can be a powerful, if fickle, approach to automated
testing. Playwright makes this seem simple, but the details might take a little
finessing.
```

To my chagrin, [prepitaph's style sheet](/assets/main.css) suffers from
predictable issues: Those ~500 lines of organically grown CSS might not be
chaotic, but they've still turned into a bit of a maintenance headache. So
they're overdue for some refactoring -- especially with the advent of
[CSS nesting](page://snippets/css-nesting-esbuild), plus we now have a good idea
of our [authoring components](page://articles/authoring). More importantly,
cleaner foundations should make it easier to introduce a dark mode so we finally
respect users' preferred color scheme.

Being of the apprehensive persuasion[tense](footnote://), I was reluctant to
make large changes for fear of unwittingly introducing bugs. After vacillating
for a while[snapshot-testing](footnote://), I turned to visual regression
testing to establish a reliable baseline for such refactoring efforts.

```footnote tense
mkhl
[aptly described](https://social.treehouse.systems/@mkhl/112992725181551392)
this condition as "assigned tense at birth".
```

```footnote snapshot-testing
Snapshot testing is notoriously brittle, as results are influenced by a
multitude of factors which might not always be fully controllable. It
additionally requires maintaining state between test runs as we're comparing
results against a baseline that's not described by the test itself.
```

Fortunately, I had vague recollections of past research and quickly rediscovered
[Playwright's built-in visual comparison](https://playwright.dev/docs/test-snapshots).
Playwright itself is also
[light on dependencies](page://wip/web-devspair#fn:npm).


Setup
-----

The recommended setup with `npm init playwright@latest` didn't sit well with my
minimalist taste (unnecessary sample files and excessive boilerplate while
employing CommonJS instead of ESM), so I set everything up from scratch instead.

In this case, I expect snapshot testing to only be used on rare occasions, so I
wanted to isolate everything in a dedicated folder `test/visual`; that will be
our working directory from here on out.

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
root project with this rarely-used dependency though, I resort to manually
invoking `npm install --no-save @playwright/test` in the root directory when
needed. YMMV.
```

With that in place, `npx playwright install` serves to download a range of
headless browsers.

Playwright then needs a configuration file to define our test environment:

```figure filename=playwright.config.js
'''javascript
import { defineConfig, devices } from "@playwright/test";

let BROWSERS = ["Desktop Firefox", "Desktop Chrome", "Desktop Safari"];
let BASE_URL = "http://localhost:8000";
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
    projects: BROWSERS.map(ua => ({
        name: ua.toLowerCase().replaceAll(" ", "-"),
        use: { ...devices[ua] }
    }))
});
'''
```

Here we expect our static website to already reside within the root directory's
`dist` folder and to be served at localhost:8000 (see `SERVER`; I prefer Python
because that's
[universally available](https://en.wikipedia.org/wiki/Linux_Standard_Base)).
I've included multiple browsers for illustration purposes, but we might trim
this down to speed things up a bit. Similarly, continuous integration is
[YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) for my
scenario, so the whole `IS_CI` dance could be discarded.


Capture and Compare
-------------------

Let's turn to the actual tests, starting with a minimal sample:

```figure filename=sample.test.js
'''javascript
import { test, expect } from "@playwright/test";

test("home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot();
});
'''
```

`npm test` now executes this little test suite (based on
[filename conventions](https://playwright.dev/docs/test-configuration#filtering-tests)).
The initial run always fails because it first needs to create baseline snapshots
against which subsequent runs compare their results. Invoking `npm test` once
more should report a passing test.

Changing our site, e.g. by recklessly messing with CSS within `dist`, should
then make the test fail again. Such failures will offer various options to
compare expected and actual visuals:

```figure img=./error.png lazy
failing test with image diffing
```

We can also inspect those baseline snapshots directly: Playwright creates a
folder for screenshots named after the test file (`sample.test.js-snapshots` in
this case), with file names derived from the respective test's title (e.g.
`home-page-desktop-firefox.png`).


Generating Tests
----------------

Going back to our original motivation, what we actually want is a test for every
page. Instead of arduously writing and maintaining repetitive tests, we'll
create a simple web crawler and have tests generated automatically; one for each
URL we've identified.

Playwright's
[global setup](https://playwright.dev/docs/test-global-setup-teardown) enables
us to perform some preparatory work before test discovery begins: Determine
those URLs and write them to a file. Afterwards we can dynamically generate our
tests at runtime.

```aside compact
While there are other ways to pass data between setup and test-discovery phases,
having a file on disk makes it easy to modify the list of URLs before test runs
(e.g. to temporarily ignore irrelevant pages).
```


### Site Map

The first step is to extend our configuration by inserting `globalSetup` and
exporting two of our configuration values:

```figure filename=playwright.config.js
'''javascript
export let BROWSERS = ["Desktop Firefox", "Desktop Chrome", "Desktop Safari"];
export let BASE_URL = "http://localhost:8000";

// …

export default defineConfig({
    // …
    globalSetup: require.resolve("./setup.js")
});
'''
```

```aside compact
Although we're using ESM here, we can still rely on CommonJS-specific APIs like
`require.resolve` and `__dirname`. It appears there's some Babel transpilation
happening in the background, so what's actually being executed is probably
CommonJS? Such nuances can sometimes lead to confusion because it isn't always
obvious what's being executed where. 🤷
```

We can now reuse those exported values within `setup.js`, which spins up a
headless browser to crawl our site (just because that's easier here than using a
separate HTML parser):

```figure filename=setup.js
'''javascript
import { BASE_URL, BROWSERS } from "./playwright.config.js";
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
    await createSiteMap(BASE_URL, page);
    await browser.close();
}
'''
```

This is fairly boring glue code; the actual crawling is happening within
`sitemap.js`:

* `createSiteMap` determines URLs and writes them to disk.
* `readSiteMap` merely reads any previously created site map from disk. This
  will be our foundation for dynamically generating tests. (We'll see later why
  this needs to be synchronous.)

Fortunately we can rely on
[prepitaph's topics page](page://topics) to provide a comprehensive index of all
pages, so our crawler just needs to collect unique local URLs from that page:

```javascript
function extractLocalLinks(baseURL) {
    let urls = new Set();
    let offset = baseURL.length;
    for(let { href } of document.links) {
        if(href.startsWith(baseURL)) {
            let path = href.slice(offset);
            urls.add(path);
        }
    }
    return Array.from(urls);
}
```

We'll need a bit more boring glue code to make that work:

```figure filename=sitemap.js
'''javascript
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let ENTRY_POINT = "/topics";
let SITEMAP = join(__dirname, "./sitemap.json");

export async function createSiteMap(baseURL, page) {
    await page.goto(baseURL + ENTRY_POINT);
    let urls = await page.evaluate(extractLocalLinks, baseURL);
    let data = JSON.stringify(urls, null, 4);
    writeFileSync(SITEMAP, data, { encoding: "utf-8" });
}

export function readSiteMap() {
    try {
        var data = readFileSync(SITEMAP, { encoding: "utf-8" });
    } catch(err) {
        if(err.code === "ENOENT") {
            throw new Error("missing site map");
        }
        throw err;
    }
    return JSON.parse(data);
}

function extractLocalLinks(baseURL) {
    /* … */
}
'''
```

```aside compact
`var` within `try...catch` avoids awkward
[scoping issues](https://front-end.social/@atirip@est.social/112892978443165838).
```

The interesting bit here is that `extractLocalLinks` is
[evaluated within the browser context](https://playwright.dev/docs/evaluating) --
thus we can rely on DOM APIs, notably
[`document.links`](https://developer.mozilla.org/en-US/docs/Web/API/Document/links) --
while the rest is executed within the Playwright environment (i.e. Node).


### Tests

Now that we have our list of URLs, we basically just need a test file with a
simple loop to dynamically generate corresponding tests:

```javascript
for(let url of readSiteMap()) {
    test(`page at ${url}`, async ({ page }) => {
        await page.goto(url);
        await expect(page).toHaveScreenshot();
    });
}
```

(This is why `readSiteMap` had to be synchronous above: Playwright doesn't
currently support top-level `await` within test files.)

In practice, we'll want better error reporting for when the site map doesn't
exist yet:

```figure filename=viz.test.js
'''javascript
import { readSiteMap } from "./sitemap.js";
import { test, expect } from "@playwright/test";

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
        await page.goto(url);
        await expect(page).toHaveScreenshot();
    });
}
'''
```

Getting here as a bit of a journey, but we're pretty much done ... unless we
have to deal with reality; that typically takes a bit more tweaking.


Exceptions
----------

Because visual testing is inherently flaky, we sometimes need to compensate
via special-casing. Playwright lets us inject custom CSS, which is often the
easiest and most effective approach:

```figure filename=viz.test.js
'''javascript
// …
import { join } from "node:path";

let OPTIONS = {
    stylePath: join(__dirname, "./viz.tweaks.css")
};

// …
        await expect(page).toHaveScreenshot(OPTIONS);
// …
'''
```

```figure filename=viz.tweaks.css
'''css
main a:visited {
    color: var(--color-link);
}

/* suppress randomness */
iframe[src$="/articles/signals-reactivity/demo.html"] {
    visibility: hidden;
}

/* suppress flakiness */
body:has(h1 a[href="/wip/unicode-symbols/"]) {
    main tbody > tr:last-child > td:first-child {
        font-size: 0;
        visibility: hidden;
    }
}
'''
```


Page vs. Viewport
-----------------

At this point everything seemed hunky-dory -- until I realized that my tests
weren't failing after I had changed some styling. That's not good!

What I hadn't taken into account is that `.toHaveScreenshot` only captures the
viewport rather than the entire page. We can rectify that by again extending our
configuration and then adjusting our test-generating loop:

```figure filename=playwright.config.js
'''javascript
export let WIDTH = 800;
export let HEIGHT = WIDTH;

// …
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
'''
```

```figure filename=viz.test.js
'''javascript
import { WIDTH, HEIGHT } from "./playwright.config.js";

// …

for(let url of sitemap) {
    test(`page at ${url}`, async ({ page }) => {
        checkSnapshot(url, page);
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
'''
```

Note that we've also introduced a
[waiting condition](https://playwright.dev/docs/next/api/class-page#page-wait-for-load-state-option-state),
holding until there's no network traffic for a while in an attempt to account
for stuff like lazy-loading images.

Be aware that capturing the entire page is more resource-intensive and doesn't
always work reliably: You might have to deal with
[layout shifts](https://developer.mozilla.org/en-US/docs/Glossary/CLS) or run
into timeouts for long or asset-heavy pages.
