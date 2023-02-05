import config from "../config.js";
import { encodeContent as html } from "../ssg/html.js";

let CSS = "/assets/main.css"; // FIXME: hard-coded

export default ({ title, content }) => {
	title = title.isStandalone ? title.text : `${title} | ${config.siteTitle}`;
	// NB: layout will always be EN
	return `
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>${html(title)}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="${CSS}">
</head>

<body class="stack">
	<header class="site-header">
		<nav>
			<a href="index.html" class="home"><b>prepitaph</b></a>
			<a href="index.html">articles</a>
			<a href="about.html">about</a>
		</nav>
	</header>
	${content}
</body>

</html>
	`.trim();
};
