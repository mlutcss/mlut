import type { Importer, ImporterResult } from 'sass';

import { path } from '../utils/path.js';
import { sourcesMap } from '../sass/index.js';
import { locationOrigin, sassIndexFileName } from './importerConfig.js';

export class ModuleImporter implements Importer<'async'> {
	private modules = sourcesMap;
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
				url.split('sass')[1],
			) + '.scss').href;
		}

		if (!(newUrl in this.modules)) {
			newUrl = path.join(newUrl.replace('.scss', ''), sassIndexFileName);
		}

		return new URL(newUrl);
	};

	// bind for the sass web version
	load = (canonicalUrl: URL): ImporterResult => {
		if (!(canonicalUrl.href in this.modules)) {
			throw new Error('Unknown module');
		}

		return {
			contents: this.modules[canonicalUrl.href],
			syntax: 'scss'
		};
	};
}

export const importer = new ModuleImporter();
