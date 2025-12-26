import type { PlatformPath } from 'node:path';

export const path = await import('path')
	//@ts-expect-error - cdn for run in browser
	.catch(() => import('https://esm.sh/path-browserify-esm'))
	//eslint-disable-next-line
	.then((r) => r.default) as PlatformPath;
