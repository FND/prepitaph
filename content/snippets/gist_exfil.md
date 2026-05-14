title: Exfiltrating GitHub Gists
tags: miscellaneous, javascript, shell
author: FND
created: 2026-05-14
syntax: true

```intro
Everyone's leaving the dilapidated slop factory. My own efforts were stumped by
GitHub's account-data export being incomplete: Gists were missing. Recovering
them was a matter of assembling a couple of throwaway scripts.
```

While GitHub claims you can
[download an archive of all your data](https://github.blog/developer-skills/github/download-your-data/),
it [turns out](https://github.com/orgs/community/discussions/84931) that archive
does not include gists. Consider me unamused: That's almost two decades' worth
of experiments, some of which retroactively turned into personal reference
material. (Of course even back then I should have known better.)

While I should have been able to retrieve those gists via
[GitHub's API](https://docs.github.com/en/rest/gists/gists), secret gists were
not included in those responses (regardless of authentication). So I resorted to
old-school scraping by dumping the following script into my browser's developer
console:

```javascript
let user = "FND";
let pages = 33; // determined via manual binary search beforehand

let gists = [];
let parser = new DOMParser();
for(let i = 1; i <= pages; i++) {
    let res = await fetch(`https://gist.github.com/${user}?page=${i}`, {
        credentials: "include"
    });
    let html = await res.text();
    let doc = parser.parseFromString(html, "text/html");
    for(let gist of doc.querySelectorAll(".gist-snippet")) {
        let desc = gist.querySelector(".f6.color-fg-muted + .f6.color-fg-muted");
        let { href } = gist.querySelector("a.Link--muted");
        gists.push({
            url: href,
            description: desc?.textContent.trim()
        });
        console.log(`gist #${gists.length}:`, href);
    }
}

let el = document.createElement("textarea");
el.value = JSON.stringify(gists, null, 4);
document.body.prepend(el);
```

(Remember when GitHub cared about markup? Not to mention code quality in
general, or even users... )

This inserted a `<textarea>` at the top of the page containing URLs and
descriptions of all my gists. I then proceeded to store that metadata in a JSON
file within a newly created directory.

After manually (yay Vim) extracting URLs into a line-based text file, I piped
those into a simple shell script to sequentially clone each repository:

```shell
while read url; do \
    git clone "$url"; \
    sleep 5; \
done < gists.txt
```

About half an hour later, I had downloaded all my gists into the aforementioned
directory: 50 MB total, compressed into a 9 MB tarball.
