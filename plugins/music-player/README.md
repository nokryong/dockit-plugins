# Music Player

English · [한국어](README.ko.md)

Choose a music folder on your computer and play the songs in it.

- ID: `dockit.music-player`
- Author: nokryong

## How to use

Choose a music folder with the **+** button in the title bar (**Choose music folder**) or the folder button. The audio files in that folder, including subfolders, are added to the playlist in name order. Choosing another folder replaces the playlist. You can switch the repeat mode (Repeat all → Repeat one → Play list once), skip to the previous or next song, play or pause, and change the volume.

## Data and permissions

| Permission | Purpose |
|---|---|
| `storage` | Saves playback settings such as the volume. |

Music files are never uploaded or copied. The chosen folder plays only in the current window; after closing the toolkit or reopening the app, choose the folder again. This plugin does not connect to the internet.

## Limitations

Only audio formats supported by the browser or app can be played.
