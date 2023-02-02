export default {
	// NB: file-system references here are relative to current working directory
	contentDir: "./content",
	outputDir: "./dist",

	siteTitle: "prepitaph",

	categories: {
		articles: () => import("./ssg/article.js").
			then(m => m.Article)
	},
	blocks: {
		default: (content, params, context) => content,
		intro: (content, params, context) => content
	}
};
