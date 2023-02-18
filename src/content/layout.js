import { html, RAW } from "../ssg/html.js";

export default ({ title, content, css = [], store, config }) => {
	let { baseURL } = config;
	let homeURI = store.retrieve(null, "index").url(baseURL).pathname;
	let coloURI = store.retrieve(null, "colophon").url(baseURL).pathname;

	title = title.isStandalone ? title.text : `${title} | ${config.siteTitle}`;
	// NB: layout will always be EN
	return html`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>${title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${{
		[RAW]: css.
			map(uri => html`<link rel="stylesheet"${{ href: uri }}>`).
			join("\n")
	}}
</head>

<body class="stack">
	<header class="site-header">
		<nav>
			<a${{ href: homeURI }}><b>prepitaph</b></a>
			<a${{ href: coloURI }}>colophon</a>
		</nav>
	</header>
	${{ [RAW]: content }}
</body>

</html>
	`.trim();
};
