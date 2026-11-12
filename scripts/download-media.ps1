# Downloads the free Mixkit stock clips into each section folder, so the site
# works offline. Your own files with the same names are never overwritten.
# Run from the site folder:
#   powershell -ExecutionPolicy Bypass -File scripts\download-media.ps1
# Mixkit License: free for commercial use, no attribution required.

$clips = [ordered]@{
  "hero\hero"           = 100855
  "work\film-1"         = 44060
  "work\film-2"         = 101417
  "work\film-3"         = 48107
  "storyboard\compare"  = 101417
  "originals\poster-1"  = 100946
  "originals\poster-2"  = 9582
  "originals\poster-3"  = 100941
  "process\process"     = 44060
}

$root = Join-Path (Split-Path -Parent $PSScriptRoot) "assets"
foreach ($name in $clips.Keys) {
  $id = $clips[$name]
  $base = Join-Path $root $name
  $have = @(".mp4",".jpg",".png",".webp",".jpeg") | Where-Object { Test-Path "$base$_" }
  if ($have) { Write-Host "skip  $name (you already have a file)"; continue }
  New-Item -ItemType Directory -Force -Path (Split-Path $base) | Out-Null
  foreach ($q in 720, 360) {
    try { Invoke-WebRequest -Uri "https://assets.mixkit.co/videos/$id/$id-$q.mp4" -OutFile "$base.mp4" -UseBasicParsing; Write-Host "ok    $name"; break }
    catch { Write-Host "retry $name at lower quality..." }
  }
}
Write-Host "`nDone."
