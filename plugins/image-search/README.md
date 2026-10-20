# Image Search

English · [한국어](README.ko.md)

Search Pixabay photos, illustrations and vector graphics, view them large, and download them.

- ID: `dockit.image-search`
- Author: nokryong

## How to use

1. Use the key button in the title bar (**Set Pixabay API key**) to register your own [Pixabay API key](https://pixabay.com/api/docs/).
2. Enter a search term. Click a result to open a large preview, where you can download it, copy it or open its source page.

## Network and permissions

| Permission | Purpose |
|---|---|
| `credentials` | The host keeps your Pixabay API key and attaches it to requests. The plugin never receives the key itself. |
| `network` | Searches through `https://pixabay.com/api/`. |
| `images` | Loads images from `pixabay.com` and `cdn.pixabay.com`. |
| `external` | Opens Pixabay source and author pages in your default browser. |
| `storage` | Caches search results for 24 hours. |

The API key is saved separately on each device (in the OS-encrypted store on desktop, and encrypted in the current browser on the web). It is not synced to your account, so register it again in other browsers.

## Limitations

Use is subject to Pixabay's terms of service and rate limits.
