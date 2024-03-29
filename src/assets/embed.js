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

customElements.define("web-demo", class WebDemo extends HTMLElement {
	#elements = makeDialog();

	connectedCallback() {
		let btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = "🔍";
		btn.addEventListener("click", this);
		this.append(btn, this.#elements.dialog);
		if(this.resize) {
			this.initResize();
		}
	}

	async handleEvent(ev) {
		// NB: re-downloading HTML to retain original formatting
		let url = this.iframe.src;
		let res = fetch(url).
			then(res => res.text());

		let { dialog, code } = this.#elements;
		dialog.showModal();
		code.textContent = await res;
	}

	initResize(defer) {
		let { iframe } = this;
		if(defer || !iframe) {
			setTimeout(() => this.initResize(), 50);
			return;
		}

		let doc = iframe.contentDocument;
		if(doc?.location.href === "about:blank") {
			this.initResize(true);
		} else if(doc?.documentElement) {
			this.autoResize();
		} else {
			iframe.addEventListener("load", () => this.initResize(), { once: true });
		}
	}

	autoResize() {
		let { iframe } = this;
		new ResizeObserver(([entry]) => {
			const size = entry.borderBoxSize[0].blockSize;
			iframe.style.height = Math.ceil(size + 4) + "px"; // accounts for border
		}).observe(iframe.contentDocument.documentElement);
	}

	get iframe() {
		return this.querySelector("iframe");
	}

	get resize() {
		return this.hasAttribute("resize");
	}
});

function makeDialog() {
	let el = document.createElement("dialog");
	el.innerHTML = `
<form method="dialog">
	<button>Close</button>
</form>
<pre><code></code></pre>
	`.trim();
	return {
		dialog: el,
		code: el.querySelector("pre code")
	};
}
