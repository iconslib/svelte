import fsp from 'node:fs/promises';
import cliProgress from 'cli-progress';

import {
	clearDirectory,
	ensureDirectory,
	collectFiles,
	dashCaseToClassCase,
	downloadPackage,
	modifySvelteSvgComponent,
	renderStub,
	unpackPackage
} from '../helpers.mjs';

const PKG_SLUG = 'heroicons';
const PKG_NAME = 'Heroicons';
const PKG_URL = 'https://github.com/tailwindlabs/heroicons/archive/refs/heads/master.zip';

export default async function main(options = { verbose: false, progress: false }) {
	const outputPath = `./src/lib/${PKG_SLUG}`;
	const sourcePath = `./packages/${PKG_SLUG}/source`;
	const cliProgressBar = new cliProgress.SingleBar(
		{
			format: `---> Processing | ${PKG_NAME} | {percentage}% | {bar} || {value}/{total} Icons`
		},
		cliProgress.Presets.shades_classic
	);

	await clearDirectory({ path: outputPath });
	await ensureDirectory({ path: outputPath });

	await clearDirectory({ path: sourcePath });
	await ensureDirectory({ path: sourcePath });

	await downloadPackage({ url: PKG_URL, path: `${sourcePath}/${PKG_SLUG}-downloaded.zip` });
	await unpackPackage({
		archivePath: `${sourcePath}/${PKG_SLUG}-downloaded.zip`,
		path: sourcePath
	});

	const files = await collectFiles({ path: `${sourcePath}/${PKG_SLUG}-master/optimized` });

	if (options.progress) {
		cliProgressBar.start(files.length, 0);
	}

	for (const file of files) {
		const fileContent = await fsp.readFile(file.path);

		const [_, size, style] = file.path.match(/\/(\d+)\/([^/]+)\/[^/]+\.svg$/);
		if (!size && !style) {
			throw new Error('Invalid file path format');
		}

		const newFileName = dashCaseToClassCase(`${file.name}-${size}-${style}`);
		const newPath = `${outputPath}/esm/${newFileName}.svelte`;
		await ensureDirectory({ path: newPath });

		const componentContent = await renderStub({ stub: 'component', content: fileContent });
		const modifiedComponentContent = modifySvelteSvgComponent({ content: componentContent });

		await fsp.writeFile(newPath, modifiedComponentContent);

		await fsp.appendFile(
			`${outputPath}/index.ts`,
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
