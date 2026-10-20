# Korean Dictionary

English · [한국어](README.ko.md)

Looks up Korean words in Urimalsaem, the open dictionary of the National Institute of Korean Language, and shows their meanings, parts of speech and origins.

- ID: `dockit.dictionary`
- Author: nokryong

## How to use

Type a word and press Enter. If there are many results, use **Show more** at the bottom to see the rest.

## Network and permissions

| Permission | Purpose |
|---|---|
| `network` | Searches through `https://dockit.kr/api/dictionary`. |

The Dockit server holds the Urimalsaem API key and runs the lookup for you, so you do not need your own API key. Nothing is sent except the search term, and the plugin stores no data.

## Limitations

Searches can fail depending on the status of the Dockit server or Urimalsaem. If you exceed the server's rate limit, try again after a while.
