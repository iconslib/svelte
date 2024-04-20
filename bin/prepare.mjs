#!/usr/bin/env node

import { Command } from 'commander';

import prepareHeroicons from '../packages/heroicons/prepare.mjs';
import prepareIonicons from '../packages/ionicons/prepare.mjs';
import prepareFeather from '../packages/feather/prepare.mjs';
import prepareRadix from '../packages/radix/prepare.mjs';

const packages = {
  heroicons: prepareHeroicons,
  ionicons: prepareIonicons,
  feather: prepareFeather,
  radix: prepareRadix
};

const program = new Command();

program
  .description('Prepare SVG icons from a package to be compatible with Svelte')
  .argument('[name]', 'A package name to process')
  .option('-a, --all', 'if should process all packages')
  .option('-p, --progress', 'if should show progress')
  .option('-v, --verbose', 'if should be verbose')
  .action(async (name, options) => {
    if (options.all) {
      await Promise.all([...Object.values(packages).map((fn) => fn(options))]);
      return;
    }

    if (name) {
      if (!packages[name]) {
        throw new Error(
          `No package with that name. Available packages are: ${Object.keys(packages).join(', ')}`
        );
      }

      await packages[name](options);
    }
  });

program.parse(process.argv);
