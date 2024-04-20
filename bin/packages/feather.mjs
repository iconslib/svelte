import fs from 'node:fs/promises';
import { optimize } from 'svgo';
import cliProgress from 'cli-progress';

import {
	clear,
	collectFiles,
	dashCaseToClassCase,
	modifySvelteSvgComponent,
	renderStub,
	verifyDirectoriesExist
} from '../helpers.mjs';

export default async function main(options = { verbose: false, progress: false }) {
	const outputPath = `./src/lib/feather`;
	const cliProgressBar = new cliProgress.SingleBar(
		{
			format: 'Feather | {percentage}% | {bar} || {value}/{total} Icons'
		},
		cliProgress.Presets.shades_classic
	);

	await clear({ path: outputPath });

	const files = await collectFiles({ path: 'node_modules/feather-icons/dist/icons' });

	if (options.progress) {
		cliProgressBar.start(files.length, 0);
	}

	for (const file of files) {
		const fileContent = await fs.readFile(file.path);
		const optimizedFileContent = optimize(fileContent, {
			plugins: [
				'preset-default',
				'removeDimensions',
				'sortAttrs',
				'cleanupListOfValues',
				{
					name: 'removeAttrs',
					params: {
						attrs: ['stroke', 'path:stroke-width']
					}
				},
				{
					name: 'addAttributesToSVGElement',
					params: {
						attributes: [
							{
								'stroke-width': '2',
								'aria-hidden': 'true'
							}
						]
					}
				}
			]
		});

		const newFileName = dashCaseToClassCase(file.name);
		const newPath = `${outputPath}/esm/${newFileName}.svelte`;
		await verifyDirectoriesExist({ path: newPath });

		const componentContent = await renderStub({
			stub: 'component',
			content: optimizedFileContent.data
		});
		const modifiedComponentContent = modifySvelteSvgComponent({ content: componentContent });

		await fs.writeFile(newPath, modifiedComponentContent);

		await fs.appendFile(
			`${outputPath}/index.js`,
			`export { default as ${newFileName} } from './esm/${newFileName}.svelte'; \n`
		);

		if (options.progress) {
			cliProgressBar.increment();
		}

		if (options.verbose) {
			console.log(`---> Processed ${newFileName} component`);
		}
	}

	cliProgressBar.stop();
}
