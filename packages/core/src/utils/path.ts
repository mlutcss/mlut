export const path = await import('node:path')
	//@ts-ignore - for tests only
	.catch(() => import('path-browserify-esm'))
	.then((r) => r.default);
