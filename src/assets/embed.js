let CSS = new CSSStyleSheet();
CSS.replace(`
web-demo {
	position: relative;

	button {
		font-size: 1rem;

		&[type=button] {
			position: absolute;
			top: 0;
			right: 0;
			border-radius: 0;

			&::before {
				content: "🔍";
			}
		}
	}

	form {
		position: sticky;
		top: 0;

		button {
			display: block;
			width: 100%;
		}
	}

	dialog {
		width: 90vw;
		padding-block: var(--spacing);
	}
}
`);
document.adoptedStyleSheets.push(CSS);

let ASSETS_URI = "/assets";
// deno-lint-ignore no-window
window.Prism ||= {};
Prism.manual = true;
let HIGHLIGHTER = () => {
	HIGHLIGHTER = import(`${ASSETS_URI}/prism-core.min.js`)
		.then(() => import(`${ASSETS_URI}/prism-autoloader.min.js`))
		.then(() => {
			Prism.plugins.autoloader.languages_path = `${ASSETS_URI}/`;
		});
	return HIGHLIGHTER;
};

class WebDemo extends HTMLElement {
	#elements = makeDialog();

	connectedCallback() {
		let el = document.createElement("b");
		el.className = "nonvisual";
		el.textContent = "view source";

		let btn = document.createElement("button");
		btn.type = "button";
		btn.appendChild(el);
		btn.addEventListener("click", this);
		this.append(btn, this.#elements.dialog);

		let resize = this._resize = this.resize; // NB: memoization
		if (resize) {
			this.initResize();
		}
	}

	async handleEvent(_ev) {
		// NB: re-downloading HTML to retain original formatting
		let url = this.iframe.src;
		let res = fetch(url)
			.then((res) => res.text());

		let { dialog, code } = this.#elements;
		dialog.showModal();
		code.textContent = await res;

		await (HIGHLIGHTER.call ? HIGHLIGHTER() : HIGHLIGHTER);
		Prism.highlightElement(code);
	}

	initResize(defer) {
		let { iframe } = this;
		if (defer || !iframe) {
			setTimeout(() => this.initResize(), 50);
			return;
		}

		let doc = iframe.contentDocument;
		if (doc?.location.href === "about:blank") {
			this.initResize(true);
		} else if (doc?.documentElement) {
			this.autoResize();
		} else {
			iframe.addEventListener("load", () => this.initResize(), { once: true });
		}
	}

	autoResize() {
		let { iframe } = this;
		let root = iframe.contentDocument.documentElement;
		let obs = new ResizeObserver(([entry]) => {
			if (iframe.contentDocument.documentElement !== root) { // post-navigation
				obs.disconnect();
				this.autoResize();
				return;
			}

			if (this._resize === "once") {
				setTimeout(() => { // XXX: crude
					obs.disconnect();
				}, 250);
			}

			const size = entry.borderBoxSize[0].blockSize;
			iframe.style.height = Math.ceil(size + 4) + "px"; // accounts for border
		});
		obs.observe(root);
	}

	get iframe() {
		return this.querySelector("iframe");
	}

	get resize() {
		let value = this.getAttribute("resize") ?? false;
		return value === "" ? true : value;
	}
}

customElements.define("web-demo", WebDemo);

function makeDialog() {
	let el = document.createElement("dialog");
	el.innerHTML = `
<form method="dialog">
	<button>Close</button>
</form>
<pre><code class="language-markup" data-dependencies="markup,css,js"></code></pre>
	`.trim();
	return {
		dialog: el,
		code: el.querySelector("pre code"),
	};
}
