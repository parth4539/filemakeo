/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolHowToStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolSeoData {
  id: string;
  slug: string;
  name: string;
  category: 'pdf' | 'image' | 'utility';
  h1: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  overviewHeading: string;
  overviewText: string;
  keyFeatures: string[];
  howToSteps: ToolHowToStep[];
  faqs: ToolFaq[];
  relatedToolSlugs: string[];
}

export const SITE_URL = 'https://ais-pre-i7zcuzd5ukxiag5p4bjryr-71452122590.asia-northeast1.run.app';

export const TOOLS_SEO_DATA: Record<string, ToolSeoData> = {
  'merge-pdf': {
    id: 'merge-pdf',
    slug: '/merge-pdf',
    name: 'Merge PDF',
    category: 'pdf',
    h1: 'Merge PDF Files Online - 100% Free, Secure & In-Browser',
    metaTitle: 'Merge PDF Online Free - Combine Multiple PDF Files In-Browser | fileMakeR',
    metaDescription: 'Combine multiple PDF documents into a single organized file directly in your browser. 100% free, private client-side processing with zero file uploads and instant download.',
    canonicalUrl: `${SITE_URL}/merge-pdf`,
    overviewHeading: 'Why Choose fileMakeR to Merge PDF Documents?',
    overviewText: 'Merging PDF files is one of the most common daily document tasks, but traditional online converters force you to upload sensitive contracts, tax records, medical documents, and personal IDs to third-party cloud servers. fileMakeR fundamentally changes this workflow by running the entire merging process directly inside your web browser. Utilizing lightweight WebAssembly and JavaScript binary manipulation, our client-side engine reads your files into local device RAM, combines page trees losslessly, and renders a unified output PDF in milliseconds. No files are ever uploaded, no server logs exist, and no signup or payment is required. You enjoy unlimited document merging with total confidentiality.',
    keyFeatures: [
      '100% client-side: Zero bytes uploaded to any remote server or cloud infrastructure.',
      'Lossless stream concatenation: Retains embedded fonts, vector graphics, form fields, and hyperlinks.',
      'Visual document ordering: Easily shift document sequences before executing the final merge.',
      'Unlimited batch processing: Merge as many documents as your local device RAM permits.',
      'Works offline: Continue combining PDF documents even without active internet connectivity.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload or Drop Multiple PDFs',
        description: 'Drag and drop two or more PDF files from your computer or phone into the upload zone, or click the browse button to select them from your file manager.',
      },
      {
        step: 2,
        title: 'Reorder Document Sequence',
        description: 'Examine your document queue and use the arrow buttons to arrange pages in your preferred chronological or logical reading order.',
      },
      {
        step: 3,
        title: 'Merge & Download Unified PDF',
        description: 'Click the "Merge PDFs" button. The engine binds your documents into one crisp PDF in milliseconds for immediate download without waiting queues.',
      },
    ],
    faqs: [
      {
        question: 'Are my merged PDF files uploaded to any server or cloud?',
        answer: 'No. fileMakeR is strictly 100% client-side. Your PDFs are read and merged directly in your browser\'s local memory using WebAssembly and JavaScript. No external server ever receives, reads, or inspects your files.',
      },
      {
        question: 'Is there a limit on how many PDFs I can combine at once?',
        answer: 'There is no arbitrary software restriction. You can combine 2, 10, or 50 documents simultaneously as long as your device has standard memory capacity to hold them in RAM.',
      },
      {
        question: 'Does merging PDFs preserve original hyperlinks, bookmarks, and form fields?',
        answer: 'Yes. Our pdf-lib integration carefully copies document streams, page structures, vector graphics, and annotations to maintain 100% visual fidelity and document integrity.',
      },
      {
        question: 'Can I merge PDF files when I am completely offline?',
        answer: 'Yes. Once this page is loaded in your browser tab, all required libraries are cached locally. You can disconnect your internet and continue merging documents completely offline.',
      },
    ],
    relatedToolSlugs: ['/split-pdf', '/compress-pdf', '/organize-pdf', '/remove-pages'],
  },

  'split-pdf': {
    id: 'split-pdf',
    slug: '/split-pdf',
    name: 'Split PDF',
    category: 'pdf',
    h1: 'Split PDF Online - Extract Pages & Ranges In-Browser',
    metaTitle: 'Split PDF Online Free - Extract Pages & Ranges Privately | fileMakeR',
    metaDescription: 'Split PDF documents into individual pages or custom page ranges online. 100% free and client-side with zero uploads. Download pages separately or as a ZIP archive.',
    canonicalUrl: `${SITE_URL}/split-pdf`,
    overviewHeading: 'Effortless PDF Splitting & Page Extraction in Browser',
    overviewText: 'Need to extract specific chapters, single invoices, or custom intervals from a large multi-page PDF? fileMakeR provides a lightning-fast, 100% client-side PDF splitter. Whether you want to split every page into a standalone PDF file or extract non-consecutive page ranges like "1-3, 5, 8-12", our engine handles the segmentation in local device memory. Output files can be downloaded individually or packaged together in a single lightweight ZIP archive. Because all execution happens directly inside your browser tab, sensitive documents remain strictly confidential with zero risk of cloud leaks.',
    keyFeatures: [
      'Flexible range extraction: Extract continuous sections or custom comma-separated page ranges.',
      'Batch ZIP packaging: Download all split PDF pages bundled in an organized ZIP archive.',
      'Lossless page extraction: Retains exact vector geometry, embedded fonts, and print resolutions.',
      'Zero server upload: Safe for private financial records, medical dossiers, and legal briefs.',
      'Fast client-side performance: Extracts dozens of pages in a few seconds without network lag.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Your PDF Document',
        description: 'Drag and drop the PDF you wish to divide into the secure upload area or select it via your device file picker.',
      },
      {
        step: 2,
        title: 'Choose Splitting Mode & Ranges',
        description: 'Select whether to extract every single page into separate documents or specify custom page ranges such as "1-4, 6, 8-10".',
      },
      {
        step: 3,
        title: 'Download Split Pages or ZIP',
        description: 'Click "Split PDF". The engine generates individual documents instantly. Download individual files or grab all of them packed into a single ZIP file.',
      },
    ],
    faqs: [
      {
        question: 'How do I specify custom page ranges when splitting a PDF?',
        answer: 'Simply type comma-separated numbers and hyphenated intervals in the range input box, for example "1-3, 5, 7-10". The engine will generate individual PDF files for each specified segment.',
      },
      {
        question: 'Can I download all separated pages in one archive?',
        answer: 'Yes. When extracting all pages or multiple ranges, fileMakeR uses client-side JSZip to compress all output PDF documents into a single convenient .zip file for fast download.',
      },
      {
        question: 'Are any confidential documents uploaded during splitting?',
        answer: 'Never. All page extraction is performed locally on your device. Your sensitive financial, legal, or personal PDFs never touch a remote server or cloud storage bucket.',
      },
      {
        question: 'Does splitting decrease the visual quality of text or images?',
        answer: 'No. The PDF splitting algorithm performs lossless stream cloning. Vector text, embedded fonts, high-resolution figures, and formatting remain 100% identical to the original.',
      },
    ],
    relatedToolSlugs: ['/merge-pdf', '/organize-pdf', '/remove-pages', '/pdf-to-image'],
  },

  'organize-pdf': {
    id: 'organize-pdf',
    slug: '/organize-pdf',
    name: 'Organize PDF',
    category: 'pdf',
    h1: 'Organize PDF Pages - Visual Reorder, Rotate & Delete',
    metaTitle: 'Organize PDF Pages Free - Visual Reorder, Rotate & Delete | fileMakeR',
    metaDescription: 'Visually reorder, rotate, and delete pages in your PDF document with interactive thumbnails. Free, private, and 100% in-browser with zero uploads.',
    canonicalUrl: `${SITE_URL}/organize-pdf`,
    overviewHeading: 'Visual Page Management with Instant Previews',
    overviewText: 'Arranging pages in complex PDF files can be frustrating without visual feedback. fileMakeR brings interactive visual document organization straight into your web browser. When you load your PDF, our browser-side Mozilla PDF.js integration renders clear preview thumbnails of every single page. You can drag and drop or click arrow buttons to reorder pages, rotate upside-down sheets by 90 or 180 degrees, and delete redundant or blank pages with a single click. Everything is calculated in local memory, giving you complete creative control over your final document structure without uploading any data.',
    keyFeatures: [
      'Interactive visual canvas: Inspect crisp thumbnail previews for every page before reorganizing.',
      'One-click page rotation: Fix rotated or inverted pages without changing the rest of the document.',
      'Selective page deletion: Quickly discard unwanted or blank pages before finalizing.',
      'Flexible drag and drop reordering: Rearrange page sequences intuitively with immediate feedback.',
      'Instant client-side export: Generates your updated PDF file in seconds without quality loss.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Load Your PDF File',
        description: 'Upload your PDF document. The tool immediately generates responsive visual thumbnail previews for every page inside your browser.',
      },
      {
        step: 2,
        title: 'Reorder, Rotate & Discard Pages',
        description: 'Shift pages into your desired sequence using arrows or drag-and-drop, rotate sideways sheets, and click the trash icon on pages you want to remove.',
      },
      {
        step: 3,
        title: 'Save & Download New PDF',
        description: 'Click "Save & Download" to compile your reordered page structure into a brand-new, clean PDF document ready for immediate use.',
      },
    ],
    faqs: [
      {
        question: 'How does the visual page organizer work?',
        answer: 'Our tool renders each page into an interactive card using HTML5 Canvas and Mozilla PDF.js. You can visually inspect each page before deciding to move, rotate, or delete it.',
      },
      {
        question: 'Can I rotate individual pages while organizing?',
        answer: 'Yes. You can rotate individual upside-down pages by 90, 180, or 270 degrees without affecting the orientation of other pages in the document.',
      },
      {
        question: 'Is there any risk of losing original files?',
        answer: 'None. fileMakeR never modifies your original file on disk. It produces a brand-new downloaded PDF containing your modified page structure.',
      },
      {
        question: 'Are thumbnails generated privately?',
        answer: 'Yes. All thumbnail rendering occurs inside your device\'s browser canvas context. Zero images or previews are ever transmitted across the internet.',
      },
    ],
    relatedToolSlugs: ['/rotate-pdf', '/remove-pages', '/merge-pdf', '/split-pdf'],
  },

  'rotate-pdf': {
    id: 'rotate-pdf',
    slug: '/rotate-pdf',
    name: 'Rotate PDF',
    category: 'pdf',
    h1: 'Rotate PDF Pages Online - Permanent Orientation Fix',
    metaTitle: 'Rotate PDF Online Free - Rotate All or Selected Pages | fileMakeR',
    metaDescription: 'Rotate PDF documents 90, 180, or 270 degrees clockwise or counter-clockwise. Permanent in-browser orientation fix with zero uploads and complete privacy.',
    canonicalUrl: `${SITE_URL}/rotate-pdf`,
    overviewHeading: 'Permanent In-Browser PDF Page Rotation',
    overviewText: 'Documents scanned upside down or exported in the wrong orientation are difficult to read and unprofessional to share. Many online viewers only rotate pages temporarily for display without saving the orientation. fileMakeR permanently modifies the internal rotation metadata in your PDF file so it opens correctly in every PDF viewer, mobile app, and printer. Choose to rotate the entire document or target specific page numbers clockwise or counter-clockwise by 90, 180, or 270 degrees. The operation is instantaneous, lossless, and executes 100% in client memory.',
    keyFeatures: [
      'Permanent orientation fix: Embeds rotation directly into the PDF structure for universal compatibility.',
      'Flexible angle control: Rotate 90° clockwise, 180° upside down, or 270° counter-clockwise.',
      'Selective rotation: Choose between rotating all pages or only specified odd, even, or custom pages.',
      'Zero quality degradation: Modifies viewport rotation coordinates without re-encoding text or images.',
      'Private & secure: Process legal contracts and personal certificates without cloud transmission.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload PDF Requiring Rotation',
        description: 'Drag and drop your PDF into the upload container or browse for it on your computer, tablet, or smartphone.',
      },
      {
        step: 2,
        title: 'Select Rotation Angle & Pages',
        description: 'Choose your desired angle (90°, 180°, or 270°) and select whether to apply it to all pages or specific page numbers.',
      },
      {
        step: 3,
        title: 'Download Properly Oriented PDF',
        description: 'Click "Rotate PDF" to permanently embed the new orientation attributes and download the correctly aligned document immediately.',
      },
    ],
    faqs: [
      {
        question: 'Is the rotation permanent or just a temporary preview?',
        answer: 'The rotation is 100% permanent. The underlying PDF dictionary\'s rotation attributes are modified, meaning the document will open correctly in Adobe Acrobat, Chrome, Apple Preview, and mobile readers.',
      },
      {
        question: 'Can I rotate only odd pages or only specific pages?',
        answer: 'Yes. You can choose to apply the rotation to the entire document or specify exact page numbers (e.g., page 2 and page 5).',
      },
      {
        question: 'Does rotating affect file size or compress images?',
        answer: 'No. Rotating simply updates viewport matrix coordinates. Document text, vector graphics, and image quality remain untouched without re-encoding.',
      },
      {
        question: 'Is this tool safe for confidential legal documents?',
        answer: 'Completely safe. Because operations run in client memory with zero server uploads, no external party can intercept or view your documents.',
      },
    ],
    relatedToolSlugs: ['/organize-pdf', '/merge-pdf', '/split-pdf', '/add-watermark'],
  },

  'compress-pdf': {
    id: 'compress-pdf',
    slug: '/compress-pdf',
    name: 'Compress PDF',
    category: 'pdf',
    h1: 'Compress PDF Online - Reduce File Size Drastically',
    metaTitle: 'Compress PDF Online Free - Reduce PDF Size In-Browser | fileMakeR',
    metaDescription: 'Reduce PDF file size quickly with Low, Medium, and High compression modes. 100% in-browser, private, and free with live before-and-after size stats.',
    canonicalUrl: `${SITE_URL}/compress-pdf`,
    overviewHeading: 'Smart Client-Side PDF Size Reduction',
    overviewText: 'Oversized PDF files can cause failed email deliveries, rejected job portal submissions, and sluggish downloads. fileMakeR offers a powerful client-side compression engine that optimizes document streams and image assets right inside your browser. With three customizable compression tiers (Low, Medium, and High), you can choose the optimal balance between razor-sharp vector clarity and maximum byte reduction. High compression renders high-density scans onto efficient JPEG canvases to conquer stringent upload caps. Best of all, you receive real-time before-and-after size statistics and percentage savings without sending your file to any server.',
    keyFeatures: [
      'Three tailored compression levels: Low (maximum clarity), Medium (balanced), and High (maximum compression).',
      'Real-time byte metrics: See exact original size, compressed size, and percentage reduction.',
      'Perfect for portal limits: Shrink heavy scans to satisfy government, university, and visa portal requirements.',
      'Zero server upload: Never exposes private bank statements, salary slips, or medical records.',
      'Universal format compliance: Output files remain 100% valid PDF documents viewable on any device.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Select Heavy PDF Document',
        description: 'Upload the large or bloated PDF document you need to optimize for email attachments or web portals.',
      },
      {
        step: 2,
        title: 'Choose Compression Intensity',
        description: 'Pick Low compression to preserve vector text, Medium for balanced reduction, or High for aggressive size minimization.',
      },
      {
        step: 3,
        title: 'Download Optimized Document',
        description: 'Click "Compress PDF" to execute local optimization. Inspect your file size savings and download your lightweight PDF.',
      },
    ],
    faqs: [
      {
        question: 'How does in-browser PDF compression work?',
        answer: 'The engine strips unneeded metadata streams and re-encodes embedded high-resolution graphics to efficient quality levels, drastically shrinking the byte footprint without server processing.',
      },
      {
        question: 'What is the difference between Low, Medium, and High compression?',
        answer: 'Low compression preserves native vector text and lightly optimizes embedded bitmaps. Medium balances clarity and size. High compression rasterizes pages for maximum reduction when meeting strict upload limits.',
      },
      {
        question: 'Will my PDF still be readable on phones and tablets?',
        answer: 'Yes. All output files strictly adhere to standard PDF specifications and are universally compatible with Apple Books, Android, Adobe Reader, and all web browsers.',
      },
      {
        question: 'Can I compress password-protected PDFs?',
        answer: 'For security reasons, password-protected files must first have their protection removed before client-side manipulation can occur.',
      },
    ],
    relatedToolSlugs: ['/merge-pdf', '/split-pdf', '/pdf-to-image', '/compress-image'],
  },

  'image-to-pdf': {
    id: 'image-to-pdf',
    slug: '/create-pdf-from-images',
    name: 'Create PDF from Images',
    category: 'pdf',
    h1: 'Create PDF from Images - Fast In-Browser Converter',
    metaTitle: 'Create PDF from Images Online Free - Custom Margins, Rotation & Sizes | fileMakeR',
    metaDescription: 'Create a clean PDF from JPG, PNG, and WebP images. Rotate photos, reorder pages, select standard paper sizes (A4, Letter, A3, Legal, Fit), and add page numbers.',
    canonicalUrl: `${SITE_URL}/create-pdf-from-images`,
    overviewHeading: 'Turn Photos, Scans & Graphics into Clean PDFs',
    overviewText: 'Converting photos, scanned documents, receipts, certificates, and ID cards into PDF format is essential for official submissions and archival. fileMakeR transforms JPG, PNG, and WebP graphics into clean, standardized PDF documents directly in your web browser. You can arrange multiple images into your desired page sequence, rotate sideways camera photos, configure standard paper formats (A4, Letter, A3, Legal, or Fit), apply margins, and stamp page numbers. Because all processing occurs on device, your personal photos and sensitive documents remain 100% confidential.',
    keyFeatures: [
      'Multi-image batch creation: Combine dozens of photos into a single multi-page PDF document.',
      'Per-image rotation: Easily rotate sideways or upside-down camera photos 90° or 180° clockwise.',
      'Standard paper formats: Support for ISO A4, US Letter, A3, US Legal, and Fit-to-Image dimensions.',
      'Custom margin settings: Choose between border-to-border, compact, standard, or generous margins.',
      'Page numbering: Automatically stamp clean page numbers ("Page X of Y") at the bottom.',
      '100% client-side privacy: Zero cloud uploads for personal IDs, receipts, and family photos.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Images (JPG, PNG, WebP)',
        description: 'Drag and drop one or more images into the converter, or browse for photos from your computer or camera roll.',
      },
      {
        step: 2,
        title: 'Customize Layout & Paper Size',
        description: 'Arrange images in order, choose paper size (A4, US Letter, or Fit), select margins, and toggle orientation settings.',
      },
      {
        step: 3,
        title: 'Convert & Download PDF',
        description: 'Click "Convert to PDF" to compile your images into a single professional PDF document for immediate download.',
      },
    ],
    faqs: [
      {
        question: 'Can I combine multiple pictures into a single multi-page PDF?',
        answer: 'Yes. You can upload dozens of photos at once, reorder them as needed, and export them as one unified multi-page PDF document.',
      },
      {
        question: 'What standard paper sizes are supported?',
        answer: 'fileMakeR supports standard ISO A4, US Letter, and Fit-to-Image (where each page adapts to the native dimensions of the photo without borders).',
      },
      {
        question: 'Can I adjust page orientation between portrait and landscape?',
        answer: 'Yes. You can lock all pages to Portrait, Landscape, or choose Auto-detect so each page matches the orientation of its respective photo.',
      },
      {
        question: 'Are my uploaded photos kept private?',
        answer: '100% private. Your images are converted to PDF objects strictly inside your browser\'s local memory. No photo is ever sent to a cloud server.',
      },
    ],
    relatedToolSlugs: ['/pdf-to-image', '/compress-image', '/convert-image', '/merge-pdf'],
  },

  'pdf-to-image': {
    id: 'pdf-to-image',
    slug: '/pdf-to-image',
    name: 'PDF to JPG/PNG',
    category: 'pdf',
    h1: 'Convert PDF to JPG and PNG Images - High-Resolution Export',
    metaTitle: 'Convert PDF to JPG & PNG Online Free - High Quality Export | fileMakeR',
    metaDescription: 'Extract and convert PDF pages into high-resolution JPG or PNG images. 100% private client-side conversion. Download pages individually or as a ZIP.',
    canonicalUrl: `${SITE_URL}/pdf-to-image`,
    overviewHeading: 'High-Resolution PDF Page to Image Conversion',
    overviewText: 'Need to extract illustrations from a PDF or convert presentation slides into shareable image files? fileMakeR renders each page of your PDF into crisp, high-resolution JPG or PNG graphics directly inside your browser. Powered by Mozilla PDF.js, our tool respects original vector graphics, font kerning, and color profiles. You can preview all rendered pages in real time, download individual page images, or download all pages bundled in a single organized ZIP archive. Enjoy fast, private image extraction without third-party server exposure.',
    keyFeatures: [
      'Dual format output: Export as high-efficiency JPEG or lossless PNG images.',
      'High DPI resolution: Scale multipliers ensure crisp text and sharp graphical rendering.',
      'Batch ZIP download: Package all page graphics into a single archive with one click.',
      'Individual page export: Download only the specific page images you need.',
      'Client-side execution: Process confidential financial reports and documents safely.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload PDF Document',
        description: 'Select or drag and drop the PDF file whose pages you want to turn into image files.',
      },
      {
        step: 2,
        title: 'Choose Image Format & DPI',
        description: 'Select JPG for smaller file sizes or PNG for lossless crispness, and choose standard or high-resolution scale.',
      },
      {
        step: 3,
        title: 'Download Images or ZIP',
        description: 'Inspect the rendered page cards, download single pages, or click "Download All as ZIP" to save all page images together.',
      },
    ],
    faqs: [
      {
        question: 'What image formats can I export my PDF pages into?',
        answer: 'You can convert each page into either standard JPEG format or lossless PNG format with superior sharpness.',
      },
      {
        question: 'Can I convert high-resolution vector artwork without blurriness?',
        answer: 'Yes. You can select higher scale multipliers (up to 2x or 3x DPI) so text, diagrams, and illustrations remain razor-sharp.',
      },
      {
        question: 'Can I download all pages at once?',
        answer: 'Yes. Our client-side JSZip engine packages all converted page images into a single zip archive for instant one-click download.',
      },
      {
        question: 'Does this require installing any software or plugins?',
        answer: 'No plugins or software required. It runs natively using Mozilla PDF.js inside Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.',
      },
    ],
    relatedToolSlugs: ['/create-pdf-from-images', '/split-pdf', '/compress-pdf', '/convert-image'],
  },

  'add-page-numbers': {
    id: 'add-page-numbers',
    slug: '/add-page-numbers',
    name: 'Add Page Numbers',
    category: 'pdf',
    h1: 'Add Page Numbers to PDF Online - Custom Format & Position',
    metaTitle: 'Add Page Numbers to PDF Free - Custom Position & Format | fileMakeR',
    metaDescription: 'Number pages in PDF documents with custom position, starting number, font sizes, and styles like "Page X of Y". 100% private in-browser utility.',
    canonicalUrl: `${SITE_URL}/add-page-numbers`,
    overviewHeading: 'Professional PDF Pagination & Header/Footer Numbering',
    overviewText: 'Numbering the pages of academic reports, legal briefs, manuscripts, and corporate proposals is vital for readability and reference. fileMakeR stamps customizable page numbers across your PDF pages directly inside your browser. You can position page numbers in any corner or center position (Bottom-Right, Bottom-Center, Top-Right, etc.), choose formatting styles like "Page 1 of 10" or simple digits, adjust starting page numbers, and pick font sizes. The numbers are rendered losslessly as native vector typography without rasterizing or blurring your existing document contents.',
    keyFeatures: [
      'Flexible alignment options: Place page numbers across 6 distinct header and footer positions.',
      'Custom numbering formats: Support for simple digits, "Page N", or "Page N of Total".',
      'Custom starting index: Start numbering from any number (e.g., page 5 for document annexures).',
      'Native vector rendering: Stamps crisp text without degrading original document resolution.',
      '100% private processing: Confidential documents never touch external server infrastructure.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Your PDF File',
        description: 'Drag and drop or browse for the document you wish to paginate from your device.',
      },
      {
        step: 2,
        title: 'Configure Numbering Styles',
        description: 'Choose alignment position (e.g. Bottom-Right), starting number, format ("Page {n} of {total}"), and typography size.',
      },
      {
        step: 3,
        title: 'Stamp & Download PDF',
        description: 'Click "Apply Page Numbers" to stamp pagination across all sheets and download your formatted PDF document.',
      },
    ],
    faqs: [
      {
        question: 'Can I customize the numbering format?',
        answer: 'Yes. You can choose between simple numbers ("1, 2, 3"), prefixed text ("Page 1"), or complete page counts ("Page 1 of 25").',
      },
      {
        question: 'Where on the page can I place the numbers?',
        answer: 'You can align page numbers to the Top-Left, Top-Center, Top-Right, Bottom-Left, Bottom-Center, or Bottom-Right with customizable margins.',
      },
      {
        question: 'Can I start numbering from a number other than 1?',
        answer: 'Yes. You can set any starting number (for example, starting at page 5 or 101 for document annexures and chapters).',
      },
      {
        question: 'Are page numbers stamped losslessly?',
        answer: 'Yes. Numbers are drawn as native vector text glyphs on top of each page layer without rasterizing existing page contents.',
      },
    ],
    relatedToolSlugs: ['/add-watermark', '/organize-pdf', '/merge-pdf', '/compress-pdf'],
  },

  'add-watermark': {
    id: 'add-watermark',
    slug: '/add-watermark',
    name: 'Add Watermark',
    category: 'pdf',
    h1: 'Add Watermark to PDF Online - Text & Confidential Stamp',
    metaTitle: 'Add Watermark to PDF Free - Text, Opacity & Rotation | fileMakeR',
    metaDescription: 'Stamp customized text watermarks onto PDF pages with opacity, angle, color, and font control. 100% client-side security with zero server uploads.',
    canonicalUrl: `${SITE_URL}/add-watermark`,
    overviewHeading: 'Protect Intellectual Property with Custom Watermarks',
    overviewText: 'Protecting confidential drafts, trade secrets, sensitive contracts, and copyrighted materials requires prominent document watermarking. fileMakeR stamps custom text watermarks—such as "CONFIDENTIAL", "DO NOT COPY", "DRAFT", or your company brand—across every page of your PDF file directly in your browser. With fine-grained control over rotation angle (e.g. diagonal 45°), opacity transparency, font size, and color, you can make your ownership unmistakable while preserving full legibility of the underlying text. Everything executes privately in device RAM.',
    keyFeatures: [
      'Complete typography control: Custom text, font size, and color palette customization.',
      'Adjustable transparency: Set opacity from 10% to 100% to balance visibility and legibility.',
      'Flexible rotation angles: Stamp diagonal 45° banners or horizontal overlays.',
      'Permanent vector stamp: Watermarks become an integral, uneditable layer in the output PDF.',
      'Zero server upload: Safe for private trade secrets, patent applications, and legal contracts.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload PDF Document',
        description: 'Select the PDF document requiring copyright protection or confidentiality markings.',
      },
      {
        step: 2,
        title: 'Design Watermark Overlay',
        description: 'Enter your custom watermark text, adjust rotation angle, opacity slider, font size, and select text color.',
      },
      {
        step: 3,
        title: 'Apply Stamp & Download',
        description: 'Click "Apply Watermark" to render the translucent watermark overlay on all pages and download your secure PDF.',
      },
    ],
    faqs: [
      {
        question: 'Can I adjust the transparency and angle of the watermark?',
        answer: 'Yes. You can adjust the opacity from 10% to 100% and choose rotation angles like 45° diagonal or horizontal 0°.',
      },
      {
        question: 'Will the watermark cover the underlying text completely?',
        answer: 'Because you can fine-tune the opacity, the watermark remains clearly visible while ensuring the underlying document text remains fully legible.',
      },
      {
        question: 'Can watermarked documents still be printed?',
        answer: 'Yes. The watermark becomes a permanent visual component of the PDF and will print faithfully on all standard office and commercial printers.',
      },
      {
        question: 'Is this confidential enough for corporate NDAs and contracts?',
        answer: 'Absolutely. All processing occurs locally in browser memory without sending a single byte over the internet.',
      },
    ],
    relatedToolSlugs: ['/add-page-numbers', '/rotate-pdf', '/merge-pdf', '/compress-pdf'],
  },

  'remove-pages': {
    id: 'remove-pages',
    slug: '/remove-pages',
    name: 'Remove Pages',
    category: 'pdf',
    h1: 'Remove Pages from PDF Online - Delete Unwanted Sheets',
    metaTitle: 'Remove Pages from PDF Free - Delete Unwanted Sheets Privately | fileMakeR',
    metaDescription: 'Quickly delete unwanted, duplicate, or blank pages from your PDF file. Click thumbnail previews to remove pages with zero uploads and 100% privacy.',
    canonicalUrl: `${SITE_URL}/remove-pages`,
    overviewHeading: 'Strip Unneeded Sheets & Shrink Your PDF',
    overviewText: 'Documents often accumulate unnecessary cover sheets, blank pages, duplicate scans, or confidential appendixes that should not be shared. fileMakeR makes removing unwanted pages from your PDF document effortless and visual. By rendering interactive thumbnail previews for each page using browser-side PDF.js, you can click directly on unwanted pages to mark them for removal, or type specific page numbers into the input box. Our client-side engine strips out the unwanted page streams and produces a clean, trimmed PDF in seconds without any cloud transmission.',
    keyFeatures: [
      'Visual thumbnail selection: Click individual page cards to mark them for instant removal.',
      'Multi-range page removal: Enter comma-separated ranges (e.g. "2, 4-6, 11") for fast batch deletion.',
      'Permanent stream deletion: Omitted pages are completely removed from the file, reducing file size.',
      'Lossless retention: Retains original vector clarity, embedded fonts, and bookmarks for remaining pages.',
      '100% in-browser safety: No sensitive document data is uploaded to remote servers.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Your PDF File',
        description: 'Drag and drop your PDF into the tool to load interactive visual thumbnail previews for every page.',
      },
      {
        step: 2,
        title: 'Select Pages to Remove',
        description: 'Click on page cards to highlight them in red for deletion, or type comma-separated numbers in the range input.',
      },
      {
        step: 3,
        title: 'Export Trimmed PDF',
        description: 'Click "Remove Selected Pages" to save your clean, trimmed PDF with unwanted sheets permanently excluded.',
      },
    ],
    faqs: [
      {
        question: 'How do I choose which pages to delete?',
        answer: 'You can either click directly on thumbnail previews to highlight them in red for deletion, or enter page numbers in the input box.',
      },
      {
        question: 'Can I remove multiple non-consecutive pages at once?',
        answer: 'Yes. You can remove any combination of pages, such as pages 1, 3, 7, and 12-15 simultaneously in one pass.',
      },
      {
        question: 'Does removing pages alter the numbering of remaining pages?',
        answer: 'The remaining pages will naturally flow sequentially as a coherent document without gaps or blank spaces.',
      },
      {
        question: 'Are the deleted pages recoverable from the new file?',
        answer: 'No. The output PDF completely omits the discarded page streams, reducing overall file size and ensuring deleted information cannot be extracted.',
      },
    ],
    relatedToolSlugs: ['/split-pdf', '/organize-pdf', '/merge-pdf', '/rotate-pdf'],
  },

  'pdf-n-up': {
    id: 'pdf-n-up',
    slug: '/pdf-n-up',
    name: 'PDF N-Up (Multiple Pages Per Sheet)',
    category: 'pdf',
    h1: 'PDF N-Up - Multiple Pages Per Sheet for Printing',
    metaTitle: 'PDF N-Up: Multiple Pages Per Sheet Free | fileMakeR',
    metaDescription: 'Print multiple PDF pages on one sheet (2, 4, 6, 8, 9-up). 100% in-browser, sharp vector rendering, custom margins & orientation with zero file uploads.',
    canonicalUrl: `${SITE_URL}/pdf-n-up`,
    overviewHeading: 'Print Multiple PDF Pages on a Single Sheet with Zero Quality Loss',
    overviewText: 'Printing multi-page PDF documents often wastes paper, ink, and binder space. PDF N-Up—arranging 2, 4, 6, 8, or 9 pages onto a single printed sheet—is the industry-standard solution for printing lecture slides, handouts, pocket reference guides, and proofing drafts. fileMakeR brings true in-browser N-Up imposition directly to your device. Powered by client-side pdf-lib embedding without rasterization, your original typography, vector diagrams, and form lines remain 100% razor-sharp at any scale. Each page is independently scaled proportionally to fit its grid cell perfectly with zero distortion and zero edge clipping. With flexible support for standard paper sizes (ISO A4, A3, US Letter, US Legal), custom margins, cell gaps, optional page borders, and orientation controls, you can craft production-grade print layouts in seconds while keeping your files 100% private in local device RAM.',
    keyFeatures: [
      'Pure vector embedding: Uses pdf-lib drawPage so text and vector graphics stay crisp with zero rasterization.',
      'Proportional fit & centering: Pages are never stretched or cropped; mixed orientations and sizes scale independently.',
      'Flexible grid options: Put 2, 4, 6, 8, or 9 pages per sheet with automatic or custom orientation (Portrait / Landscape).',
      'Custom sheet formats: Choose from standard ISO A4, A3, US Letter, and US Legal paper sizes with mm-level margins and gaps.',
      '100% client-side security: Process sensitive legal contracts, student handouts, and private reports with zero server uploads.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Your PDF Document',
        description: 'Drag and drop your PDF into the secure upload zone or browse your local files. Your document loads directly into browser memory.',
      },
      {
        step: 2,
        title: 'Configure N-Up Grid & Page Setup',
        description: 'Choose pages per sheet (2, 4, 6, 8, or 9), select sheet size (A4, A3, Letter, Legal), adjust margins and gaps in millimeters, and check the live sheet preview.',
      },
      {
        step: 3,
        title: 'Generate & Download N-Up PDF',
        description: 'Click "Generate N-Up PDF". The client-side engine arranges your pages into imposed sheets in seconds for instant download.',
      },
    ],
    faqs: [
      {
        question: 'What is PDF N-Up and how does it save paper when printing?',
        answer: 'N-Up imposition is the process of arranging multiple document pages (such as 2, 4, or 6 pages) onto a single printed sheet of paper. It cuts paper and toner consumption by 50% to 75%, making it ideal for meeting agendas, academic lecture slides, study summaries, and pocket reference booklets.',
      },
      {
        question: 'Does this tool rasterize or blur text when scaling down pages?',
        answer: 'No. Unlike basic image-based converters that turn pages into low-resolution JPEGs, fileMakeR embeds pages as native vector XObjects using pdf-lib. All fonts, line art, mathematical formulas, and vector curves remain completely scalable and print at the maximum resolution of your printer.',
      },
      {
        question: 'How does N-Up handle odd page counts or single-page documents?',
        answer: 'If your document has an odd number of pages (for example, a 3-page PDF with 2 pages per sheet), the final sheet displays the remaining page in the first cell and leaves remaining slots neatly empty. Single-page PDFs are similarly positioned without error.',
      },
      {
        question: 'Can I customize sheet size, orientation, and margins?',
        answer: 'Yes. You can select standard paper formats (A4, A3, US Letter, US Legal), set Auto, Portrait, or Landscape orientation, choose left-to-right (LTR) or right-to-left (RTL) reading order, specify exact margin and cell gap measurements in millimeters, and toggle page separator borders.',
      },
      {
        question: 'Are my confidential documents uploaded to any remote server?',
        answer: 'Never. fileMakeR is built strictly with zero-upload privacy architecture. All page embedding, matrix transformations, and sheet rendering execute locally inside your web browser. No external server ever receives or views your PDF files.',
      },
    ],
    relatedToolSlugs: ['/merge-pdf', '/split-pdf', '/compress-pdf', '/organize-pdf'],
  },

  'compress-image': {
    id: 'compress-image',
    slug: '/compress-image',
    name: 'Compress Image',
    category: 'image',
    h1: 'Compress Image Online - Reduce JPG, PNG & WebP File Size',
    metaTitle: 'Compress Image Online Free - Reduce KB Size with Target Mode | fileMakeR',
    metaDescription: 'Compress JPG, PNG, and WebP images online with real-time quality slider and Target Size mode (<50KB, <100KB, <200KB) for government exam forms.',
    canonicalUrl: `${SITE_URL}/compress-image`,
    overviewHeading: 'Intelligent In-Browser Image Compression with Target Size Mode',
    overviewText: 'Whether preparing photos for website performance or uploading profile images to strict government recruitment portals, optimizing image file size is essential. fileMakeR provides a state-of-the-art client-side image compression utility supporting JPG, PNG, and modern WebP formats. In addition to a fine-tuned visual quality slider, fileMakeR features an automated "Target Size" mode (e.g. Under 50 KB, Under 100 KB, or Under 200 KB). This runs a client-side binary search on encoding parameters to guarantee your image satisfies portal limits (such as SSC, UPSC, and passport portals) without trial and error. All compression occurs via HTML5 Canvas in local memory.',
    keyFeatures: [
      'Automated Target Size Mode: Instantly compress photos to strictly under 50KB, 100KB, or 200KB.',
      'Supports JPG, PNG & WebP: Compress modern formats with full transparency handling.',
      'Real-time savings calculation: Inspect exact byte reduction and compression percentages.',
      'Hardware-accelerated canvas: Resamples and compresses images in milliseconds using device GPU.',
      '100% private: Sensitive passport photos and identity documents never leave your device.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Image File',
        description: 'Select your JPG, PNG, or WebP photo from your computer, phone gallery, or camera.',
      },
      {
        step: 2,
        title: 'Choose Compression Mode',
        description: 'Adjust the quality slider or choose a Target Size preset (e.g., Under 50 KB or Under 100 KB) for automated sizing.',
      },
      {
        step: 3,
        title: 'Download Optimized Photo',
        description: 'Review the instant size comparison and download your lightweight photo ready for official portal upload.',
      },
    ],
    faqs: [
      {
        question: 'How does the "Target Size" compression mode work?',
        answer: 'Our client-side compression algorithm executes a fast binary search on encoding quality, ensuring your photo shrinks strictly below your target quota (e.g. 50KB or 100KB) without manual guessing.',
      },
      {
        question: 'Why is target size compression so important for Indian government forms?',
        answer: 'Portals like SSC, UPSC, IBPS, State PSC, and passport portals enforce strict file size caps (such as "photo must be between 20KB and 50KB"). Our tool was specially designed to satisfy these criteria instantly.',
      },
      {
        question: 'Does compressing images reduce their resolution or pixel dimensions?',
        answer: 'Our standard compression mode preserves the exact pixel width and height, optimizing chroma subsampling and DCT quantization tables for invisible compression.',
      },
      {
        question: 'Can I compress PNG images with transparent backgrounds?',
        answer: 'Yes. You can preserve transparency with WebP or PNG compression, or choose to fill transparent pixels with clean white background for JPEG exports.',
      },
    ],
    relatedToolSlugs: ['/resize-image', '/convert-image', '/crop-image', '/create-pdf-from-images'],
  },

  'resize-image': {
    id: 'resize-image',
    slug: '/resize-image',
    name: 'Resize Image',
    category: 'image',
    h1: 'Resize Image Online - Pixels, Percentages & Government Presets',
    metaTitle: 'Resize Image Online Free - Dimensions, Percentages & Form Presets | fileMakeR',
    metaDescription: 'Change image dimensions in pixels or percentage with aspect ratio lock. Built-in presets for Passport photos, Signatures, SSC, and UPSC applications.',
    canonicalUrl: `${SITE_URL}/resize-image`,
    overviewHeading: 'Precise Image Resizing with Official Portal Presets',
    overviewText: 'Government recruitment tests, passport applications, and social media platforms require strict image dimensions. fileMakeR offers an in-browser image resizer that adjusts pixel dimensions, percentages, and standard biometric formats with zero quality distortion. Use the aspect ratio lock to scale photos proportionally, or enter exact custom width and height. Built-in presets for Indian Passport Photos (3.5x4.5cm / 413x531 px), official exam signature scans (140x60 px / 200x60 px), and popular web dimensions let you prepare compliant files in one click without complicated graphic editing software.',
    keyFeatures: [
      'Proportional aspect ratio lock: Resize width or height without distorting image proportions.',
      'Official form presets: Built-in specifications for Passport, Signature, SSC, and UPSC portals.',
      'Dual measurement units: Resize by exact pixel dimensions or by percentages (e.g. 50%, 75%).',
      'High-fidelity resampling: Bicubic interpolation on HTML5 Canvas ensures sharp edges and clear text.',
      '100% in-browser privacy: Biometric identity photos remain strictly inside your browser RAM.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Image to Resize',
        description: 'Drag and drop or select the photo, signature scan, or graphic you need to scale.',
      },
      {
        step: 2,
        title: 'Select Dimensions or Preset',
        description: 'Enter custom pixel dimensions, adjust percentage scale, or choose a preset (Passport 3.5x4.5cm, Signature 140x60px).',
      },
      {
        step: 3,
        title: 'Download Rescaled Graphic',
        description: 'Preview the resized image dimensions and download your perfectly formatted photo ready for submission.',
      },
    ],
    faqs: [
      {
        question: 'Can I lock the aspect ratio while resizing?',
        answer: 'Yes. When the aspect ratio lock is enabled, typing a new width automatically recalculates the proportional height to prevent stretching or distortion.',
      },
      {
        question: 'What presets are included for government exam portals?',
        answer: 'We include presets for standard Indian Passport Photo (3.5cm x 4.5cm / 413x531 px), Signature uploads (140x60 px / 200x60 px), and popular social media formats.',
      },
      {
        question: 'Does scaling down an image improve loading speed on websites?',
        answer: 'Significantly. Downscaling oversized 4000px camera photos to web-friendly 800px or 1200px sizes reduces file weight by over 85%, accelerating webpage load times.',
      },
      {
        question: 'Are the resizing operations executed locally?',
        answer: 'Yes. All resampling is performed using your computer\'s GPU hardware acceleration through the browser\'s HTML5 Canvas 2D engine.',
      },
    ],
    relatedToolSlugs: ['/compress-image', '/crop-image', '/convert-image', '/create-pdf-from-images'],
  },

  'convert-image': {
    id: 'convert-image',
    slug: '/convert-image',
    name: 'Convert Image',
    category: 'image',
    h1: 'Convert Image Online - JPG, PNG & WebP Format Converter',
    metaTitle: 'Convert Image Online Free - JPG, PNG & WebP Converter | fileMakeR',
    metaDescription: 'Batch convert images between JPG, PNG, and modern WebP formats in seconds. 100% free client-side image conversion with zero quality loss and no limits.',
    canonicalUrl: `${SITE_URL}/convert-image`,
    overviewHeading: 'Fast In-Browser Format Conversion for Photos & Graphics',
    overviewText: 'Different applications demand different image formats: WebP for cutting-edge web performance, PNG for transparent logos and vector charts, and JPEG for universal compatibility. fileMakeR enables batch image conversion between JPG, PNG, and WebP directly within your browser. When converting transparent PNG files into JPEG, our engine intelligently composites transparent pixels against a clean white background. You can convert multiple images simultaneously, adjust quality parameters, and download all files individually or packaged in an organized ZIP archive.',
    keyFeatures: [
      'Multi-format support: Seamless conversion between JPG, PNG, and modern WebP.',
      'Batch conversion: Convert dozens of photos simultaneously with single-click ZIP download.',
      'Transparency management: Automatic solid white background fill for transparent PNG to JPG conversions.',
      'Adjustable output quality: Balance visual detail and file weight with interactive sliders.',
      'Zero server upload: Private graphics and family photos are converted locally in browser memory.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Images to Convert',
        description: 'Drag and drop one or several images in JPG, PNG, or WebP format into the converter.',
      },
      {
        step: 2,
        title: 'Choose Target Format & Quality',
        description: 'Select your preferred output format (JPG, PNG, or WebP) and adjust the compression quality setting.',
      },
      {
        step: 3,
        title: 'Convert & Download All',
        description: 'Click "Convert Images" to process files instantly in memory and download them individually or in a single ZIP.',
      },
    ],
    faqs: [
      {
        question: 'Why should I convert images to WebP format?',
        answer: 'WebP provides superior lossless and lossy compression compared to legacy JPEG and PNG formats, often yielding 25% to 35% smaller file sizes at identical visual fidelity.',
      },
      {
        question: 'What happens to transparency when converting PNG to JPG?',
        answer: 'Because standard JPEG does not support alpha channel transparency, our converter seamlessly composites transparent areas against a solid white background.',
      },
      {
        question: 'Can I convert multiple images at the same time?',
        answer: 'Yes. You can upload multiple files simultaneously and convert them in batch, then download all converted pictures in a single ZIP file.',
      },
      {
        question: 'Is there any charge or subscription required to convert images?',
        answer: 'No. fileMakeR is 100% free with no hidden fees, subscriptions, or daily conversion limits.',
      },
    ],
    relatedToolSlugs: ['/compress-image', '/resize-image', '/crop-image', '/create-pdf-from-images'],
  },

  'crop-image': {
    id: 'crop-image',
    slug: '/crop-image',
    name: 'Crop Image',
    category: 'image',
    h1: 'Crop Image Online - Interactive Bounding Box & Presets',
    metaTitle: 'Crop Image Online Free - Custom Aspect Ratios & Passport Crop | fileMakeR',
    metaDescription: 'Crop photos online with an interactive visual crop box and aspect ratio presets (1:1 Square, 4:3, 16:9, Passport 3:4). Zero uploads, 100% in-browser.',
    canonicalUrl: `${SITE_URL}/crop-image`,
    overviewHeading: 'Visual In-Browser Photo Cropping with Aspect Presets',
    overviewText: 'Trimming unwanted margins, removing photobombers, or framing a portrait for an official document should not require heavy photo editing software. fileMakeR offers an interactive in-browser image crop tool with real-time canvas preview. Adjust the bounding crop frame freely or lock into popular aspect ratio presets such as 1:1 Square (Instagram / profile avatars), 4:3, 16:9 (widescreen), and 3:4 / 3.5:4.5 (official passport headshots). The cropped region is extracted at full native camera resolution without artificial downsampling or compression artifacts.',
    keyFeatures: [
      'Interactive crop handles: Freely adjust bounding crop rectangles with real-time visual feedback.',
      'Aspect ratio presets: Instant locking to Square 1:1, 4:3, 16:9, and Passport 3:4 / 3.5:4.5 ratios.',
      'Lossless pixel extraction: Extracts target regions at native resolution without blurring.',
      'EXIF orientation support: Automatically respects camera rotation data for upright framing.',
      '100% private: Process sensitive identity badges and personal photographs safely in browser RAM.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Photo to Crop',
        description: 'Drag and drop or select the image you wish to trim, reframe, or crop from your device.',
      },
      {
        step: 2,
        title: 'Adjust Crop Box & Ratio',
        description: 'Drag the corner and edge handles of the crop frame, or choose an aspect ratio preset (1:1, 4:3, 16:9, Passport).',
      },
      {
        step: 3,
        title: 'Crop & Save Image',
        description: 'Review your framed crop preview and click "Crop & Download" to export your high-resolution image file.',
      },
    ],
    faqs: [
      {
        question: 'Can I freely crop any rectangular region without fixed aspect ratios?',
        answer: 'Yes. By selecting the "Free" mode, you can drag the crop box to any custom width and height without locked proportions.',
      },
      {
        question: 'Is the crop operation lossless?',
        answer: 'The cropped pixel region is extracted directly from the original image at full native resolution without artificial downsampling.',
      },
      {
        question: 'Can I use this tool to create passport photos?',
        answer: 'Yes. The 3:4 and 3.5:4.5 passport presets ensure your headshot is properly proportioned for official visas, passports, and ID badges.',
      },
      {
        question: 'Does the tool retain EXIF orientation data?',
        answer: 'Yes. The canvas respects orientation metadata, ensuring your cropped picture is oriented upright across all devices.',
      },
    ],
    relatedToolSlugs: ['/resize-image', '/compress-image', '/convert-image', '/create-pdf-from-images'],
  },

  'sign-pdf': {
    id: 'sign-pdf',
    slug: '/sign-pdf',
    name: 'Sign PDF (e-Signature)',
    category: 'pdf',
    h1: 'Sign PDF Online Free - Draw, Type & Stamp e-Signatures In-Browser',
    metaTitle: 'Sign PDF Online Free - Handwritten & Typed e-Signature | fileMakeR',
    metaDescription: 'Add electronic signatures to any PDF document directly in your browser. Draw, type, or upload transparent PNG signatures with zero uploads and instant download.',
    canonicalUrl: `${SITE_URL}/sign-pdf`,
    overviewHeading: 'Private Client-Side Electronic Signatures for Contracts & Forms',
    overviewText: 'Signing agreements, consent forms, tax documents, and invoices online often forces you to upload confidential paperwork to cloud e-signature platforms with paywalls. fileMakeR lets you create crisp handwritten signatures on a responsive canvas pad, style clean typed signatures, or upload a scanned photo of your wet-ink signature with automatic white background removal. Click directly on any rendered page preview to position your signature, adjust dimensions, choose single-page or all-page placement, and flatten the signature into a universally readable PDF directly in device RAM.',
    keyFeatures: [
      'Three signature modes: Smooth handwritten drawing pad, stylized typed text, or image upload.',
      'Auto-transparent background cleanup: Strips white paper backgrounds from scanned signature photos.',
      'Interactive page placement: Click or drag directly over any rendered PDF page preview.',
      'Multi-page stamping: Place your signature on a specific page or repeat across every page.',
      '100% client-side privacy: Contracts and legal paperwork never touch external servers.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload PDF Document',
        description: 'Select or drag and drop the PDF contract, form, or agreement you need to sign.',
      },
      {
        step: 2,
        title: 'Create & Position Signature',
        description: 'Draw, type, or upload your signature stamp, then click anywhere on the page preview to place and resize it.',
      },
      {
        step: 3,
        title: 'Sign & Download PDF',
        description: 'Click "Sign & Download PDF" to permanently embed your e-signature and save the signed file immediately.',
      },
    ],
    faqs: [
      {
        question: 'Are my signed contracts uploaded to any server?',
        answer: 'No. Signature creation, page rendering, and PDF embedding execute 100% inside your local browser memory.',
      },
      {
        question: 'Can I upload a photo of my handwritten signature on white paper?',
        answer: 'Yes. Enable the white-background removal option when uploading a signature image so your ink blends cleanly onto the PDF page.',
      },
      {
        question: 'Can I place my signature on multiple pages at once?',
        answer: 'Yes. You can stamp only the selected page or apply the signature automatically at the same position across all pages.',
      },
      {
        question: 'Will the signed PDF open properly in Adobe Acrobat and Chrome?',
        answer: 'Yes. The signature is embedded directly into the PDF page stream as a lossless PNG overlay readable in all standard PDF viewers.',
      },
    ],
    relatedToolSlugs: ['/protect-pdf', '/add-watermark', '/merge-pdf', '/compress-pdf'],
  },

  'protect-pdf': {
    id: 'protect-pdf',
    slug: '/protect-pdf',
    name: 'Protect / Encrypt PDF',
    category: 'pdf',
    h1: 'Protect & Encrypt PDF Online - Add Password & Permissions',
    metaTitle: 'Protect PDF with Password Free - Client-Side PDF Encryption | fileMakeR',
    metaDescription: 'Encrypt and password-protect PDF documents inside your browser. Restrict opening, printing, copying, or modifying sensitive PDFs without uploading files.',
    canonicalUrl: `${SITE_URL}/protect-pdf`,
    overviewHeading: 'Zero-Upload PDF Password Encryption & Permission Control',
    overviewText: 'Sharing salary slips, bank statements, medical reports, or legal agreements over email carries real exposure risk if files remain unencrypted. Sending confidential files to an online PDF locker server defeats the purpose of security. fileMakeR encrypts your PDF entirely inside local browser RAM before you share it. Set a required open password (User Password), configure a separate Owner Password for administrative control, and restrict unauthorized printing, text copying, or page modifications.',
    keyFeatures: [
      'Zero-knowledge encryption: Passwords and unencrypted PDFs never leave your device.',
      'User & Owner passwords: Require an open password to view or lock editing permissions separately.',
      'Granular permission flags: Disable printing, clipboard text extraction, or content modification.',
      'Password strength indicator: Visual strength meter guides you toward resilient passphrases.',
      'Universal PDF reader support: Encrypted outputs prompt for passwords in Adobe, Chrome, Preview, and mobile.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload PDF to Encrypt',
        description: 'Drag and drop your unencrypted PDF document into the secure local upload box.',
      },
      {
        step: 2,
        title: 'Set Password & Restrictions',
        description: 'Enter and confirm your open password and toggle print, copy, and edit permission flags.',
      },
      {
        step: 3,
        title: 'Encrypt & Download Protected PDF',
        description: 'Click "Protect & Download" to encrypt the file in memory and save your locked PDF.',
      },
    ],
    faqs: [
      {
        question: 'Does fileMakeR store or see my PDF password?',
        answer: 'Never. Encryption happens completely in client-side JavaScript inside your browser tab with zero network requests.',
      },
      {
        question: 'What happens if I forget the password I added?',
        answer: 'Because we never transmit or escrow passwords, a lost open password cannot be recovered by fileMakeR. Keep your password stored safely.',
      },
      {
        question: 'What is the difference between User Password and Owner Password?',
        answer: 'The User Password is required just to open and view the PDF. The Owner Password grants full administrative override to print, copy, or change permissions.',
      },
      {
        question: 'Can I restrict recipients from copying text or printing?',
        answer: 'Yes. Uncheck the Allow Printing or Allow Copying checkboxes before encrypting to enforce those PDF permission flags.',
      },
    ],
    relatedToolSlugs: ['/unlock-pdf', '/sign-pdf', '/pdf-metadata', '/compress-pdf'],
  },

  'unlock-pdf': {
    id: 'unlock-pdf',
    slug: '/unlock-pdf',
    name: 'Unlock / Decrypt PDF',
    category: 'pdf',
    h1: 'Unlock PDF Online Free - Remove Known Password Restrictions',
    metaTitle: 'Unlock PDF Online Free - Decrypt Password-Protected PDFs | fileMakeR',
    metaDescription: 'Remove open passwords and printing or copying restrictions from your authorized PDF documents 100% locally in your browser with zero file uploads.',
    canonicalUrl: `${SITE_URL}/unlock-pdf`,
    overviewHeading: 'Safely Remove Passwords from Your Authorized PDFs',
    overviewText: 'Tax portals, banks, credit card statements, and payroll systems regularly lock downloaded PDFs behind annoying passwords that prevent merging, annotating, or convenient printing. Uploading your bank statements and your password to a remote web server is a serious privacy hazard. fileMakeR unlocks encrypted PDF documents completely inside your browser using the password you already possess, preserving original document metadata and page formatting while outputting a clean, restriction-free PDF.',
    keyFeatures: [
      'Authorized local decryption: Unlock files strictly inside device RAM without transmitting passwords.',
      'Removes open & permission locks: Clears password prompts as well as print/copy blocks.',
      'Metadata preservation: Keeps original PDF Title and Author tags intact where readable.',
      'Instant inline retry: Clear error prompt if a typo occurs when typing complex passwords.',
      'Works offline: Decrypt stored statements even with Wi-Fi disabled.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Select Locked PDF',
        description: 'Upload the password-protected bank statement, invoice, or report.',
      },
      {
        step: 2,
        title: 'Enter Document Password',
        description: 'Type the open or owner password authorized for the document.',
      },
      {
        step: 3,
        title: 'Decrypt & Download Clean PDF',
        description: 'Click "Unlock PDF" to strip encryption layers and save an unrestricted PDF copy.',
      },
    ],
    faqs: [
      {
        question: 'Can this tool crack or bypass an unknown password?',
        answer: 'No. This utility cleanly decrypts PDFs for which you already have the authorized password, removing repetitive password prompts for personal archiving and merging.',
      },
      {
        question: 'Are my financial statements or passwords sent anywhere?',
        answer: 'Never. Both your encrypted PDF and the password you enter remain exclusively in your browser memory.',
      },
      {
        question: 'Why should I unlock a PDF before using Merge PDF or Split PDF?',
        answer: 'Encrypted PDFs prevent browser page-tree editors from copying streams until unlocked. Unlocking first lets you merge, split, or compress smoothly.',
      },
      {
        question: 'Will unlocking affect text searchability or image sharpness?',
        answer: 'No. Text vectors, fonts, and embedded images remain identical in the decrypted output.',
      },
    ],
    relatedToolSlugs: ['/protect-pdf', '/merge-pdf', '/split-pdf', '/pdf-metadata'],
  },

  'pdf-metadata': {
    id: 'pdf-metadata',
    slug: '/pdf-metadata',
    name: 'View / Edit PDF Metadata',
    category: 'pdf',
    h1: 'View & Edit PDF Metadata Online - Update or Strip Document Properties',
    metaTitle: 'View & Edit PDF Metadata Free - Remove Hidden Info Tags | fileMakeR',
    metaDescription: 'Inspect, edit, or completely strip hidden Title, Author, Subject, Keywords, Creator, and Producer tags from PDF files 100% locally in your browser.',
    canonicalUrl: `${SITE_URL}/pdf-metadata`,
    overviewHeading: 'Audit, Customize & Scrub Hidden PDF Info Dictionaries',
    overviewText: 'Every PDF file silently stores a hidden Info dictionary containing the original author name, software version, creation date, internal project keywords, and producer tags. Sharing raw PDFs can accidentally leak personal names or internal workflows, while poorly tagged files look unprofessional in browser tabs and search results. fileMakeR reveals every stored metadata property inside your browser so you can update Title, Author, Subject, Keywords, Creator, and Producer—or scrub all identifiable metadata in one click.',
    keyFeatures: [
      'Complete metadata inspector: View Title, Author, Subject, Keywords, Creator, Producer, and Dates.',
      'One-click Strip All Metadata: Scrub identifying author and software tags before anonymous sharing.',
      'SEO & presentation polish: Set proper document Titles so files display cleanly in Chrome/Acrobat tabs.',
      'Lossless pass-through: Updates the PDF trailer dictionary without touching page visual content.',
      '100% private client-side execution: Inspect confidential drafts safely offline.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Load Any PDF File',
        description: 'Upload your PDF document to automatically decode and display its hidden Info dictionary properties.',
      },
      {
        step: 2,
        title: 'Edit or Scrub Fields',
        description: 'Update Title, Author, Subject, Keywords, Creator, and Producer fields, or click "Strip All Metadata".',
      },
      {
        step: 3,
        title: 'Save & Download Clean PDF',
        description: 'Click "Save Metadata & Download" to export the updated document cleanly.',
      },
    ],
    faqs: [
      {
        question: 'Why does changing the PDF Title matter?',
        answer: 'Web browsers and PDF readers show the internal PDF Title in the tab bar instead of the filename. Setting a clean Title gives documents a polished look.',
      },
      {
        question: 'What does "Strip All Metadata" remove?',
        answer: 'It clears Title, Author, Subject, Keywords, Creator, and Producer tags so hidden personal or software names are wiped before publishing.',
      },
      {
        question: 'Does editing metadata alter page text, fonts, or layout?',
        answer: 'No. Only the PDF Info metadata fields are modified while every page object remains untouched.',
      },
      {
        question: 'Does this work with zero server uploads?',
        answer: 'Yes. Inspection and updating are executed directly inside browser RAM via pdf-lib.',
      },
    ],
    relatedToolSlugs: ['/protect-pdf', '/unlock-pdf', '/sign-pdf', '/compress-pdf'],
  },

  'rotate-flip-image': {
    id: 'rotate-flip-image',
    slug: '/rotate-flip-image',
    name: 'Rotate & Flip Image',
    category: 'image',
    h1: 'Rotate & Flip Images Online - 90° Turns, Mirror Flip & Fine Angle',
    metaTitle: 'Rotate & Flip Image Online Free - Batch Mirror & Custom Angle | fileMakeR',
    metaDescription: 'Rotate JPG, PNG, and WebP photos by 90°, 180°, 270°, mirror horizontally or vertically, or straighten crooked horizons with fine degree precision.',
    canonicalUrl: `${SITE_URL}/rotate-flip-image`,
    overviewHeading: 'Fix Orientation & Straighten Photos Instantly in Browser',
    overviewText: 'Sideways phone photos, mirrored webcam selfies, and slightly tilted document scans are effortless to fix without opening desktop photo editors. fileMakeR applies hardware-accelerated HTML5 Canvas matrix transformations to rotate images in crisp 90-degree increments, mirror flip horizontally or vertically, or fine-tune any angle between -180° and +180°. Automatically expands canvas dimensions to prevent corner clipping during free-angle straightening and supports single or batch ZIP downloads.',
    keyFeatures: [
      'Instant 90° left/right turns and 180° flips with zero quality degradation.',
      'Horizontal and vertical mirror reflection for inverted scans and selfies.',
      'Fine angle slider (-180° to +180°) with automatic bounding-box expansion.',
      'Batch orientation transforms with unified ZIP archive download.',
      'Live canvas preview showing exact transformed pixels before export.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Single or Batch Images',
        description: 'Drop one or multiple JPG, PNG, or WebP files into the workspace.',
      },
      {
        step: 2,
        title: 'Rotate, Flip or Tilt',
        description: 'Use quick 90° rotate/flip buttons or adjust the custom degree slider while watching the live preview.',
      },
      {
        step: 3,
        title: 'Export Transformed File(s)',
        description: 'Select target format and click apply to download your corrected image or ZIP pack.',
      },
    ],
    faqs: [
      {
        question: 'Does rotating by a custom angle cut off corners of my photo?',
        answer: 'No. Our trigonometric bounding-box formula expands the output canvas automatically so every corner of the rotated photo fits intact.',
      },
      {
        question: 'Can I preserve transparent backgrounds when rotating PNG logos?',
        answer: 'Yes. Exporting as PNG or WebP preserves full alpha channel transparency around rotated edges.',
      },
      {
        question: 'Can I mirror a photo horizontally and rotate at the same time?',
        answer: 'Yes. Flip and rotation transforms combine seamlessly in a single lossless pass.',
      },
      {
        question: 'Can I process multiple sideways images together?',
        answer: 'Yes. Upload a batch of images, set the transform once, and download all fixed photos inside a ZIP archive.',
      },
    ],
    relatedToolSlugs: ['/crop-image', '/resize-image', '/watermark-image', '/convert-image'],
  },

  'watermark-image': {
    id: 'watermark-image',
    slug: '/watermark-image',
    name: 'Add Watermark to Image',
    category: 'image',
    h1: 'Add Watermark to Image Online - Custom Text & Logo Overlay',
    metaTitle: 'Add Watermark to Image Free - Text, Logo & Tiled Protection | fileMakeR',
    metaDescription: 'Protect photos and graphics with custom translucent text or PNG logo watermarks across corners, center, or diagonal tiled grids directly in your browser.',
    canonicalUrl: `${SITE_URL}/watermark-image`,
    overviewHeading: 'Brand & Protect Photography with Text or Logo Watermarks',
    overviewText: 'Photographers, designers, e-commerce sellers, and agencies need an effortless way to stamp copyright notices or brand logos onto photos before sharing proofs online. fileMakeR renders crisp live-preview text watermarks and transparent PNG/SVG logo overlays completely inside your browser. Place your mark in any of 9 standard grid positions or generate a full diagonal tiled pattern across every pixel, with fine control over opacity, scale, color, and angle—for single photos or entire batches exported as a ZIP.',
    keyFeatures: [
      'Dual watermark modes: Custom typography text watermark or uploaded transparent brand logo.',
      '9-point placement + Tiled Grid mode: Lock stamps to corners, center, or repeat diagonally.',
      'Granular opacity, scale & angle controls with real-time canvas preview.',
      'Batch watermarking: Protect multiple product photos or proofs simultaneously.',
      '100% private client-side rendering: Unwatermarked originals never leave your computer.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Photo(s) to Protect',
        description: 'Select one or multiple JPG, PNG, or WebP images you want to brand or protect.',
      },
      {
        step: 2,
        title: 'Customize Text or Logo Mark',
        description: 'Choose Text or Logo mode, tune opacity, size, color, rotation angle, and grid placement.',
      },
      {
        step: 3,
        title: 'Apply & Download Watermarked Output',
        description: 'Click apply to bake the watermark cleanly into every image and download or save as ZIP.',
      },
    ],
    faqs: [
      {
        question: 'Can I upload my company logo PNG as a watermark?',
        answer: 'Yes. Switch to Logo mode and upload a PNG or SVG brand mark with transparency for crisp corner or tiled branding.',
      },
      {
        question: 'What does Tiled Grid mode do?',
        answer: 'Tiled mode repeats your watermark evenly across the entire photo surface so no part of the image can be easily cropped clean.',
      },
      {
        question: 'Are my original unwatermarked photos uploaded anywhere?',
        answer: 'Never. All pixel compositing executes inside local browser HTML5 Canvas.',
      },
      {
        question: 'Can I batch watermark multiple product images at once?',
        answer: 'Yes. Upload all images in one batch, configure your watermark once, and download everything as a ZIP archive.',
      },
    ],
    relatedToolSlugs: ['/add-watermark', '/blur-image', '/compress-image', '/resize-image'],
  },

  'blur-image': {
    id: 'blur-image',
    slug: '/blur-image',
    name: 'Blur / Pixelate Faces & Info',
    category: 'image',
    h1: 'Blur & Pixelate Faces or Sensitive Info in Photos Online Free',
    metaTitle: 'Blur & Pixelate Faces, IDs & Text Online Free | fileMakeR',
    metaDescription: 'Interactively blur, pixelate, or blackout faces, license plates, Aadhaar/ID numbers, and sensitive screenshot details 100% locally in your browser.',
    canonicalUrl: `${SITE_URL}/blur-image`,
    overviewHeading: 'Irreversible Client-Side Photo Redaction for Complete Privacy',
    overviewText: 'Screenshots, receipts, identity cards, and street photographs frequently contain sensitive details—faces, phone numbers, home addresses, license plates, or account numbers—that must be censored before posting online. fileMakeR provides an interactive HTML5 Canvas redaction studio running 100% on your device. Simply drag rectangles or ovals across any region to apply true pixelation, smooth blur, or solid blackout masks, adjust block intensity, undo steps freely, and export a flattened high-resolution image with redacted pixels baked permanently into the bitmap.',
    keyFeatures: [
      'Three censoring styles: Classic Pixelate blocks, soft Gaussian-style Blur, and Solid Blackout bars.',
      'Rectangle & Oval masks: Drag rectangular redaction boxes over text or ovals over faces.',
      'True pixel-level flattening: Redacted areas are mathematically overwritten in output pixel buffers.',
      'Multi-region editing with Undo & Clear All history on live canvas preview.',
      'Zero cloud exposure: Uncensored source photos remain strictly on your device.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload Photo or Screenshot',
        description: 'Open any JPG, PNG, or WebP image containing sensitive regions you want to hide.',
      },
      {
        step: 2,
        title: 'Drag Over Faces or Text',
        description: 'Select Pixelate, Blur, or Blackout and Box or Oval shape, then drag directly on the canvas over sensitive details.',
      },
      {
        step: 3,
        title: 'Export Flattened Redacted Image',
        description: 'Review the live censored preview and click download to save your permanently redacted photo.',
      },
    ],
    faqs: [
      {
        question: 'Can someone undo or reverse the pixelation after I download the image?',
        answer: 'No. Because regions are flattened directly into a fresh raster PNG/JPG image buffer, original pixels underneath Blackout and aggressive Pixelate/Blur masks are permanently replaced.',
      },
      {
        question: 'Which mode is best for hiding credit card or ID numbers?',
        answer: 'Solid Blackout or high-intensity Pixelation provides the strongest protection for readable digits and barcodes.',
      },
      {
        question: 'Can I blur multiple areas in the same picture?',
        answer: 'Yes. Draw as many rectangular or oval zones as needed and use the Undo button anytime if you misplace a box.',
      },
      {
        question: 'Is my uncensored photo ever sent over the internet?',
        answer: 'Never. All pixel array manipulation runs in local JavaScript memory on your computer or phone.',
      },
    ],
    relatedToolSlugs: ['/watermark-image', '/crop-image', '/compress-image', '/rotate-flip-image'],
  },

  'svg-to-image': {
    id: 'svg-to-image',
    slug: '/svg-to-image',
    name: 'SVG to PNG / JPG Converter',
    category: 'image',
    h1: 'Convert SVG to High-Resolution PNG, JPG & WebP Online Free',
    metaTitle: 'SVG to PNG / JPG Converter Online Free - 1x to 8x Retina Scale | fileMakeR',
    metaDescription: 'Convert .svg files or pasted SVG vector markup into sharp high-DPI PNG, JPG, or WebP images up to 8x scale with transparent or custom solid backgrounds.',
    canonicalUrl: `${SITE_URL}/svg-to-image`,
    overviewHeading: 'Sharp Vector-to-Raster SVG Export up to 8x Scale',
    overviewText: 'Designers, developers, and marketers regularly need crisp bitmap assets from scalable SVG icons, illustrations, and logos for slide decks, mobile apps, and email newsletters where raw .svg attachments are blocked. fileMakeR parses both uploaded .svg files and pasted raw <svg> XML markup inside your browser, preserves viewBox proportions, lets you scale resolution from 1x up to razor-sharp 8x Retina dimensions, and exports transparent PNGs or solid-background JPG and WebP files with zero server uploads.',
    keyFeatures: [
      'Dual input support: Upload multiple .svg files in batch or paste raw <svg> XML code directly.',
      'Ultra-sharp scaling: Export at 1x, 2x, 3x, 4x, or 8x resolution multipliers without pixelation.',
      'Transparency or custom fill: Keep transparent alpha channels in PNG/WebP or apply any background color.',
      'Automatic viewBox & dimension parsing: Safely handles SVGs lacking explicit width/height attributes.',
      'Batch ZIP download: Export dozens of converted vector icons in a single compressed archive.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Upload .SVG File(s) or Paste Markup',
        description: 'Drag and drop one or more SVG vector files or switch to the Paste SVG Code tab.',
      },
      {
        step: 2,
        title: 'Choose Scale & Format',
        description: 'Select PNG, JPG, or WebP output, pick resolution scale (1x–8x), and configure background fill.',
      },
      {
        step: 3,
        title: 'Convert & Download Raster Assets',
        description: 'Render your high-DPI bitmap images and save individually or as a ZIP pack.',
      },
    ],
    faqs: [
      {
        question: 'Can I paste raw SVG code copied from Figma or Illustrator?',
        answer: 'Yes. Switch to Paste Code mode, paste your <svg>...</svg> snippet, and render it straight to PNG, JPG, or WebP.',
      },
      {
        question: 'Why does SVG to PNG preserve sharp edges when scaled to 4x or 8x?',
        answer: 'Unlike raster JPEGs, SVG stores mathematical vector paths. Scaling before rasterization instructs your browser to paint vector curves cleanly at full target resolution.',
      },
      {
        question: 'Does PNG export keep transparent backgrounds?',
        answer: 'Yes. Select "Transparent" background fill with PNG or WebP format to keep crisp transparent backdrops around icons and logos.',
      },
      {
        question: 'Is this converter safe for proprietary brand icons?',
        answer: '100% safe. Vector parsing and canvas rasterization occur strictly inside your local browser memory.',
      },
    ],
    relatedToolSlugs: ['/convert-image', '/base64-image', '/resize-image', '/watermark-image'],
  },

  'base64-image': {
    id: 'base64-image',
    slug: '/base64-image',
    name: 'Base64 Image Encoder & Decoder',
    category: 'image',
    h1: 'Base64 Image Encoder & Decoder - Data URI, HTML, CSS & Download',
    metaTitle: 'Base64 Image Encoder & Decoder Online Free | fileMakeR',
    metaDescription: 'Encode JPG, PNG, WebP, or SVG images into Base64 Data URIs, HTML <img> tags, and CSS snippets, or decode Base64 strings back into downloadable image files.',
    canonicalUrl: `${SITE_URL}/base64-image`,
    overviewHeading: 'Bidirectional Developer Tool for Base64 Images & Data URIs',
    overviewText: 'Embedding small icons directly into stylesheets, inspecting JSON API image payloads, or recovering images stored as raw Base64 strings is part of everyday web engineering. fileMakeR delivers both directions cleanly in a single private browser utility. Drop any image to copy ready-to-paste Data URIs, raw Base64 strings, HTML <img> tags, CSS background-image rules, or download a .txt bundle. Or switch to Decoder mode to paste any raw Base64 string or Data URI—magic bytes automatically detect PNG, JPG, GIF, WebP, or SVG MIME types for immediate preview and download.',
    keyFeatures: [
      'Image → Base64 snippets: Generate Data URI, Raw Base64, HTML <img>, and CSS background rules.',
      'Base64 → Image decoder: Accepts both full data:image/... URIs and bare raw Base64 strings.',
      'Magic-byte MIME detection: Automatically identifies PNG, JPEG, GIF, WebP, and SVG signatures.',
      'Payload size breakdown: Inspect original byte size vs Base64 encoded string length.',
      '100% client-side execution: Safe for internal API payloads, tokens, and proprietary assets.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Choose Encode or Decode Mode',
        description: 'Pick "Image to Base64" to generate code snippets or "Base64 to Image" to reconstruct a file.',
      },
      {
        step: 2,
        title: 'Provide Image or Paste Base64',
        description: 'Upload a graphic file or paste your Base64 / Data URI text string into the decoder field.',
      },
      {
        step: 3,
        title: 'Copy Snippets or Download Result',
        description: 'Copy formatted HTML/CSS/Data URI outputs or download the decoded image file.',
      },
    ],
    faqs: [
      {
        question: 'Can the decoder handle raw Base64 without a data:image prefix?',
        answer: 'Yes. Even if your string lacks the "data:image/png;base64," header, magic-byte inspection detects PNG, JPG, WebP, GIF, and SVG automatically.',
      },
      {
        question: 'Why is a Base64 string larger than the original image file?',
        answer: 'Base64 encoding maps 3 binary bytes into 4 ASCII characters, resulting in roughly 33% size overhead—useful for small inline icons rather than large photographs.',
      },
      {
        question: 'Can I download the generated Base64 text as a file?',
        answer: 'Yes. Click download to save the complete Data URI text neatly to a .txt file.',
      },
      {
        question: 'Are proprietary screenshots or Base64 strings sent to a backend?',
        answer: 'Never. Conversion runs completely inside your browser with zero external requests.',
      },
    ],
    relatedToolSlugs: ['/svg-to-image', '/convert-image', '/qr-code', '/zip-archive'],
  },

  'qr-code': {
    id: 'qr-code',
    slug: '/qr-code',
    name: 'QR Code Generator & Scanner',
    category: 'utility',
    h1: 'QR Code Generator & Scanner Online Free - URL, Wi-Fi, UPI, vCard & Logo',
    metaTitle: 'QR Code Generator & Scanner Online Free - Wi-Fi, UPI, SVG & Camera | fileMakeR',
    metaDescription: 'Generate custom QR codes with URLs, Wi-Fi login, UPI payments, vCards, colors, and center logos (PNG/SVG), or scan QR codes live from camera or image files.',
    canonicalUrl: `${SITE_URL}/qr-code`,
    overviewHeading: 'All-in-One Custom QR Code Studio & In-Browser Scanner',
    overviewText: 'Generating clean high-resolution QR codes for websites, guest Wi-Fi networks, UPI instant payments, contact cards, or product packaging should be effortless and track-free—with zero expiring dynamic redirects. fileMakeR generates genuine static QR codes directly inside your browser that never expire. Customize foreground and background colors, select High (H) error correction, optionally embed a crisp center logo, and export vector SVG or high-DPI PNG files. Need to inspect a QR code safely first? Switch to the Scanner tab to decode any uploaded QR image or scan live via your webcam.',
    keyFeatures: [
      'Rich payload builders: Dedicated forms for URLs, Plain Text, Wi-Fi auto-join, UPI Payments, Email, and vCard Contacts.',
      'Brand styling & Center Logo: Customize colors, pixel size, quiet zone, Error Correction (L/M/Q/H), and logo overlay.',
      'Dual crisp exports: Download high-resolution PNG graphics or infinite-scale vector SVG artwork.',
      'Built-in QR Scanner: Decode QR codes safely from uploaded images or live camera feed without visiting links blindly.',
      'Static & permanent: Zero third-party tracking redirects—your generated QR codes never expire.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Choose Generate or Scan Mode',
        description: 'Stay on Generate QR to build custom codes, or switch to Scan QR to read existing codes from images or camera.',
      },
      {
        step: 2,
        title: 'Enter Data & Customize Style',
        description: 'Fill out URL, Wi-Fi, UPI, Email, or vCard fields, tune colors/size, and optionally add a center logo.',
      },
      {
        step: 3,
        title: 'Download PNG/SVG or Copy Scanned Result',
        description: 'Save crisp PNG/SVG QR files or view and copy decoded payloads from your camera or uploaded image.',
      },
    ],
    faqs: [
      {
        question: 'Do QR codes created with fileMakeR ever expire?',
        answer: 'No. Because data is encoded directly into static QR modules rather than routed through a redirect server, your codes remain valid permanently.',
      },
      {
        question: 'Can I add my brand logo in the center of a QR code reliably?',
        answer: 'Yes. Selecting "High (30%)" error correction leaves sufficient redundant parity data so phones continue scanning smoothly even with a center logo overlay.',
      },
      {
        question: 'Does Wi-Fi QR scanning automatically connect smartphones?',
        answer: 'Yes. Standard WIFI:T:... payloads let iOS and Android cameras join the Wi-Fi SSID cleanly with a single tap without typing long passwords.',
      },
      {
        question: 'Is my webcam stream or scanned QR image recorded anywhere?',
        answer: 'Never. Camera frames are decoded strictly frame-by-frame in local JavaScript memory using jsQR and discarded immediately.',
      },
    ],
    relatedToolSlugs: ['/base64-image', '/svg-to-image', '/zip-archive', '/watermark-image'],
  },

  'zip-archive': {
    id: 'zip-archive',
    slug: '/zip-archive',
    name: 'ZIP Archive Creator & Extractor',
    category: 'utility',
    h1: 'ZIP Archive Creator & Extractor Online Free - Compress & Unzip Files',
    metaTitle: 'ZIP Creator & Extractor Online Free - Bundle Folders & Unzip | fileMakeR',
    metaDescription: 'Create DEFLATE-compressed .zip archives from files or folders, or inspect folder contents and extract individual files from any .zip archive 100% locally.',
    canonicalUrl: `${SITE_URL}/zip-archive`,
    overviewHeading: 'Private In-Browser ZIP Compression & Safe Archive Inspection',
    overviewText: 'Need to bundle project folders for delivery or inspect a suspicious .zip attachment before extracting files onto your hard drive? fileMakeR gives you full client-side archive creation and inspection powered by JSZip inside browser RAM. In Creator mode, drag files or entire nested directories into the queue, preserve folder hierarchies, adjust DEFLATE compression levels (0–9), and inspect real-time archive size before saving. In Extractor mode, preview every filename, directory path, uncompressed size, and compression ratio inside any .zip archive, extract single items safely, or save everything cleanly.',
    keyFeatures: [
      'Create ZIP from files or folders: Supports drag-and-drop files plus full directory hierarchy uploads.',
      'Custom DEFLATE compression: Choose Store (Level 0) through Maximum Compression (Level 9).',
      'Safe archive inspector: Preview exact filenames, folder paths, and sizes before extracting.',
      'Individual file extraction: Pull out only the single document you need without unpacking an entire bundle.',
      'Path traversal sanitization: Safely normalizes archive entry names inside isolated browser memory.',
    ],
    howToSteps: [
      {
        step: 1,
        title: 'Choose Create ZIP or Extract ZIP',
        description: 'Pick Creator tab to bundle files/folders, or Extractor tab to open an existing .zip archive.',
      },
      {
        step: 2,
        title: 'Configure Files or Inspect Entries',
        description: 'Add files/folders and set compression level (or browse every entry listed inside your uploaded archive).',
      },
      {
        step: 3,
        title: 'Download ZIP or Extract Files',
        description: 'Save your freshly compressed .zip archive or extract individual entries directly to your device.',
      },
    ],
    faqs: [
      {
        question: 'Can I upload an entire folder while keeping subfolders intact inside the ZIP?',
        answer: 'Yes. Use the "Add Folder" selector to preserve relative folder paths automatically inside your compressed archive.',
      },
      {
        question: 'Can I extract just one file from a large ZIP without extracting everything?',
        answer: 'Yes. Extractor mode lists every file inside the archive with an individual Extract button next to each entry.',
      },
      {
        question: 'What compression level should I choose?',
        answer: 'Level 6 (Balanced) delivers strong size reduction quickly for most files, while Level 9 maximizes compression for text/code and Level 0 bundles uncompressible videos rapidly.',
      },
      {
        question: 'Are my archived documents uploaded to a cloud server?',
        answer: 'Never. All compression and decompression happens strictly in your browser RAM with zero server transmission.',
      },
    ],
    relatedToolSlugs: ['/merge-pdf', '/split-pdf', '/qr-code', '/base64-image'],
  },
};
