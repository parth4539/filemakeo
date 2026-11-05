# fileMakeO - 100% Client-Side PDF & Image Studio
**Developer:** Parth Prajapati

A modern, fast, and completely free online toolkit for PDF documents and image files created by Parth Prajapati. All file manipulation takes place in the user's browser using WebAssembly, HTML5 Canvas, and client-side memory buffers. **Zero files are ever uploaded, logged, or sent to any server.**

---

## 🔒 Privacy & Architecture Guarantees

- **100% In-Browser Execution:** Powered by `pdf-lib`, Mozilla `pdfjs-dist`, `jszip`, and the native Canvas 2D API.
- **Zero Cloud Uploads:** No backend server, no cloud storage, and no AI API calls.
- **Immediate Memory Cleanup:** All file references and object URLs (`URL.revokeObjectURL`) are cleanly revoked upon clearing or leaving pages to prevent memory leaks.
- **Works Offline:** Once loaded, all 14 tools function offline without an active internet connection.

---

## 🛠 Included Tools

### PDF Tools (10)
1. **Merge PDF (`/merge-pdf`):** Combine multiple PDF documents with drag & drop ordering into a single PDF.
2. **Split PDF (`/split-pdf`):** Split by page ranges (e.g. `1-3, 5, 7-9`) or extract all pages as individual PDFs (ZIP download supported).
3. **Organize PDF (`/organize-pdf`):** Interactive page grid: reorder, delete, rotate, or duplicate individual pages.
4. **Rotate PDF (`/rotate-pdf`):** Rotate all or specific pages by 90°, 180°, or 270°.
5. **Compress PDF (`/compress-pdf`):** 3 compression levels (Low, Medium, High) with before/after byte calculation and savings %.
6. **JPG/PNG to PDF (`/image-to-pdf`):** Convert multiple photos to PDF with custom page formats (A4, Letter, Fit to Image) and margins.
7. **PDF to JPG/PNG (`/pdf-to-image`):** Extract PDF pages as high-resolution images with 1x, 2x, or 3x DPI scale, with single or ZIP download.
8. **Add Page Numbers (`/add-page-numbers`):** Stamp page numbers with 6 alignment positions, custom formats (`Page {n} of {total}`), and colors.
9. **Add Watermark (`/add-watermark`):** Stamp diagonal or horizontal security text watermarks with opacity and rotation sliders.
10. **Remove Pages (`/remove-pages`):** Visual thumbnail grid to select and delete pages, with odd/even and range selectors.

### Image Tools (4)
11. **Compress Image (`/compress-image`):** Quality slider plus **Target Size Mode** (e.g. `< 50 KB`, `< 100 KB`) with binary search designed for Indian government forms (SSC, UPSC), visas, and job portals.
12. **Resize Image (`/resize-image`):** Resize by exact pixels with aspect ratio lock, percentage scale, and presets (Passport Photo 600x600, Govt Exam 200x230, Signature 140x60, Social Media).
13. **Convert Image (`/convert-image`):** Seamless batch conversion between JPG, PNG, and WebP, with custom background fill for transparent PNGs.
14. **Crop Image (`/crop-image`):** Interactive canvas crop box with aspect ratio presets (1:1 Square, 4:3, 16:9, 3:4 Passport, 2:3).

---

## 💻 Local Development

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Check Code & Type Verification:**
   ```bash
   npm run lint
   ```

---

## 🚀 Static Site Deployment

FileForge has zero backend dependencies and produces standard static HTML/JS/CSS bundles that can be deployed to any static host for free.

### Build the Static Site:
```bash
npm run build
```
This generates production files in the `/dist` directory.

### Deploy to Popular Platforms:

- **Cloudflare Pages:**
  - Build command: `npm run build`
  - Output directory: `dist`

- **Vercel:**
  - Framework Preset: `Vite`
  - Output directory: `dist`

- **Netlify:**
  - Build command: `npm run build`
  - Publish directory: `dist`

- **GitHub Pages:**
  - Push the `dist` folder to your `gh-pages` branch or configure GitHub Actions with `actions/deploy-pages`.
