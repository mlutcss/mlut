import { join } from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import typescript from '@rollup/plugin-typescript';

const __dirname = new URL('.', import.meta.url).pathname;

const plugins = [
	nodeResolve(),
	terser(),
	typescript(),
	alias({
		entries: [
			{ find: 'sass-embedded', replacement: 'sass' },
			{ find: 'https://esm.sh/path-browserify-esm', replacement: 'path-browserify-esm' },
		]
	}),
];

export default {
	input: join(__dirname, 'src/index.ts'),
	plugins,
	output: {
		inlineDynamicImports: true,
		dir: join(__dirname, 'dist'),
		format: 'es',
	},
};
