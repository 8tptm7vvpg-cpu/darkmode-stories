# DARKMODE STORIES

**Current version:** `0.14.5`

DARKMODE STORIES is a child-friendly creative storytelling experience built around speech-to-text, draggable story elements, drawing, original stickers, native device emoji input, parallax, and JPG export.

## Core features

- Cinematic DARKMODE intro
- Pannable Story Canvas
- Lockable move and draw modes
- Scratch-to-reveal rainbow artwork
- Speech-to-text message creation
- Read-aloud support
- Native device emoji keyboard access
- Dynamic sticker library
- Draggable messages, emoji, and stickers
- JPG export
- Darkmode parallax and button animation system

## GitHub Pages

1. Upload the unzipped project contents to the repository root.
2. Open **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select **main** and **/(root)**.
5. Save.

## Dynamic stickers

Add original or properly licensed artwork to `assets/stickers/`.

The included GitHub Action rebuilds `manifest.json` whenever sticker files change.

## Local preview

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Rights

Do not add third-party characters, franchise artwork, logos, or sticker packs without documented rights.


## Speech compatibility

- Android Chrome uses one utterance per microphone session to prevent duplicated transcripts.
- Amazon Silk uses keyboard dictation because browser-based `SpeechRecognition` may not have working microphone access even when the API object is present.


## Fire tablet Read Aloud

Version 0.14.4 retries text-to-speech using shorter chunks and a loaded English voice. If Amazon Silk blocks speech synthesis in the Kids browser, the app displays a notice rather than silently appearing to do nothing.
