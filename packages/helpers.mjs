import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { Readable } from 'node:stream';
import { Edge } from 'edge.js';
import decompress from 'decompress';

const edge = Edge.create();
edge.mount(new URL('../stubs', import.meta.url));

export function dashCaseToClassCase(input) {
	const inputToCamelCase = input.replace(/-([a-z0-9])/g, (_, match) => match.toUpperCase());
	const inputToClassCase = `${inputToCamelCase.charAt(0).toUpperCase()}${inputToCamelCase.slice(1)}`;
	return inputToClassCase;
}

export async function downloadPackage({ url, path: pathToSave }) {
	console.log('---> Downloading package from:', url);

	const response = await fetch(url);

	if (!response.ok || !response.body) {
		throw new Error('Cannot download package');
	}

	console.log('---> Writing downloaded package to:', pathToSave);

	await new Promise((resolve, reject) => {
		const writer = fs.createWriteStream(pathToSave);
		Readable.fromWeb(response.body).pipe(writer);

		writer.on('error', (error) => reject(error));
		writer.on('finish', () => resolve(true));
	});
}

export async function unpackPackage({ archivePath, path: pathToUnpack }) {
	console.log('---> Decompressing downloaded package:', archivePath);
	await decompress(archivePath, pathToUnpack);
}

export async function collectFiles({ path: pathToProcess }) {
	let svgFiles = [];

	async function traverse(pathToProcess) {
		const files = await fsp.readdir(pathToProcess);

		for (const file of files) {
			const filePath = path.join(pathToProcess, file);
			const fileStat = await fsp.stat(filePath);

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

export async function ensureDirectory({ path: pathToProcess }) {
	const pathToProcessDir = pathToProcess.replace(/\/[^/]+\.\w+$/, '');

	try {
		await fsp.stat(pathToProcessDir);
	} catch (error) {
		if (error.code === 'ENOENT') {
			await fsp.mkdir(pathToProcessDir, { recursive: true }); // Create the directory recursively
		}
	}
}

export async function clearDirectory({ path: pathToClear }) {
	try {
		await fsp.access(pathToClear);
		await fsp.rm(pathToClear, { recursive: true, force: true });
		console.log('---> Cleared path:', pathToClear);
	} catch (error) {
		if (error.syscall === 'access' && error.code === 'ENOENT') {
			console.log('---> Path is clear:', pathToClear);
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
