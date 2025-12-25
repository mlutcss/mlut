import type { PlatformPath } from 'node:path';

//@ts-expect-error - cdn for run in browser
export const path = await import('https://esm.sh/path-browserify-esm')
	.catch(() => import('node:path'))
	//eslint-disable-next-line
	.then((r) => r.default) as PlatformPath;
