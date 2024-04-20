export default new Proxy(
  {},
  {
    get: (_, property) => {
      if (property === '__esModule') {
        return {};
      }

      throw new Error(`Importing from \`@iconslib/svelte\` directly is not supported.`);
    }
  }
);
