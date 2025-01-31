let ANIMATION_DURATION = 500;
let CSS = new CSSStyleSheet();
CSS.replace(`
source-view {
	display: contents;
	position: relative;

	> button[type=button] {
		position: absolute;
		top: 0;
		right: 0;
		border-radius: 0;
		font-size: 1rem;
		transition: none ${ANIMATION_DURATION}ms ease-in-out;
		transition-property: scale, opacity;
		cursor: copy;

		&::before {
			content: "📋";
		}

		&.is-pending {
			scale: 0.8;
		}

		&.is-success {
			scale: 0.9;
			opacity: 0.5;

			&::before {
				content: "✅";
			}
		}
	}
}
`);
document.adoptedStyleSheets.push(CSS);

class SourceView extends HTMLElement {
	connectedCallback() {
		let el = document.createElement("b");
		el.className = "nonvisual";
		el.textContent = "copy source";

		let btn = this._button = document.createElement("button");
		btn.type = "button";
		btn.appendChild(el);
		btn.addEventListener("click", this);
		this.appendChild(btn);
	}

	async handleEvent(_ev) {
		let cls = this._button.classList;
		cls.add("is-pending");
		await navigator.clipboard.writeText(this.source.textContent);
		cls.add("is-success");
		setTimeout(() => {
			cls.remove("is-pending", "is-success");
		}, ANIMATION_DURATION);
	}

	get source() {
		return this.querySelector("pre");
	}
}

customElements.define("source-view", SourceView);
