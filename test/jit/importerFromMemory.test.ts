import path from 'node:path';
import { assert } from 'chai';
import * as sass from 'sass-embedded';
import type { ModuleImporter } from '../../packages/core/src/jit/importerFromMemory.js';

describe('importerFromMemory', () => {
	// check only in a full test run
	if (process.env.NODE_ENV !== 'test') {
		return;
	}

	let importer: ModuleImporter | null = null;

	before(async () => {
		importer = await import('../../packages/core/src/jit/importerFromMemory.js')
			.then((r) => r.importer);
	});

	it('collect all sass modules', () => {
		const locationOrigin = 'http://localhost';
		const modulePath = new URL(path.join(
			locationOrigin,
			'packages/core/src/sass/tools/functions/base/getters.scss',
		)).href;

		//@ts-expect-error
		const content = importer.modules.get(modulePath) as string;
		assert.include(content, 'util-prop');
	});

	it('use custom importer for sass', async () => {
		const testConfig = `
			@use "sass:map";\n @use "../../packages/core/src/sass/tools/settings" as ml;
			\n b{ all: map.keys(map.get(ml.$at-rules-cfg, "breakpoints")); }
		`;

		const { css } = (await sass.compileStringAsync(
			testConfig,
			{
				style: 'compressed',
				importers: [ importer as ModuleImporter ],
			}
		));

		assert.include(css, 'xxl');
	});
});
