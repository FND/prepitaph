import { renderMarkdown } from "./ssg/markdown.js";
import { encodeContent as html } from "./ssg/html.js";

export default {
	// NB: file-system references here are relative to current working directory
	contentDir: "./content",
	outputDir: "./dist",

	siteTitle: "prepitaph",

	categories: {
		articles: () => import("./content/article/index.js").
			then(m => m.Article)
	},
	blocks: {
		default: markdown,
		none: (content, params, context) => `<pre>${html(content)}</pre>`,
		intro: markdown
	}
};

function markdown(content) {
	return renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase() // XXX: crude
	});
}
