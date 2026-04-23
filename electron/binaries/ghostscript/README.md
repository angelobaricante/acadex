# Ghostscript Binary

Place the Ghostscript executable in this directory for packaged builds.

## Expected binary names

- Windows: `gswin64c.exe`
- macOS/Linux: `gs`

`electron/main.ts` and `electron/compressors/compressPdf.ts` resolve this folder in both dev and packaged modes.
