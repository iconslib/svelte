# @iconslib/svelte

Open source icons for your next Svelte project.

## Installing

To install the package please run:

```bash
npm install @iconslib/svelte
# or for yarn
yarn add @iconslib/svelte
# or for pnpm
pnpm install @iconslib/svelte
```

## Developing

Once you've forked this project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), run `npm run prepare` to download and prepare icon packs.

Everything inside `src/lib` is part of the library.

## Building

To build this library run:

```bash
npm run package
```

This will download and prepare all the icon packs.

## How to add a new pack

1. Add a corresponding folder into `packs` folder
2. Add a `prepare.mjs` file into the newly created directory
3. Use other `prepare.mjs` files as an inspiration to create the script for the pack you are going to add
4. Add new script to `scripts/prepare.mjs` file
5. Run your script via `npm run prepare <new-pack-slug>`
6. Add new exports to `package.json` (check other exports for an example)
7. Test if icons import and display normally
8. Build
9. Commit
10. PR
