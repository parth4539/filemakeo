/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolCategory = 'pdf' | 'image';

export interface ToolDef {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  shortDesc: string;
  longDesc: string;
  icon: string;
  badge?: string;
  accept: string[]; // e.g. ['.pdf'] or ['.jpg', '.jpeg', '.png', '.webp']
  multiple: boolean;
  maxFiles?: number;
  howToSteps: [string, string, string];
  popular?: boolean;
}

export const TOOLS: ToolDef[] = [
  // --- PDF TOOLS ---
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    slug: '/merge-pdf',
    category: 'pdf',
    shortDesc: 'Combine multiple PDFs into one unified document in any order.',
    longDesc: 'Upload multiple PDF files, reorder pages or documents with visual drag and drop, and merge them into a single crisp PDF.',
    icon: 'Files',
    badge: 'Popular',
    accept: ['.pdf', 'application/pdf'],
    multiple: true,
    popular: true,
    howToSteps: [
      'Select or drag & drop two or more PDF files.',
      'Reorder documents using the move buttons.',
      'Click "Merge PDF" to instantly download your combined file.',
    ],
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    slug: '/split-pdf',
    category: 'pdf',
    shortDesc: 'Extract page ranges or save every single page as a separate PDF.',
    longDesc: 'Separate one page or a whole set for easy conversion into independent PDF files or a ZIP archive.',
    icon: 'Split',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    popular: true,
    howToSteps: [
      'Upload the PDF you want to split.',
      'Choose to extract all pages separately or specify ranges like "1-3, 5, 7-9".',
      'Download individual PDFs or all files bundled in a ZIP.',
    ],
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    slug: '/organize-pdf',
    category: 'pdf',
    shortDesc: 'Sort, reorder, delete, and rotate individual pages visually.',
    longDesc: 'See visual thumbnails of every page in your PDF. Drag or shift pages to reorder, rotate specific pages, or remove unwanted pages.',
    icon: 'LayoutGrid',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload your PDF to load thumbnail previews of each page.',
      'Reorder, rotate, or delete any specific page with one click.',
      'Click "Save & Download" to get your clean organized PDF.',
    ],
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    slug: '/rotate-pdf',
    category: 'pdf',
    shortDesc: 'Rotate PDF pages 90, 180, or 270 degrees clockwise or counter-clockwise.',
    longDesc: 'Fix upside-down or sideways pages. Rotate all pages or target specific pages effortlessly.',
    icon: 'RotateCw',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload the PDF document needing rotation.',
      'Select rotation angle (90°, 180°, or 270°) and choose all or specific pages.',
      'Click "Rotate PDF" to download the permanently oriented PDF.',
    ],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    slug: '/compress-pdf',
    category: 'pdf',
    shortDesc: 'Reduce PDF file size drastically with Low, Medium, or High compression.',
    longDesc: 'Optimize documents for email attachments and portal uploads. Real-time before and after size calculation with zero file uploads.',
    icon: 'Minimize2',
    badge: 'Essential',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    popular: true,
    howToSteps: [
      'Select a heavy PDF document to compress.',
      'Select your preferred compression level (Low, Medium, or High).',
      'Download the compressed PDF and inspect the percentage saved.',
    ],
  },
  {
    id: 'image-to-pdf',
    name: 'JPG/PNG to PDF',
    slug: '/image-to-pdf',
    category: 'pdf',
    shortDesc: 'Convert JPG, PNG, or WebP images into a single professional PDF.',
    longDesc: 'Turn photos, scans, and documents into a clean PDF. Customize page size (A4, Letter, Fit), orientation, and margins.',
    icon: 'Image',
    accept: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    multiple: true,
    popular: true,
    howToSteps: [
      'Upload one or more JPG, PNG, or WebP images.',
      'Reorder images and set page format (A4, Letter, Margins).',
      'Click "Convert to PDF" to generate and download your document.',
    ],
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to JPG/PNG',
    slug: '/pdf-to-image',
    category: 'pdf',
    shortDesc: 'Extract all PDF pages as high-resolution JPG or PNG images.',
    longDesc: 'Convert every page of your PDF document into crisp individual image files or a complete ZIP package.',
    icon: 'FileImage',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload the PDF document you want to convert.',
      'Choose output format (JPG or PNG) and image clarity multiplier.',
      'Download individual page images or grab all of them in a single ZIP.',
    ],
  },
  {
    id: 'add-page-numbers',
    name: 'Add Page Numbers',
    slug: '/add-page-numbers',
    category: 'pdf',
    shortDesc: 'Stamp page numbers with custom position, starting index, and formatting.',
    longDesc: 'Number pages easily. Select corner or center alignment, prefix formats ("Page {n} of {total}"), font sizes, and colors.',
    icon: 'Hash',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload the PDF you want to paginate.',
      'Pick position (e.g. Bottom-Right), format, starting number, and font size.',
      'Click "Apply Page Numbers" to generate and download.',
    ],
  },
  {
    id: 'add-watermark',
    name: 'Add Watermark',
    slug: '/add-watermark',
    category: 'pdf',
    shortDesc: 'Stamp customized text watermarks with opacity and rotation control.',
    longDesc: 'Protect your documents with custom text watermarks like "CONFIDENTIAL", "DRAFT", or your company name across every page.',
    icon: 'Stamp',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload your PDF document.',
      'Type your watermark text, adjust rotation angle, opacity, font size, and color.',
      'Click "Apply Watermark" to download the watermarked PDF.',
    ],
  },
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    slug: '/remove-pages',
    category: 'pdf',
    shortDesc: 'Select and permanently delete unwanted pages from your PDF.',
    longDesc: 'Click on page thumbnails or enter page numbers to strip out unneeded sheets from your document.',
    icon: 'Trash2',
    accept: ['.pdf', 'application/pdf'],
    multiple: false,
    howToSteps: [
      'Upload your PDF to view interactive thumbnails of every page.',
      'Click the pages you wish to discard or enter ranges like "2, 4-6".',
      'Click "Remove Selected Pages" to save the trimmed document.',
    ],
  },

  // --- IMAGE TOOLS ---
  {
    id: 'compress-image',
    name: 'Compress Image',
    slug: '/compress-image',
    category: 'image',
    shortDesc: 'Compress JPG, PNG & WebP. Includes Target Size mode (<50KB, <100KB).',
    longDesc: 'Reduce image file size while keeping high visual clarity. Includes auto-search target size mode for Indian government, visa, and exam portal uploads.',
    icon: 'FileDown',
    badge: 'Govt Form Ready',
    accept: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    multiple: false,
    popular: true,
    howToSteps: [
      'Upload your JPG, PNG, or WebP photo.',
      'Use the Quality slider or choose a Target Size (e.g. Under 50 KB or 100 KB).',
      'Download your optimized image with immediate file size savings displayed.',
    ],
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    slug: '/resize-image',
    category: 'image',
    shortDesc: 'Resize by pixels, percentages, or presets (Passport, Govt Exam, Signature).',
    longDesc: 'Change image dimensions with strict aspect ratio lock or custom dimensions. Includes built-in presets for SSC, UPSC, Passport, and Signature.',
    icon: 'Scaling',
    badge: 'Presets',
    accept: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    multiple: false,
    popular: true,
    howToSteps: [
      'Upload the photo or graphic to resize.',
      'Enter custom dimensions or select a preset (Passport, Signature, Social).',
      'Click "Resize Image" and download your perfectly scaled photo.',
    ],
  },
  {
    id: 'convert-image',
    name: 'Convert Image',
    slug: '/convert-image',
    category: 'image',
    shortDesc: 'Batch convert between JPG, PNG, and modern WebP formats in seconds.',
    longDesc: 'Transform graphics and photos between formats. Handles background filling for transparent PNG to JPG conversion with high-fidelity output.',
    icon: 'Repeat',
    accept: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    multiple: true,
    howToSteps: [
      'Upload one or multiple images in JPG, PNG, or WebP format.',
      'Select target format (JPG, PNG, WebP) and quality level.',
      'Download converted files individually or together in a ZIP file.',
    ],
  },
  {
    id: 'crop-image',
    name: 'Crop Image',
    slug: '/crop-image',
    category: 'image',
    shortDesc: 'Crop photos with aspect ratio presets (1:1, 4:3, 16:9, Passport 3:4).',
    longDesc: 'Interactive canvas crop box. Trim unwanted edges, focus on subjects, and export crisp cropped images without server uploads.',
    icon: 'Crop',
    accept: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    multiple: false,
    howToSteps: [
      'Upload the photo you need to crop.',
      'Drag and adjust the bounding crop box or select an aspect ratio preset.',
      'Click "Crop & Download" to save your cropped image immediately.',
    ],
  },
];
