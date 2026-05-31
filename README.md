# WhiteWash

> Transparent → white background. Right in your browser.

WhiteWash flattens transparent **PNGs** onto fresh white pixels and tucks a white
sheet behind **SVGs** so they stay vector. Drop in a single file or a whole basket,
preview the before/after, and download — one file at a time or all at once as a `.zip`.

**Everything runs locally.** No image is ever uploaded to a server.

## Features

- 🧺 **Batch processing** — drag & drop or pick multiple PNGs and SVGs at once
- 🖼️ **PNG flattening** — a white layer is composited under the alpha channel via `<canvas>` and re-encoded as PNG
- ✒️ **SVG stays vector** — a `<rect width="100%" height="100%" fill="#fff"/>` is inserted as the first child, rendering behind the artwork
- 👀 **Before / after preview** — each result shows the original (on a checkerboard) next to the whitened version
- 📦 **Download individually or as a `.zip`** (via [JSZip](https://stuk.github.io/jszip/))
- 🔒 **100% client-side** — originals are untouched and nothing leaves your machine
- 🫧 Soap-bubble cursor trail and a washing-machine theme, because why not

## Usage

It's a static site — no build step, no dependencies to install.

1. Open [`index.html`](index.html) directly in a browser, **or** serve the folder:
   ```bash
   # Python
   python -m http.server 8000
   # or Node
   npx serve .
   ```
   then visit `http://localhost:8000`.
2. Drag transparent PNGs/SVGs onto the drum (or click **choose files**).
3. Review the before/after cards and download what you need.

> [!NOTE]
> An SVG without a `viewBox` or explicit `width`/`height` can't resolve `100%`,
> so the white rect may not fill. Those files are flagged in the UI and may need
> fixed dimensions added.

## How it works

| Type | Technique |
|------|-----------|
| **PNG** | Draw a white `fillRect` onto a canvas the size of the image, draw the image on top, then `canvas.toBlob(...)` as `image/png`. |
| **SVG** | Parse the opening `<svg>` tag and inject a full-size white `<rect>` as the first child so it paints behind everything; output stays editable vector. |

All logic lives in [`app.js`](app.js); styling is in [`styles.css`](styles.css).

## Project structure

```
WhiteWash/
├── index.html    # markup + JSZip/font CDN links
├── styles.css    # the washing-machine theme
├── app.js        # file handling, PNG/SVG whitening, rendering, zip
└── LICENSE       # MIT
```

## Browser support

Works in any modern browser with `<canvas>`, the File API, and Blob URLs.
The bubble cursor trail and animations respect `prefers-reduced-motion`.

## License

[MIT](LICENSE) © 2026 Pietari Pennanen
