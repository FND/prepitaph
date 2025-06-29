let CATEGORIES = ".categories > *";
let CATTR = "data-category";
let FILTERS = ".filters label b";

let USERS = {
	cdent: {
		name: "cdent",
		img: "./cdent.jpg",
	},
	fnd: {
		name: "FND",
		img: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%23333" /></svg>',
	},
	news: {
		name: "Hypothetical Aggregator",
		img: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="0" y="90" font-size="120">📰</text></svg>',
	},
	bot: {
		name: "Imaginary Bot",
		img: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="0" y="100" font-size="100">🤖</text></svg>',
	},
	alien: {
		name: "Unknown Entity",
		img: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="0" y="90" font-size="100">👽</text></svg>',
	},
};
let POSTS = [{
	url: "https://prepitaph.org/articles/literacy/",
	title: "Literacy",
	author: "cdent",
	desc: `
If you want to be remote, learn to be literate. If you want your team to
support remote workers, make time for literature.
	`.trim(),
	category: "articles",
	sharers: ["bot", "news"],
}, {
	url: "https://prepitaph.org/articles/cheating-god/",
	title: "Cheating God",
	author: "fnd",
	desc: `
happy to help – it’s simple math: I spend 5 min. to save you 60

in the grand scheme of things, we just cheated god
	`.trim(),
	category: "articles",
	sharers: ["news"],
}, {
	url: "https://prepitaph.org/articles/creative-privacy/",
	title: "Creative Privacy",
	author: "fnd",
	desc: "Allowing users to tinker in private is essential to enabling creativity.",
	category: "articles",
	sharers: ["bot"],
}, {
	url: "https://prepitaph.org/articles/attractive-nuisance/",
	title: "Technology as Attractive Nuisance",
	author: "fnd",
	desc: `
Purveyors of software must exercise reasonable care to guard against
decontextualization of architectural choices.
	`.trim(),
	category: "articles",
	sharers: ["news", "bot", "alien"],
}, {
	url: "https://prepitaph.org/articles/constraints/",
	title: "Constraints Are a Good Thing",
	author: "fnd",
	category: "articles",
}, {
	url: "https://prepitaph.org/articles/automation-lessons/",
	title: "Automation Lessons",
	author: "cdent",
	desc: `
When creating software, ensure there are working harnesses for testing,
installation, and upgrade first.
	`.trim(),
	category: "articles",
	sharers: ["bot"],
}, {
	url: "https://prepitaph.org/articles/easy-to-change/",
	title: "Easy to Test, Easy to Change",
	author: "cdent",
	category: "articles",
	sharers: ["alien"],
}, {
	url: "https://prepitaph.org/articles/vector-path-scaling/",
	title: "CSS Vector-Path Scaling",
	author: "fnd",
	desc: `
CSS allows for arbitrary shapes these days. Getting the details right turns out
to be a little challenging.
	`.trim(),
	category: "snippets",
	sharers: ["bot", "news"],
}, {
	url: "https://prepitaph.org/snippets/permeable-borders/",
	title: "Permeable Borders",
	author: "fnd",
	desc: `
Strict border controls are an anachronism, so why not have our CSS reflect that?
	`.trim(),
	category: "snippets",
	sharers: ["alien"],
}, {
	url: "https://prepitaph.org/snippets/virtual-modules/",
	title: "Virtual JavaScript Modules",
	author: "fnd",
	desc: `
Given my penchant for minimal test cases and local applications, I sometimes
run into situations where I can’t load external JavaScript files.
	`.trim(),
	category: "snippets",
	sharers: ["bot"],
}, {
	title: "The Book of Good Times",
	author: "cdent",
	category: "wip",
}, {
	url: "https://prepitaph.org/wip/web-devspair/",
	title: "Web-Application Despair",
	author: "fnd",
	category: "wip",
}, {
	url: "https://prepitaph.org/wip/comms-hygiene/",
	title: "Digital Communication Hygiene",
	author: "fnd",
	desc: "Overcommunicate while being mindful of the work you leave for others.",
	category: "wip",
}];

// insert posts
let categories = new Map();
for (let el of document.querySelectorAll(CATEGORIES)) {
	categories.set(el.getAttribute(CATTR), el);
}
let parser = new DOMParser();
for (let post of POSTS) {
	let doc = parser.parseFromString(renderPost(post), "text/html");
	categories.get(post.category).appendChild(doc.body.firstChild);
}

// inject avatars
for (let person of document.querySelectorAll(FILTERS)) {
	let name = person.textContent;
	for (let user of Object.values(USERS)) {
		if (user.name === name) {
			person.insertAdjacentHTML("beforebegin", renderAvatar(user) + " ");
		}
	}
}

function renderPost({ url, title, author, sharers, desc }) {
	desc = desc?.split("\n\n");
	// XXX: does not sanitize inputs (XSS risk)
	return `
<article class="post" style="view-transition-name: post-${crypto.randomUUID()}">
	<header>
		${url ? `<h3><a href="${url}">${title}</a></h3>` : `<h3>${title}</h3>`}
		${renderAvatar(author, "author")}
	</header>
	${sharers === undefined ? "" : `
		<ul class="sharers">${
			sharers?.map((handle) => `
				<li>${renderAvatar(handle, "sharer", true)}</li>
			`.trim()).join("\n")
		}</ul>
	`}
	${desc === undefined ? "" : desc.map((txt) => `<p>${txt}</p>`).join("\n")}
</article>
	`.trim();
}

function renderAvatar(handle, type = null, tooltip = false) {
	if (typeof handle === "string") {
		var user = USERS[handle];
		if (!user) {
			throw new Error(`unknown user \`${handle}\``);
		}
	} else {
		user = handle;
		handle = null;
	}
	// XXX: does not sanitize inputs (XSS risk)
	return `
<img src="${user.img.replaceAll('"', "'")}" alt="${user.name}"${
	tooltip === false ? "" : ` title="${user.name}"`
}${
	type === null ? "" : ` data-${type}="${handle}"`
} class="user" loading="lazy">
	`.trim();
}
