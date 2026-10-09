import { jitEngine } from '@mlut/core';

function debounce<T>(fn: (...args: T[]) => unknown, timeout: number) {
	let timer: number | undefined;

	return (...args: T[]) => {
		clearTimeout(timer);
		timer = window.setTimeout(fn, timeout, ...args);
	};
}

function getMarkup() {
	return `"${document.documentElement.className}"\n${document.body.outerHTML}`;
}

const pageName = 'index.html';
const headElm = document.head;
const styleTag = document.createElement('style');
headElm.appendChild(styleTag);

const observerConfig = {
	attributes: true,
	childList: true,
	subtree: true,
};

const writeCss = debounce(async () => {
	const markup = getMarkup();
	jitEngine.putContent(pageName, markup);
	styleTag.innerHTML = await jitEngine.generateCss();
}, 250);

await jitEngine.init();

const observer = new MutationObserver((mutations) => {
	const isRelevant = mutations.some(
		(item) => (item.type === 'attributes' && item.attributeName !== 'style') ||
			(item.type === 'childList' && item.target.nodeName !== "STYLE")
	);

	if (!isRelevant) {
		return;
	}

	writeCss();
});

observer.observe(document.documentElement, observerConfig);
