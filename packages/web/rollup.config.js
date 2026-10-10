import { join } from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';

const __dirname = new URL('.', import.meta.url).pathname;
const isScriptBuild = !!process.env.SCRIPT_BUILD;
const inputPath = isScriptBuild ? 'src/script.ts' : 'src/index.ts';

const plugins = [
	nodeResolve(),
	terser(),
	alias({
		entries: [
			{ find: 'sass-embedded', replacement: 'sass' },
			{ find: 'https://esm.sh/path-browserify-esm', replacement: 'path-browserify-esm' },
		]
	}),
];

if (isScriptBuild) {
	plugins.push(typescript());
}

export default {
	input: join(__dirname, inputPath),
	plugins,
	output: {
		inlineDynamicImports: true,
		dir: join(__dirname, 'dist'),
		format: 'es',
	},
};
