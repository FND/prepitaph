import { effect, batch, computed, signal } from "./preact-signals-core.js";

let FREQUENCY = 1000;
let INITIAL_VALUE = randomInt(1, 100);

let counter = signal(INITIAL_VALUE);
let trend = signal(null);
let summary = computed(() => {
	let timestamp = new Date().toISOString().slice(11, 19);
	let symbol = trend.value?.symbol || "";
	return `${symbol} [${timestamp}] counter is at ${counter.value}`.trim();
});

let intervalID = setInterval(() => {
	let x = counter.peek();
	let [count, symbol] = Math.random() < 0.5 ? [x - 1, "📉"] : [x + 1, "📈"];
	batch(() => {
		counter.value = count;
		trend.value = { symbol };
	});
}, FREQUENCY);

/* demo controls */

makeButton("stop", ev => void clearInterval(intervalID));
makeButton("restart", ev => void document.location.reload());

/* GUI */

let log = document.createElement("ol");
let chart = document.createElement("output");
document.body.append(chart, log);

effect(() => {
	let el = document.createElement("li");
	el.textContent = summary.value;
	log.prepend(el);
});

effect(() => {
	let { value } = trend;
	if(value) {
		chart.textContent += value.symbol;
	}
});

/* utilities */

function makeButton(caption, onClick) {
	let btn = document.createElement("button");
	btn.type = "button";
	btn.textContent = caption;
	btn.addEventListener("click", onClick);
	document.body.appendChild(btn);
}

// returns a random integer within the given bounds (both inclusive)
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
