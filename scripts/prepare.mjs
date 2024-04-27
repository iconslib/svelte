#!/usr/bin/env node

import { Command } from 'commander';

import prepareHeroicons from '../packs/heroicons/prepare.mjs';
import prepareIonicons from '../packs/ionicons/prepare.mjs';
import prepareFeather from '../packs/feather/prepare.mjs';
import prepareRadix from '../packs/radix/prepare.mjs';
import prepareOcticons from '../packs/octicons/prepare.mjs';

const packs = {
  heroicons: prepareHeroicons,
  ionicons: prepareIonicons,
  feather: prepareFeather,
  radix: prepareRadix,
  octicons: prepareOcticons
};

const program = new Command();

program
  .description('Prepare SVG icons from a pack to be compatible with Svelte')
  .argument('[name]', 'A pack name to process')
  .option('-a, --all', 'if should process all packs')
  .option('-p, --progress', 'if should show progress')
  .option('-v, --verbose', 'if should be verbose')
  .action(async (name, options) => {
    if (options.all) {
      await Promise.all([...Object.values(packs).map((fn) => fn(options))]);
      return;
    }

    if (name) {
      if (!packs[name]) {
        throw new Error(
          `No pack with that name. Available packs are: ${Object.keys(packs).join(', ')}`
        );
      }

      await packs[name](options);
    }
  });

program.parse(process.argv);
