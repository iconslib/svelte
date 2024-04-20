import path from 'node:path';
import fs from 'node:fs/promises';
import { Edge } from 'edge.js';

const edge = Edge.create();
edge.mount(new URL('../stubs', import.meta.url));

export function dashCaseToClassCase(input) {
	const inputToCamelCase = input.replace(/-([a-z0-9])/g, (_, match) => match.toUpperCase());
	const inputToClassCase = `${inputToCamelCase.charAt(0).toUpperCase()}${inputToCamelCase.slice(1)}`;
	return inputToClassCase;
}

export async function collectFiles({ path: pathToProcess }) {
	let svgFiles = [];

	async function traverse(pathToProcess) {
		const files = await fs.readdir(pathToProcess);

		for (const file of files) {
			const filePath = path.join(pathToProcess, file);
			const fileStat = await fs.stat(filePath);

			if (fileStat.isDirectory()) {
				await traverse(filePath);
			} else {
				if (path.extname(filePath).toLowerCase() === '.svg') {
					const { name } = path.parse(file);
					svgFiles.push({ name, path: filePath });
				}
			}
		}
	}

	await traverse(pathToProcess);

	return svgFiles;
}

export async function verifyDirectoriesExist({ path: pathToProcess }) {
	const pathToProcessDir = pathToProcess.replace(/\/[^/]+\.\w+$/, '');

	try {
		await fs.stat(pathToProcessDir);
	} catch (error) {
		if (error.code === 'ENOENT') {
			await fs.mkdir(pathToProcessDir, { recursive: true }); // Create the directory recursively
		}
	}
}

export async function clear({ path: pathToClear, verbose = false }) {
	try {
		await fs.access(pathToClear);
		await fs.rm(pathToClear, { recursive: true, force: true });
		verbose && console.log('---> Cleared path:', pathToClear);
	} catch (error) {
		if (error.syscall === 'access' && error.code === 'ENOENT') {
			verbose && console.log('---> Path is clear:', pathToClear);
		} else {
			throw new Error(error);
		}
	}
}

export async function renderStub({ stub, content }) {
	const renderedContent = await edge.render(stub, { content });

	return renderedContent;
}

export function modifySvelteSvgComponent({ content }) {
	return content.replace(/(<svg\s*(.*?)>)/, (match, p1) => {
		return `${p1.slice(0, -1)} {...all}>`;
	});
}
