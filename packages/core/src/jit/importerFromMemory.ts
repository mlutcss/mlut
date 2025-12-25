import type { Importer, ImporterResult } from 'sass';

import { path } from '../utils/path.js';
import { sassSourcesLoader, SassSourcesLoader } from './SassSourcesLoader.js';

const locationOrigin = globalThis.location?.origin ?? 'http://localhost';
const sassIndexFileName = '_index.scss';

async function loadSourcesRecursive(
	loader: SassSourcesLoader
): Promise<Map<string, string>> {
	const result = new Map<string, string>();
	const pathPrefix = locationOrigin + '/';

	const doLoadRecursive = async (entry: string, map: Map<string, string>) => {
		const files = await loader.loadDir(entry);

		await Promise.all(files.map(async (item) => {
			const itemPath = path.join(entry, item);
			const isDir = loader.isDir(itemPath);

			if (isDir) {
				await doLoadRecursive(itemPath, map);
			} else {
				const pathObj = path.parse(itemPath);

				if (pathObj.base !== sassIndexFileName && pathObj.base.startsWith('_')) {
					pathObj.base = pathObj.base.slice(1);
				}

				const finalPath = pathPrefix + path.format(pathObj);
				map.set(finalPath, (await loader.loadFile(itemPath)));
			}
		}));

		return map;
	};

	return doLoadRecursive(sassSourcesLoader.initPath, result);
}

const modulesMap = await loadSourcesRecursive(sassSourcesLoader);

export class ModuleImporter implements Importer<'async'> {
	private modules = modulesMap;
	private aliases: Record<string, string> = {
		'@mlut/core': '../sass/index',
		'@mlut/core/tools': '../sass/tools',
	};

	// bind for the sass web version
	canonicalize = (initUrl: string) => {
		let url = initUrl;

		if (!url.includes('/sass/')) {
			if (url in this.aliases) {
				url = this.aliases[url];
			} else if (!url.startsWith('@mlut/core')) {
				return null;
			}
		}

		const isEntryUrl = !url.startsWith('http');
		let newUrl = url + '.scss';

		if (isEntryUrl) {
			newUrl = new URL(path.join(
				locationOrigin,
				sassSourcesLoader.initPath,
				url.split('sass')[1],
			) + '.scss').href;
		}

		if (!this.modules.has(newUrl)) {
			newUrl = path.join(newUrl.replace('.scss', ''), sassIndexFileName);
		}

		return new URL(newUrl);
	};

	// bind for the sass web version
	load = (canonicalUrl: URL): ImporterResult => {
		if (!this.modules.has(canonicalUrl.href)) {
			throw new Error('Unknown module');
		}

		return {
			contents: this.modules.get(canonicalUrl.href) as string,
			syntax: 'scss'
		};
	};
}

export const importer = new ModuleImporter();
