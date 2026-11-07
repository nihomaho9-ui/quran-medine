# Native sharing (Android wrapper)

The web code shares through Capacitor when it runs inside the app (`window.Capacitor.isNativePlatform()`):
the image is written as a PNG to the app cache with `@capacitor/filesystem` and handed to `@capacitor/share` as a file URI.
Text uses `Share.share({ text })`. Cancel is silent; failures show a translated message. In browsers it falls back to
Web Share, then to PNG download (image) or clipboard (text).

The Android WebView has no Web Share API, and a `blob:` download does nothing there. That's why the old image share
did nothing in the app.

## Wrapper setup (one time, before building an AAB from this branch)
```
native/setup-capacitor-share.sh /workspace/mushafuk
```
This installs `@capacitor/share@^7` and `@capacitor/filesystem@^7`, refreshes `www/` from **this checkout** (it doesn't use the
old `prep.sh` source), runs `patch-index.cjs` and `npx cap sync android`, and backs up the previous `www/` and Android assets.
The existing `res/xml/file_paths.xml` already has `<cache-path>`. Signing, keystores and version numbers aren't touched.

## Tests
`NODE_PATH=<dir with jsdom> node tests/<file>.test.js` (jsdom with fake Audio and Capacitor; no device).
