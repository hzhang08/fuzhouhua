# Fuzhouhua

A static Fuzhou speech learning app built with Vue 2, Bootstrap, and the YouTube IFrame API. Search a Chinese word or phrase to hear it in context. Matching text is highlighted; next/previous navigate matches, and replay/pause control playback. Pause changes to Resume so you can continue from the current position. The button also follows pauses made with YouTube's own controls.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Internet access is needed for the CDN libraries and YouTube player. There is no build step or backend.

## Caption data

`subtitles.json` is the runtime search index: a flat array of `{index, start, end, content, videoid}`. Indices must be globally sequential and one-based because match navigation uses them as offsets. Timestamps use `HH:MM:SS,mmm`; playback preserves fractional seconds. `fuzhou1.json` is a historical sample and is not loaded by the app.

The index contains 8,236 captions across 15 videos. The original 2,099 entries are preserved. See [CAPTIONS.md](CAPTIONS.md) for the ten newly integrated videos, downloadable subtitles, extraction notes, and the known uncertain glyph.

To update the imported captions, edit the per-video JSON in `captions/` and run `python3 scripts/build_captions.py`. The importer replaces only videos listed in `captions/videos.json`, retains other videos, and regenerates global indices. Repeated imports do not duplicate captions.

## Validate

```sh
python3 scripts/build_captions.py --check
node tests/search.test.js
```
