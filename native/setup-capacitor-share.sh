#!/bin/sh
# Wire native sharing into the Mushafuk Capacitor 7 wrapper and refresh its web assets from THIS checkout.
# Usage: native/setup-capacitor-share.sh [/path/to/mushafuk-wrapper]
# - Installs @capacitor/share@7 + @capacitor/filesystem@7 (Share needs a cache file URI; the wrapper's default FileProvider covers cache).
# - Backs up the wrapper's current www/ and android assets before replacing them (nothing is deleted).
# - Never touches signing config, keystores, versionCode/versionName.
set -e
SRC=$(cd "$(dirname "$0")/.." && pwd)
W=${1:-/workspace/mushafuk}
STAMP=$(date +%Y%m%d-%H%M%S)
cd "$W"
[ -f capacitor.config.json ] || { echo "not a Capacitor wrapper: $W" >&2; exit 1; }
[ -d www ] && cp -a www "www.bak-$STAMP"
[ -d android/app/src/main/assets/public ] && cp -a android/app/src/main/assets/public "android-public.bak-$STAMP"
rm -rf www && mkdir www
( cd "$SRC" && cp -r index.html lib.js audio.js lib-list.json privacy.html terms.html quran-uthmani.txt surah-banner.png icon.png yazi-ayahs.json yazi-pages.json yazi-words.json yazi-fonts "$W/www/" )
rm -rf www/yazi-fonts/qcf          # QCF page fonts download at first run (patch-index.cjs)
node patch-index.cjs
npm install --no-audit --no-fund @capacitor/share@^7 @capacitor/filesystem@^7
npx cap sync android
echo "OK: web assets from $SRC, plugins synced. Backups: www.bak-$STAMP, android-public.bak-$STAMP"
