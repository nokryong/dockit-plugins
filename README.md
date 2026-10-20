# Dockit Plugins

English · [한국어](README.ko.md)

This repository holds plugins for Dockit, one folder per plugin. New plugins and updates are merged after review through pull requests.

## Install

In Dockit Open, open **Plugins → Install plugin** and enter this address:

```text
https://github.com/nokryong/dockit-plugins
```

If the repository has more than one plugin, choose the one to install. You can also enter the address of a single plugin folder.

| Plugin | Author | Install address |
|---|---|---|
| Dice | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/dice |
| Image Search | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/image-search |
| Korean Dictionary | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/dictionary |
| Calendar | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/calendar |
| Music Player | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/music-player |

Each plugin folder has a `README.md` describing what the plugin does, the services and permissions it uses, and where it stores data.

## Development

```sh
npm ci
npm test
npm run build
npm run check
```

```text
plugins/
  dice/
    manifest.json
    source/
    dist/
    THIRD_PARTY_NOTICES.txt
```

Submit new plugins and updates as pull requests by following the [contribution guide](CONTRIBUTING.md). The shared API and package format are maintained in the [Plugin SDK](https://github.com/nokryong/dockit-plugin-sdk).
