# Calendar

English · [한국어](README.ko.md)

Pick a date on a monthly calendar to add and remove events.

- ID: `dockit.calendar`
- Author: nokryong

## How to use

Use the **+** button in the title bar (**Add event**) to open the event form, then enter the event and its date. Use the arrows to move between months, and click a date to see that day's events below. Click **×** on an event to delete it.

## Data and permissions

| Permission | Purpose |
|---|---|
| `storage` | Keeps your events in plugin storage. |

- Dockit Open: saved in `.dockit/plugin-data/dockit.calendar/storage.json`.
- Dockit Web: synced to your account when signed in, so events also appear in other browsers; otherwise saved only in the current browser.

This plugin does not connect to the internet.

## Limitations

Public holidays are not shown.
