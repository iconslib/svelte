import fs from 'node:fs/promises';
import { optimize } from 'svgo';
import cliProgress from 'cli-progress';

import {
  clearDirectory,
  ensureDirectory,
  downloadPackage,
  unpackPackage,
  collectFiles,
  dashCaseToClassCase,
  modifySvelteSvgComponentV4,
  renderStub
} from '../helpers.mjs';

const PKG_SLUG = 'feather';
const PKG_NAME = 'Feather';
const PKG_URL = 'https://github.com/feathericons/feather/archive/refs/heads/main.zip';

export default async function main(options = { verbose: false, progress: false }) {
  const outputPath = `./src/lib/${PKG_SLUG}`;
  const sourcePath = `./packs/${PKG_SLUG}/source`;
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

  const files = await collectFiles({ path: `${sourcePath}/feather-main/icons` });

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
            attrs: ['class', 'stroke', 'path:stroke-width']
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
    await ensureDirectory({ path: newPath });

    const componentContent = await renderStub({
      stub: 'component-v4',
      content: optimizedFileContent.data
    });
    const modifiedComponentContent = modifySvelteSvgComponentV4({ content: componentContent });

    await fs.writeFile(newPath, modifiedComponentContent);

    await fs.appendFile(
      `${outputPath}/index.ts`,
      `export { default as ${newFileName} } from './esm/${newFileName}.svelte'; \n`
    );

    if (options.progress) {
      cliProgressBar.increment();
    }

    if (options.verbose) {
      console.log(`---> Processed ${newFileName} component`);
    }
  }

  console.log(`---> Finished processing of '${PKG_NAME}' pack`);
  cliProgressBar.stop();
}
