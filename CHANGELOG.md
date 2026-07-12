# Changelog

## [0.14.3] - 2026-07-12

### Fixed

- Improved microphone reliability in Chrome on iPhone.
- The second microphone tap now immediately posts the latest captured words.
- Interim iOS transcript text is preserved even when no final event arrives.
- Prevented delayed onend callbacks from posting the same message twice.
- Increased the non-Android microphone startup watchdog to five seconds.
- Added a visual captured-text state while words are available to post.

## [0.14.2] - 2026-07-12

### Fixed

- Replaced a fragile multi-line HTML string in the sticker fallback.
- Prevented Chrome from failing to parse the entire JavaScript file.
- Restored all button and interaction handlers.
- Added a JavaScript boot marker and runtime error logging.

## [0.14.1] - 2026-07-12

### Fixed

- Removed a duplicated Read Aloud code fragment that caused a JavaScript syntax error.
- Restored all button interactions in Chrome and other browsers.
- Validated the complete application script with Node.js syntax checking.

## [0.14.0] - 2026-07-12

### Added

- Added a dedicated post button to the right of Silk keyboard dictation.
- Added Version 0.14.0 to the splash screen.
- Expanded the first-run Storyboard instructions.

### Fixed

- Keyboard-dictated words on Silk now post directly to the Storyboard.
- Read Aloud now includes readable text entered through the emoji/native-keyboard control.
- Every non-microphone function button immediately stops active listening.
- Text bubbles now stack vertically beneath one another instead of overlapping.

### Changed

- Renamed visible Artboard terminology to Storyboard.

## [0.13.0] - 2026-07-12

### Fixed

- Prevented Android speech recognition from repeating the same phrase multiple times.
- Android now uses a single-utterance recognition mode with interim results disabled.
- Added normalized transcript deduplication.
- Added a startup watchdog so the microphone cannot remain visually stuck on.
- The mic button now reliably cancels an active or starting session.

### Changed

- Amazon Silk uses a keyboard-dictation fallback because Silk may expose the Web Speech constructor without completing microphone recognition.
- Silk's second microphone tap closes the fallback and resets the button.
- Added explicit Add to Story and Cancel controls for keyboard dictation.

## [0.12.0] - 2026-07-12

### Fixed

- New speech-to-text messages now appear inside the currently visible Story Canvas.
- Message placement accounts for the current artboard pan position.
- Consecutive messages stack with small alternating offsets.

### Changed

- Replaced the large crosshair with a compact neon brush cursor.
- Reduced the black brush diameter from 72 px to 36 px.
- Added a smoother message-arrival animation.

## [0.11.0] - 2026-07-12

### Changed

- Story Canvas now opens with the bright rainbow gradient visible.
- Draw Mode now paints with a thick black brush.
- Floating dock remains visible within the mobile viewport.
- Story Canvas reserves space so the dock does not cover controls.
- Message bubbles are larger, heavier, and more child-friendly.
- Sticker touch targets are larger and stay visible while dragging.
- Active sticker receives a strong selected glow.
- JPG export includes a centered DARKMODE STORIES footer watermark.
- Draw Mode includes an oversized live crosshair target.

## [0.10.0] - 2026-07-12

### Added

- Formal semantic versioning
- Changelog and roadmap
- Contribution guidelines
- GitHub issue templates
- Pull request template
- Release checklist
- Repository governance files

### Included from Version 9

- Modular project structure
- Native device emoji workflow
- Dynamic sticker manifest
- GitHub sticker automation
- Darkmode brand standards
- Parallax and animated controls
- Story Canvas, drawing, speech, read-aloud, and JPG export

## [0.9.0] - 2026-07-12

- Converted prototype into a modular GitHub-ready project.
