# Vikshiv Labs — Website

A one-page cinematic site for Vikshiv Labs. It is plain HTML, CSS and JS with no build step, ready to deploy.

## Folder layout

```
Vikshiv_labs/
├── index.html
├── css/style.css
├── js/main.js           ← email + calendar settings at the top
├── assets/
│   ├── hero/            hero.mp4 | hero.jpg
│   ├── work/            film-1, film-2, film-3        (Work carousel)
│   ├── storyboard/      compare                       (sketch → final slider)
│   ├── originals/       poster-1, poster-2, poster-3  (Originals posters)
│   ├── process/         process                       (Process monitor)
│   ├── about/           founder.jpg                   (your photo)
│   ├── brand/           favicon.svg, og-image.jpg
│   └── fonts/
└── scripts/             optional stock-video downloader
```

## Adding your images and videos

1. Open the section's folder inside `assets/`.
2. Drop in your file using the name listed in that folder's `_ADD_FILES_HERE.txt`.
   - **Video:** `film-1.mp4`
   - **Still image:** `film-1.jpg`, `.png` or `.webp`
3. Refresh the page. If both a video and an image exist, the video is used.

Any slot left empty plays a free Mixkit stock clip, so the site never shows a blank box.

**File tips:**
- Video: H.264 `.mp4`, 10–20 seconds, 1080p or smaller, under about 8 MB each.
- Images: around 1600–2000 px wide, `.jpg` or `.webp`.
- File names are case-sensitive once the site is online, so `Film-1.JPG` will not match `film-1.jpg`.



## Offline stock footage (optional)

These scripts download the stock clips into the right folders. They skip any slot where you've already added your own file.

- **Windows:** `powershell -ExecutionPolicy Bypass -File scripts\download-media.ps1`
- **Mac/Linux:** `bash scripts/download-media.sh`

## Credits

Stock footage comes from [Mixkit](https://mixkit.co) under the Mixkit Free License. The Archivo font is under the SIL Open Font License.
