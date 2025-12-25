import type { Octokit } from "@octokit/rest";

declare global {
	var mlut: {
		githubToken?: string,
	}
}

//@ts-expect-error - for run in browser
const retryPromise = import('https://esm.sh/@octokit/plugin-retry')
	.catch(() => import('@octokit/plugin-retry'))
	.then((r) => r.retry as typeof import('@octokit/plugin-retry').retry);

//@ts-expect-error - for run in browser
const octokit = await import('https://esm.sh/@octokit/rest')
	.catch(() => import('@octokit/rest'))
	.then(async (r: typeof import('@octokit/rest')) => {
		const retry = await retryPromise;
		const ctr = r.Octokit.plugin(retry);
		return new ctr({
			auth: globalThis.mlut?.githubToken ?? process.env.GITHUB_TOKEN,
		});
	}) as Octokit;

export class SassSourcesLoader {
	private readonly kit = octokit;
	private readonly owner = 'mlutcss';
	private readonly repo = 'mlut';
	private readonly unusedPath = 'packages/core/src/sass/css/utils';
	private readonly dirs = new Set<string>();
	readonly initPath = 'packages/core/src/sass';

	async loadDir(dirPath: string): Promise<string[]> {
		if (dirPath.includes(this.unusedPath)) {
			return [];
		}

		return this.kit.repos.getContent({
			owner: this.owner,
			repo: this.repo,
			path: dirPath,
		}).then((r) => {
			if (!Array.isArray(r.data)) {
				return [];
			}

			const result: string[] = [];

			for (const item of r.data) {
				if (item.type === 'dir') {
					this.dirs.add(item.path);
				}

				result.push(item.name);
			}

			return result;
		});
	};

	isDir(dirPath: string): boolean {
		return this.dirs.has(dirPath);
	};

	async loadFile(filePath: string): Promise<string> {
		return this.kit.repos.getContent({
			owner: this.owner,
			repo: this.repo,
			path: filePath,
		}).then((r) => {
			if (Array.isArray(r.data) || r.data.type !== 'file') {
				return '';
			}

			return globalThis.atob(r.data.content);
		});
	};
}

export const sassSourcesLoader = new SassSourcesLoader();
