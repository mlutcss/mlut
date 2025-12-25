import { path } from '../utils/path.js';
import { logger } from '../utils/index.js';
import type { AsyncCompiler } from 'sass';

const isNode = globalThis.process?.env != undefined;
const isTestEnv = globalThis.process?.env?.NODE_ENV === 'test';

const sass = await import('sass-embedded')
	.catch(() => import('sass'))
	//@ts-expect-error - for run in browser
	.catch(() => import('https://jspm.dev/sass'))
	.catch(() => {
		throw new Error(
			'The Sass package is not installed. You can do this with `npm i -D sass-embedded`'
		);
	}) as AsyncCompiler;

const sassImporters = !isTestEnv && isNode ? [] :
	await import('./importerFromMemory.js')
		.then((r) => [r.importer])
		.catch(() => []);

export const fileURLToPath = isNode ?
	await import('node:url').then((r) => r.fileURLToPath) :
	((str) => str.toString()) as typeof import('node:url').fileURLToPath;

const __dirname = isNode ?
	path.dirname(fileURLToPath(import.meta.url)) :
	globalThis.location?.origin ?? 'http://localhost';


export class JitEngine {
	private utils = new Set<string>();
	private breakpoints: string[] = [];
	private breakpointsMap: Record<string, number> = {};
	private inputFileDir = __dirname;
	private sassModuleName = 'tools';
	private inputFileCache = '@use "../sass/tools";';
	private readonly defaultSassConfig =
		'@use "sass:map";\n @use "../sass/tools/settings" as ml;';
	private readonly utilsByFile = new Map<string, [string[], string[]]>();
	private readonly utilsRegexps = {
		quotedContent: /"\n?[^"]*[^"\n]*\n?"/g,
		singleQuotedContent: /'\n?[^']*[^'\n]*\n?'/g,
		backtickQuotedContent: /`\n?[^`]*[^`\n]*\n?`/g,
		tooMoreSpaces: /\s{2,}|\n/g,
		escapedQuotes: /\\['"`]/g,
		utilName: /^-?[A-Z]{1}[a-zA-Z]*/,
		uppercaseLetter: /[A-Z]/,
		contextUtil: /-Ctx([\d\-#]|$)/,
		valueSeparator: /[0-9-#=]/,
	};
	private readonly configRegexps = {
		userSettings: /@use ['"][^'"]*(tools|mlut|core)['"](\s*as\s+[\w]+)?\s+with\s*\(([^;]+)\);/s,
		sassModuleName: /@use ['"][^'"]*(tools|mlut|core)['"]\s*;/s,
	};

	async init(
		[inputPath, inputContent]: [string | undefined, string | undefined] = ['', '']
	) {
		if (this.utils.size) {
			return;
		}

		let sassConfig: string | undefined = this.defaultSassConfig;

		if (inputPath && inputContent) {
			if (isNode) {
				this.inputFileDir = path.dirname(path.resolve(process.cwd(), inputPath));
			}

			this.inputFileCache = inputContent;
			sassConfig = this.extractUserSassConfig(inputContent);
		}

		await this.loadUtils(sassConfig);
	}

	putContent(id: string, content: string | undefined) {
		if (!content) {
			return;
		}

		this.utilsByFile.set(id, this.extractUtils(content));
	}

	deleteContent(id: string): boolean {
		return this.utilsByFile.delete(id);
	}

	async updateSassConfig(content: string): Promise<void> {
		this.inputFileCache = content;
		const sassConfig = this.extractUserSassConfig(content);

		if (sassConfig) {
			await this.loadUtils(sassConfig);
		}
	}

	async generateCss(): Promise<string> {
		if (this.utils.size === 0) {
			logger.warn('Config with utilities is not loaded!');
			return '';
		}

		if (this.utilsByFile.size === 0) {
			logger.warn('No content to generate CSS was found!');
			return '';
		}

		const mainUtils: string[][] = [];
		const atRuleUtils: string[][] = [];

		for (const [main, withAr] of this.utilsByFile.values()) {
			mainUtils.push(main);
			atRuleUtils.push(withAr);
		}

		const sortedAtRuleUtils = atRuleUtils.flat().sort(this.compareUtilsWithAtRule);
		const allUniqueUtils = [...new Set(mainUtils.flat().concat(sortedAtRuleUtils))];
		const applyStr =
			`\n@include ${this.sassModuleName}.apply(${JSON.stringify(allUniqueUtils)},(),true);`;

		// `compileStringAsync` is almost always faster than `compile` in sass-embedded
		return sass.compileStringAsync(
			this.inputFileCache + applyStr,
			{
				loadPaths: [ this.inputFileDir, 'node_modules' ],
				importers: sassImporters,
			}
		).then(
			({ css }) => css,
			(e) => (logger.error('Sass compilation error.', e), ''),
		);
	}

	private extractUtils(content: string): [string[], string[]] {
		let fixedContent = content.replace(this.utilsRegexps.escapedQuotes, '');
		const allClassNames = fixedContent
			.match(this.utilsRegexps.quotedContent)
			?.reduce(this.filterAndProcessClassStr, []) ?? [];

		fixedContent = fixedContent.replace(this.utilsRegexps.quotedContent, '');

		fixedContent
			.match(this.utilsRegexps.singleQuotedContent)
			?.reduce(this.filterAndProcessClassStr, allClassNames);

		fixedContent
			.replace(this.utilsRegexps.singleQuotedContent, '')
			.match(this.utilsRegexps.backtickQuotedContent)
			?.reduce(this.filterAndProcessClassStr, allClassNames);

		const utilsWithAtRule = new Set<string>();

		const mainUtils = [...allClassNames.join(' ').split(' ').reduce((acc, cssClass) => {
			const utilComponents = cssClass.split('_');
			const utility = utilComponents.find((str) => (
				this.utilsRegexps.utilName.test(str)
			));

			if (utility) {
				const separator = utility.replace(this.utilsRegexps.utilName, '')[0];

				if (separator && !this.utilsRegexps.valueSeparator.test(separator)) {
					return acc;
				}

				const utilName = utility.match(this.utilsRegexps.utilName)?.[0] as string;

				if (
					this.utils.has(utilName) ||
					(utilName[0] === '-' && !this.utilsRegexps.contextUtil.test(utilName))
				) {
					const [atRule] = utilComponents;

					if (
						utilComponents.length > 1 && !atRule.startsWith(utilName) && (
							atRule[0] === '@' ||
							atRule[0] === '<' ||
							(atRule in this.breakpointsMap) ||
							this.breakpoints.find((item) => atRule.startsWith(item))
						)
					) {
						utilsWithAtRule.add(cssClass);
					} else {
						acc.add(cssClass);
					}
				}
			}

			return acc;
		}, new Set<string>())];

		return [mainUtils, [...utilsWithAtRule]];
	}

	private compareUtilsWithAtRule = (a: string, b: string): number => {
		if (a[0] === '@' && b[0] === '@') {
			return 0;
		}

		if (a[0] === '@') {
			return 1;
		}

		if (b[0] === '@') {
			return -1;
		}

		const bpA = a.split('_')[0];
		const bpB = b.split('_')[0];

		if (!(bpA in this.breakpointsMap)) {
			return 1;
		}

		if (!(bpB in this.breakpointsMap)) {
			return -1;
		}

		return this.breakpointsMap[bpA] - this.breakpointsMap[bpB];
	};

	private filterAndProcessClassStr = (acc: string[], str: string) => {
		if (this.utilsRegexps.uppercaseLetter.test(str)) {
			acc.push(
				str.replace(this.utilsRegexps.tooMoreSpaces, ' ').slice(1, -1)
			);
		}

		return acc;
	};

	private extractUserSassConfig(content: string): string | undefined {
		let matchResult = content.match(this.configRegexps.userSettings);

		if (matchResult != null) {
			const userSettings = matchResult.at(-1) as string;
			this.sassModuleName = matchResult[2] ?
				matchResult[2].replace(/\s*as\s*/, '') :
				matchResult[1];

			return this.defaultSassConfig.slice(0, -1) + ` with (${userSettings});`;
		}

		matchResult = content.match(this.configRegexps.sassModuleName);

		if (matchResult != null) {
			this.sassModuleName = matchResult[1];
		}
	}

	private async loadUtils(userConfig = this.defaultSassConfig) {
		const placeholderRules = `
			\n a{ all: map.keys(map.get(ml.$utils-db, "utils", "registry")); }
			\n b{ all: map.keys(map.get(ml.$at-rules-cfg, "breakpoints")); }
		`;
		const { css } = (await sass.compileStringAsync(
			userConfig + placeholderRules,
			{
				style: 'compressed',
				loadPaths: [ __dirname, 'node_modules' ],
				importers: sassImporters,
			}
		));

		const [, rawUtils, rawBreakpoints] = css.split('all:');
		const rawUtilsStrEnd = rawUtils.lastIndexOf('"') - rawUtils.length + 1;
		const rawBpsStrEnd = rawBreakpoints.lastIndexOf('"') - rawBreakpoints.length + 1;

		this.utils = new Set(
			JSON.parse('[' + rawUtils.slice(0, rawUtilsStrEnd) + ']') as string[]
		);

		this.breakpoints =
			JSON.parse('[' + rawBreakpoints.slice(0, rawBpsStrEnd) + ']') as string[];

		this.breakpointsMap = this.breakpoints.reduce((acc, item, i) => {
			// add max-width breakpoints ahead of time so we don't have to calculate them every time
			acc['<' + item] = i - 0.1;
			acc[item] = i;
			return acc;
		}, {} as typeof this.breakpointsMap);
	}
}

export const jitEngine = new JitEngine();
