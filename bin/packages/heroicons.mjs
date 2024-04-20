import fs from 'node:fs/promises';
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
	const outputPath = `./src/lib/heroicons`;
	const cliProgressBar = new cliProgress.SingleBar(
		{
			format: 'Heroicons | {percentage}% | {bar} || {value}/{total} Icons'
		},
		cliProgress.Presets.shades_classic
	);

	await clear({ path: outputPath });

	const files = await collectFiles({ path: 'node_modules/heroicons/' });

	if (options.progress) {
		cliProgressBar.start(files.length, 0);
	}

	for (const file of files) {
		const fileContent = await fs.readFile(file.path);

		const [_, size, style] = file.path.match(/\/(\d+)\/([^/]+)\/[^/]+\.svg$/);
		if (!size && !style) {
			throw new Error('Invalid file path format');
		}

		const newFileName = dashCaseToClassCase(file.name);
		const newPath = `${outputPath}/${size}/${style}/esm/${newFileName}.svelte`;
		await verifyDirectoriesExist({ path: newPath });

		const componentContent = await renderStub({ stub: 'component', content: fileContent });
		const modifiedComponentContent = modifySvelteSvgComponent({ content: componentContent });

		await fs.writeFile(newPath, modifiedComponentContent);

		await fs.appendFile(
			`${outputPath}/${size}/${style}/index.js`,
			`export { default as ${newFileName} } from './esm/${newFileName}.svelte'; \n`
		);

		if (options.progress) {
			cliProgressBar.increment();
		}

		if (options.verbose) {
			console.log(`---> Processed ${newFileName} component in ${size}/${style}`);
		}
	}

	cliProgressBar.stop();
}
