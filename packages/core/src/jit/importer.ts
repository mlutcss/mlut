import type { Importer, ImporterResult } from 'sass';

import { fileURLToPath } from '../utils/fileURLToPath.js';
import { path } from '../utils/path.js';
import { FsModuleLoader, SassModuleLoader } from './sassModuleLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleLoader = new FsModuleLoader();

async function readModulesRecursive(
	entryPath: string, loader: SassModuleLoader,
): Promise<Map<string, string>> {
	const result = new Map<string, string>();

	const doReadRecursive = async (entry: string, map: Map<string, string>) => {
		const absEntry = path.resolve(__dirname, entry);
		const files = await loader.loadDir(absEntry);

		await Promise.all(files.map(async (item) => {
			const itemPath = path.join(absEntry, item);
			const isDir = await loader.isDir(itemPath);

			if (isDir) {
				await doReadRecursive(itemPath, map);
			} else {
				const pathObj = path.parse(itemPath);

				if (pathObj.base !== '_index.scss') {
					pathObj.base = pathObj.base.slice(1);
				}

				const finalPath = 'file://' + path.format(pathObj);
				map.set(finalPath, (await loader.loadFile(itemPath)));
			}
		}));

		return map;
	};


	return doReadRecursive(entryPath, result);
}

const modulesMap = await readModulesRecursive('../sass/tools', moduleLoader);

export class ModuleImporter implements Importer<'async'> {
	private modules = modulesMap;

	canonicalize(url: string) {
		if (!url.includes(path.join('sass', 'tools'))) {
			return null;
		}

		const isEntryUrl = !url.startsWith('file:');

		let newUrl = !isEntryUrl ?
			url + '.scss' : 'file://' + path.join(__dirname, '..', 'sass', url.split('sass')[1]) + '.scss';

		if (!this.modules.has(newUrl)) {
			newUrl = path.join(newUrl.replace('.scss', ''), '_index.scss');
		}

		return new URL(newUrl);
	}

	load(canonicalUrl: URL): ImporterResult {
		if (!this.modules.has(canonicalUrl.href)) {
			throw new Error('Unknown module');
		}

		return {
			contents: this.modules.get(canonicalUrl.href) as string,
			syntax: 'scss'
		};
	}
}

export const importer = new ModuleImporter();
