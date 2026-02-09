import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
//@ts-ignore - because this script is excluded from tsconfig
import { locationOrigin, sassIndexFileName } from '../src/jit/importerConfig.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sassPath = '../src/sass';

// This class was already written before this script, so it is here
class SassSourcesLoader {
	private fs = fs;
	private unusedPath = 'css/utils';
	readonly initPath = path.resolve(__dirname, sassPath);

	async loadDir(path: string): Promise<string[]> {
		if (path.includes(this.unusedPath)) {
			return [];
		}

		return this.fs.readdir(path).catch(() => []);
	}

	async isDir(path: string): Promise<boolean> {
		return this.fs.stat(path).then((stat) => stat.isDirectory());
	}

	async loadFile(path: string): Promise<string> {
		return this.fs.readFile(path, 'utf8');
	}
}

// This had already been written to work with the polymorphic loader prior to that script
async function loadSourcesRecursive(
	loader: SassSourcesLoader
): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	const pathPrefix = locationOrigin;
	const { initPath } = loader;

	const doLoadRecursive = async (initEntry: string, map: Record<string, string>) => {
		const entry = initEntry;
		const files = await loader.loadDir(entry);

		await Promise.all(files.map(async (item) => {
			const itemPath = path.join(entry, item);
			const isDir = await loader.isDir(itemPath);

			if (isDir) {
				await doLoadRecursive(itemPath, map);
			} else if (!itemPath.endsWith('.js')) {
				const pathObj = path.parse(itemPath);

				if (pathObj.base !== sassIndexFileName && pathObj.base.startsWith('_')) {
					pathObj.base = pathObj.base.slice(1);
				}

				const finalPath = path.format(pathObj).replace(initPath, pathPrefix);
				map[finalPath] = (await loader.loadFile(itemPath));
			}
		}));

		return map;
	};

	return doLoadRecursive(initPath, result);
}

const sourcesMap = await loadSourcesRecursive(new SassSourcesLoader());
const fileContent = 'export const sourcesMap';

void fs.writeFile(
	path.resolve(__dirname, sassPath, 'index.js'),
	`${fileContent} = ${JSON.stringify(sourcesMap)}`,
);
void fs.writeFile(
	path.resolve(__dirname, sassPath, 'index.d.ts'),
	fileContent + ': Record<string, string>;',
);
