# Adding and updating plugins

English · [한국어](CONTRIBUTING.ko.md)

1. Fork this repository and add or update your plugin in `plugins/<name>/`.
2. Fill in the publisher, version, icon and permissions in `manifest.json`. Keep the ID of an existing plugin.
3. Put the source code in `source/` and the build output in `dist/`. Point `widgets[].entry` in `manifest.json` at the built entry file, for example `dist/index.html`.
4. Run `npm ci`, `npm run build` and `npm run check`, then install and run the plugin in Dockit to confirm it works.
5. Submit the source code, the build output and any required license notices together in one pull request.

The maintainer, `nokryong`, reviews the code, the permissions, whether the build output matches the source, and how the plugin actually behaves before merging. Updates go through the same process. Plugins that load additional executable code from external addresses are not accepted.

For the plugin API and file format, see the [Dockit Plugin SDK](https://github.com/nokryong/dockit-plugin-sdk).
