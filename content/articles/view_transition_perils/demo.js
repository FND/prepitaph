let {
	body,
	startViewTransition = abort("This browser does not support view transitions.")
} = document;
startViewTransition = startViewTransition.bind(document);

let LATENCY = 500;
let ITEMS = Array.from({ length: 5 }).map((_, i) => ({
	id: `item-${i}`,
	label: `item #${i + 1}`
}));
let LIST = createElement("ol", { className: "items stack" }, body);

// animations
let UPDATE_TIMESTAMP = spawnTimestamp(body);
let UPDATE_MAP = spawnMap(body);
let UPDATE_CHART = spawnChart(body);
setInterval(onTick, 10);

body.addEventListener("click", onAction, { passive: true });
renderNow();

async function render(itemIndex) {
	let duration = 200;
	LIST.style = `--animation-duration: ${duration}ms`;
	let item = LIST.children[itemIndex];
	item?.classList.add("is-pending");
	await wait(duration / 3); // let transition kick in, but not complete

	startViewTransition(async () => {
		await wait(LATENCY); // simulated latency
		item?.classList.remove("is-pending");
		renderNow();
	});
}

function onAction(ev) {
	let btn = ev.target;
	let index;
	switch(btn.getAttribute("data-action")) {
	case "add":
		index = ITEMS.length;
		ITEMS.push(makeItem());
		break;
	case "delete": {
		let { id } = btn.closest("li");
		index = ITEMS.findIndex(item => item.id === id);
		ITEMS.splice(index, 1);
		break;
	}
	case "rearrange": {
		index = randomInt(0, ITEMS.length - 1);
		let [item] = ITEMS.splice(index, 1);
		do {
			var newIndex = randomInt(0, ITEMS.length);
		} while(newIndex === index);
		ITEMS.splice(newIndex, 0, item);
		break;
	}
	default:
		return;
	}
	render(index);
}

function onTick() {
	UPDATE_TIMESTAMP();
	UPDATE_MAP();
	UPDATE_CHART();
}

function renderNow() {
	// NB: assumes trusted input WRT escaping
	LIST.innerHTML = ITEMS.map(({ id, label }) => `
<li id="${id}" style="view-transition-name: ${id}">
	<span>${label}</span>
	<button type="button" data-action="delete" data-icon="🗑️">delete</button>
</li>
	`.trim()).join("\n");
}

function spawnTimestamp(parent) {
	let el = createElement("output", {}, parent);
	return () => {
		el.textContent = new Date().toISOString();
	};
}

function spawnMap(parent, size = 100) {
	let ctx = createElement("canvas", { width: size, height: size }, body).
		getContext("2d");
	let [x, y] = [size / 2, size / 2];
	return () => {
		ctx.beginPath();
		ctx.moveTo(x, y);
		x = Math.random() > 0.5 ? Math.min(x + 5, size) : Math.max(0, x - 5);
		y = Math.random() > 0.5 ? Math.min(y + 5, size) : Math.max(0, y - 5);
		ctx.lineTo(x, y);
		ctx.fillStyle = Math.random() > 0.5 ? "blue" : "green";
		ctx.fill();
	};
}

function spawnChart(parent) {
	let el = createElement("output", {}, parent);
	return () => {
		if(Math.random() > 0.3) {
			el.textContent += Math.random() > 0.8 ? " " :
					(Math.random() > 0.5 ? "•" : "–");
		} else {
			let txt = el.textContent;
			el.textContent = txt.slice(1);
		}
	};
}

function makeItem(i = ITEMS.length) {
	let id = i + 1;
	return {
		id: `item-${id}`,
		label: `item #${id}`
	};
}

function abort(msg) {
	createElement("p", {
		className: "error",
		textContent: msg
	}, body);
	throw new Error(msg);
}

function createElement(tag, props, parent) {
	let el = document.createElement(tag);
	for(let [name, value] of Object.entries(props)) {
		el[name] = value;
	}
	if(parent) {
		parent.appendChild(el);
	}
	return el;
}

function wait(delay) {
	return new Promise(resolve => void setTimeout(() => {
		resolve();
	}, delay));
}

// returns a random integer within the given bounds (both inclusive)
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
