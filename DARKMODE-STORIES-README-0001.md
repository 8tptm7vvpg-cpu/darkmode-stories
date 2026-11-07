# DARKMODE STORIES

**Current version:** `0.16.2`

DARKMODE STORIES is a child-friendly creative storytelling experience built around speech-to-text, draggable story elements, drawing, original stickers, native device emoji input, parallax, and JPG export.

## Core features

- Cinematic DARKMODE intro
- Pannable Story Canvas
- Lockable move and draw modes
- Black brush drawing on a two-page magazine spread
- Speech-to-text message creation
- Read-aloud support
- Native device emoji keyboard access
- Dynamic sticker library
- Draggable messages, emoji, and stickers
- JPG export
- Darkmode parallax and button animation system

## Open the app

Unzip the archive and keep all files together. Start a local server in that folder:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. For iPhone microphone and share-sheet testing, open an HTTPS-hosted copy in Safari or Chrome.

## GitHub Pages

Upload the unzipped files to the repository root. Under **Settings → Pages**, deploy from **main** and **/(root)**. Open the Pages URL to load `index.html`. If you previously published Stories, replace the old `index.html` with the one included here.

The ZIP keeps even GitHub metadata files flat and renamed. GitHub only auto-detects its workflow and templates at their conventional `.github/` paths. Restore those paths in the deployment repository if you use those integrations.

## Stickers

Add original or properly licensed artwork in the same folder, using `DARKMODE-STORIES-STICKER-<NAME>-0001.svg` or another supported image extension. Use `0002`, `0003`, and so on for more files in the same named series. Run `python DARKMODE-STORIES-GENERATE-STICKER-MANIFEST-0001.py` to refresh the picker. For automated refresh, place `DARKMODE-STORIES-WORKFLOW-REFRESH-STICKERS-0001.yml` inside `.github/workflows/` in the deployment repository.

## Save a story

The JPG contains both pages, the rainbow frame, and the footer below the artboard. It saves the entire spread at any zoom or pan position.

On iPhone and iPad, tap Save, select **Save to Files** in the share sheet, choose a folder, and tap **Save**. If your browser uses a download instead, check its Downloads list. In Safari, the destination is shown under **Settings → Apps → Safari → Downloads**.

## Talk to text and Read Aloud

Tap the microphone to speak. If the browser cannot start speech recognition, tap the smaller input field and use the keyboard microphone or type. Safari's browser recognition depends on Siri, and Amazon Silk uses keyboard dictation. Tap the speaker to hear the story in page order. Stories prefers an installed English voice and retries with a different voice when playback fails. Tap the speaker again to stop playback.

## Rights

Do not add third-party characters, franchise artwork, logos, or sticker packs without documented rights.
