import { jitEngine } from '@mlut/core';

const pageName = 'index.html';
const configName = 'style.scss';
const defaultConfig = '@use "@mlut/core/tools";';
const headElm = document.head;
const styleElm = document.createElement('style');
const configElm = headElm.querySelector('style[type="text/scss"]');
const isConfigExist = configElm != null;
headElm.appendChild(styleElm);

function debounce<T>(fn: (...args: T[]) => unknown, timeout: number) {
	let timer: number | undefined;

	return (...args: T[]) => {
		clearTimeout(timer);
		timer = window.setTimeout(fn, timeout, ...args);
	};
}

const writeCss = debounce(async () => {
	const markup = `"${document.documentElement.className}"\n${document.body.outerHTML}`;
	jitEngine.putContent(pageName, markup);
	styleElm.innerHTML = await jitEngine.generateCss();
}, 250);

await jitEngine.init(
	isConfigExist ?
		[configName, configElm.innerHTML] : undefined
);

const mainObserver = new MutationObserver((mutations) => {
	const isRelevant = mutations.some(
		(item) => (item.type === 'attributes' && item.attributeName !== 'style') ||
			(item.type === 'childList' && item.target.nodeName !== "STYLE")
	);

	if (!isRelevant) {
		return;
	}

	writeCss();
});

mainObserver.observe(document.documentElement, {
	attributes: true,
	childList: true,
	subtree: true,
});

if (isConfigExist) {
	new MutationObserver((async () => {
		await jitEngine.updateSassConfig(configElm.innerHTML.trim() || defaultConfig);
		writeCss();
	})).observe(configElm, {
		characterData: true,
		subtree: true,
	});
}
