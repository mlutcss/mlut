import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from 'chai';
import { JitEngine } from '../../packages/core/src/jit/JitEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('JitEngine', () => {
	const htmlContent0 = '<div class="P1r">000</div>';
	const htmlContent1 = '<div class=" D-f Olm2;fc;tp;d">111</div>';

	const htmlPath0 = '/tmp/mlut-test0.html';
	const htmlPath1 = '/tmp/mlut-test1.html';

	const tplContent0 = '<section class="W80p md_W100p lg_P10u">...</section>';
	const tplContent1 = '<footer class="W95p sm_W60p md_W100p">Copyright mlut</footer>';
	const tplContent2 = '<aside class="P3u sm_P4u">Additional content</aside>';

	const tplPath0 = 'section.ejs';
	const tplPath1 = 'footer.ejs';
	const tplPath2 = 'aside.ejs';

	const sassInputPath = '/tmp/mlut-input.scss';

	const sassInputContent = `
@use 'sass:list';
@use "${path.join(__dirname, '../../packages/core/tools')}" as testou with (
	$utils-data: (
		'utils': (
			'registry': (
				'Olm': (
					'properties': outline-magick,
					'conversion': 'outline',
					'keywords': ('sizing', 'line-style', 'line-width'),
				),
			),
		),
	),
);
@use 'sass:meta';

@include testou.apply('C-ih');
`;

	/* eslint-disable */
	const extractUtilsContent = `
<div class="
D-n
xl_D
@:pfrm_-Try0 Pb6u md:lg_D-t Ps Lol5    md_Mxh130vh Ps
-Ctx -Ctx0 -Ctx-one

sm_Gc-s1 ^one_Bgc-$bgColor?#c06_h Ct-'id:';attr(id)_b
">
Lorem \`Ipsum\`
</div>

<style type="text/css" data-vite-dev-id="C:/Users/mister/Documents/web/ptoject/src/App.vue?vue&amp;type=style">

const myStr = "simpl'e text" + ' testou' + "" + "hi@150.lv";
const wrapperCss = "M1u	 -Myvar=block \\"Ps\\" d-g";

<MyComponent className={cn('D-f \\'Gap5u', wrapperCss)}/>
` + "\n<button className={`D-ib ${flag ? 'Bgc#f00' : ''}`}>Clear</div>";
	/* eslint-enable */

	it('extract utils from the content', async () => {
		const jit = new JitEngine();
		const utilsWithAtRules =
			'let a = "lg_D <sm_D @:o_D D Lil xxl_D lg:<xxl_D C-cc_h <xl_D"';

		await jit.init();

		assert.deepEqual(
			//@ts-expect-error
			jit.extractUtils(extractUtilsContent),
			[
				[
					'D-n',
					'Pb6u',
					'Ps',
					'^one_Bgc-$bgColor?#c06_h',
					//eslint-disable-next-line
					"Ct-'id:';attr(id)_b",
					'M1u',
					'-Myvar=block',
					'D-f',
					'Gap5u',
					'Bgc#f00',
					'D-ib',
				],
				[
					'xl_D',
					'@:pfrm_-Try0',
					'md:lg_D-t',
					'md_Mxh130vh',
					'sm_Gc-s1',
				],
			],
		);

		//@ts-expect-error
		const [utils, arUtils] = jit.extractUtils(utilsWithAtRules);

		assert.deepEqual(
			//@ts-expect-error
			[utils, arUtils.sort(jit.compareUtilsWithAtRule)],
			[
				[
					'D',
					'C-cc_h',
				],
				[
					'<sm_D',
					'lg_D',
					'<xl_D',
					'xxl_D',
					'lg:<xxl_D',
					'@:o_D',
				],
			],
		);
	});

	it('generate CSS from the file', async () => {
		const jit = new JitEngine();
		await jit.init([sassInputPath, sassInputContent]);
		await jit.init(['BROKEN/PATH', 'NONE']);

		/* eslint-disable */
		const cssOutput = `.C-ih {
  color: inherit;
}

.P1r {
  padding: 1rem;
}

.D-f {
  display: flex;
}

.Olm2\\;fc\\;tp\\;d {
  outline-magick: 2px fit-content transparent dotted;
}`;
		/* eslint-enable */

		jit.putContent(htmlPath0, htmlContent0);
		jit.putContent(htmlPath1, htmlContent1);

		assert.equal(
			await jit.generateCss(),
			cssOutput,
		);
	});

	it('generate utils in the correct order from several files', async () => {
		const jit = new JitEngine();
		await jit.init();

		jit.putContent(tplPath0, tplContent0);
		jit.putContent(tplPath1, tplContent1);
		jit.putContent(tplPath2, tplContent2);

		const result = await jit.generateCss();
		const wUtilOnMdPos = result.indexOf('md_W100p');
		const wUtilOnSmPos = result.indexOf('sm_W60p');
		const pUtilOnMdPos = result.indexOf('lg_P10u');
		const pUtilOnSmPos = result.indexOf('sm_P4u');

		assert.isTrue(wUtilOnSmPos > -1 && pUtilOnSmPos > -1);
		assert.isAbove(wUtilOnMdPos, wUtilOnSmPos);
		assert.isAbove(pUtilOnMdPos, pUtilOnSmPos);
	});
});
