import { jitEngine, logger } from '@mlut/core';
import { createUnplugin } from 'unplugin';
import fs from 'fs-extra';
import type { FSWatcher } from 'chokidar';

import { transformCss, TransformCssOptions } from './transformCss.js';

export interface Options extends TransformCssOptions {
	readonly input?: string,
	readonly output: string,
}

function debounce<T>(fn: (...args: T[]) => unknown, timeout: number) {
	let timer: NodeJS.Timeout | undefined;

	return (...args: T[]) => {
		clearTimeout(timer);
		timer = setTimeout(fn, timeout, ...args);
	}
}

export const unplugin = createUnplugin<Options>((options, meta) => {
	const pluginName = 'unplugin-mlut';
	const finalOptions: Options = { output: '' };
	const inputPath = options.input;
	let lastCompiledCss = '';
	const isWebpack = meta.framework === 'webpack';
	let isVite = false;
	let isViteWatch = false;

	const writeCssFile = async () => {
		const css = await jitEngine.generateCss();

		if (lastCompiledCss !== css) {
			lastCompiledCss = css;

			await fs.outputFile(
				finalOptions.output,
				await transformCss(css, finalOptions),
			).catch((e) => logger.error('Failed to write the output file.', e));
		}
	};

	const debouncedWriteCssFile = debounce(writeCssFile, 500);

	const initPlugin = async () => {
		let inputContent = '';

		if (inputPath) {
			inputContent = await fs.promises.readFile(inputPath)
				.then((r) => r.toString())
				.catch((e) => (logger.warn('Failed to read the input file.', e), ''));
		}

		const cfgMatchResult = inputContent.match(/\$jit:\s*\(([^)]+)/);

		if (cfgMatchResult != null) {
			try {
				const config = JSON.parse(
					//eslint-disable-next-line
					`{${cfgMatchResult[1].replaceAll("'", '"')}}`
				) as Options;

				Object.assign(finalOptions, options, config);
			} catch (e) {
				logger.error('Failed to load the JIT config from the input file.', e);
			}
		} else {
			Object.assign(finalOptions, options);
		}

		if (!finalOptions.output) {
			throw new Error('Output path not specified!');
		}

		await jitEngine.init([inputPath, inputContent]);
	}

	return {
		name: pluginName,

		// Vite only hook
		// TODO: add the Vite types
		async config(_config: unknown, { command }: { command: string }) {
			isVite = true;

			if (command === 'serve') {
				isViteWatch = true;
			}

			await initPlugin();

			return {
				server: {
					watch: {
						ignored: ['!' + finalOptions.output]
					}
				},
			};
		},

		// Vite only hook
		// TODO: add the Vite types
		configureServer(server: { watcher: FSWatcher }) {
			server.watcher.add(finalOptions.output);
    },

		// hack because `buildStart` is not async in Webpack yet
		// https://github.com/unjs/unplugin/issues/293
		webpack(compiler) {
			compiler.hooks.beforeCompile.tapPromise(pluginName, initPlugin);
		},

		async buildStart() {
			if (meta.framework === 'rollup') {
				await initPlugin();
			}

			if (inputPath) {
				this.addWatchFile(inputPath);
			}
		},

		transformInclude(id) {
			// hack because `html-webpack-plugin` can't load html when using `unplugin`
			// https://github.com/intlify/bundle-tools/issues/322
			if (isWebpack && id.endsWith('.html')) {
				return false;
			}

			return !(
				id.endsWith('.css') ||
				id.endsWith('.scss') ||
				id.includes('node_modules/')
			);
		},

		transform(code, id) {
			jitEngine.putContent(id, code);
			return null;
		},

		// Vite only hook
		async transformIndexHtml(html: string, ctx: { filename: string }) {
			jitEngine.putContent(ctx.filename, html);

			if (isViteWatch) {
				debouncedWriteCssFile();

				return {
					html,
					tags: [
						{
							tag: 'link',
							attrs: { rel: 'stylesheet', href: finalOptions.output },
						},
					],
				}
			} else if (isVite) {
				await writeCssFile();
			}

			return html;
		},

		async watchChange(id, change) {
			if (inputPath === id) {
				await fs.promises.readFile(id)
					.then((data) => jitEngine.updateSassConfig(data.toString()));

				if (isVite) {
					await writeCssFile();
				}
			} else if (change.event === 'delete') {
				jitEngine.deleteContent(id);
			}
		},

		async buildEnd() {
			if (!isVite) {
				await writeCssFile();
			}
		},
	};
});

export const rollup = unplugin.rollup;
export const vite = unplugin.vite;
export const webpack = unplugin.webpack;
