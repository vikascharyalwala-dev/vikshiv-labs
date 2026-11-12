#!/usr/bin/env bash
# Downloads the free Mixkit stock clips into each section folder, so the site
# works offline. Your own files with the same names are never overwritten.
# Run from the site folder:  bash scripts/download-media.sh
# Mixkit License: free for commercial use, no attribution required.
set -e
cd "$(dirname "$0")/../assets"
clips=(
  "hero/hero:100855" "work/film-1:44060" "work/film-2:101417" "work/film-3:48107"
  "storyboard/compare:101417" "originals/poster-1:100946" "originals/poster-2:9582"
  "originals/poster-3:100941"
  "process/process:44060"
)
for c in "${clips[@]}"; do
  name="${c%%:*}"; id="${c##*:}"
  if ls "$name".{mp4,jpg,png,webp,jpeg} >/dev/null 2>&1; then echo "skip  $name (you already have a file)"; continue; fi
  mkdir -p "$(dirname "$name")"
  curl -fsSL "https://assets.mixkit.co/videos/$id/$id-720.mp4" -o "$name.mp4" \
    || curl -fsSL "https://assets.mixkit.co/videos/$id/$id-360.mp4" -o "$name.mp4" \
    || { echo "fail  $name"; rm -f "$name.mp4"; continue; }
  echo "ok    $name"
done
echo "Done."
