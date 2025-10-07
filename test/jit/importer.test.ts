import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assert } from 'chai';
import { importer } from '../../packages/core/src/jit/importer.js';
import * as sass from 'sass-embedded';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('importer', () => {
	it('collect all sass modules', () => {
		const modulePath = 'file://' + path.join(
			__dirname, '../../packages/core/src/sass/tools/functions/base/getters.scss'
		);

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
				loadPaths: [ __dirname, 'node_modules' ],
				importers: [
					importer
				],
			}
		));

		assert.include(css, 'xxl');
	});
});
