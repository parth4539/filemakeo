/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS_SEO_DATA, SITE_URL, ToolSeoData } from '../src/data/toolsSeoData.ts';
import { TOOLS } from '../src/types/tool.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

function cleanHeadTags(html: string): string {
  return html
    .replace(/<link rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta property="og:[^"]+"[^>]*>\s*/gi, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>\s*/gi, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');
}

function generateToolHtml(seo: ToolSeoData, baseHtml: string): string {
  // Clean default base tags
  let html = cleanHeadTags(baseHtml);

  // Related tools
  const relatedTools = TOOLS.filter((t) => seo.relatedToolSlugs.includes(t.slug));

  // JSON-LD Schemas
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${seo.name} - fileMakeO`,
    url: seo.canonicalUrl,
    description: seo.metaDescription,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: 'Parth Prajapati',
    },
    featureList: seo.keyFeatures.join(', '),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // Crawlable server-side HTML content (>350 words of real text)
  const crawlableRootContent = `
    <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" class="font-extrabold text-lg text-slate-900 dark:text-slate-100">fileMakeO</a>
          <nav class="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="/?category=pdf#pdf-tools">PDF Tools</a>
            <a href="/?category=image#image-tools">Image Tools</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      </header>

      <main class="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <nav aria-label="Breadcrumb" class="text-sm text-slate-600 dark:text-slate-300">
          <a href="/">Home</a> &gt; <span>${seo.category === 'pdf' ? 'PDF Tools' : 'Image Tools'}</span> &gt; <span>${seo.name}</span>
        </nav>

        <section class="text-center space-y-3">
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            ${seo.h1}
          </h1>
          <p class="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            ${seo.metaDescription}
          </p>
        </section>

        <!-- Deep Overview Article -->
        <article class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">${seo.overviewHeading}</h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">${seo.overviewText}</p>

          <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100">Key Technical Capabilities:</h3>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              ${seo.keyFeatures.map((f) => `<li class="flex items-center gap-2">&bull; ${f}</li>`).join('\n')}
            </ul>
          </div>
        </article>

        <!-- 3-Step "How to use" Guide with Microdata -->
        <section itemscope itemtype="https://schema.org/HowTo" class="space-y-4">
          <h2 itemprop="name" class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            How to use ${seo.name} in 3 Simple Steps
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${seo.howToSteps
              .map(
                (step) => `
              <div itemprop="step" itemscope itemtype="https://schema.org/HowToStep" class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="font-bold text-blue-600">Step ${step.step}</span>
                <h3 itemprop="name" class="font-bold text-slate-900 dark:text-slate-100 text-sm">${step.title}</h3>
                <p itemprop="text" class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${step.description}</p>
              </div>
            `
              )
              .join('\n')}
          </div>
        </section>

        <!-- 4 Frequently Asked Questions -->
        <section itemscope itemtype="https://schema.org/FAQPage" class="space-y-4">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${seo.faqs
              .map(
                (faq) => `
              <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 itemprop="name" class="font-bold text-slate-900 dark:text-slate-100 text-sm">${faq.question}</h3>
                <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                  <p itemprop="text" class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${faq.answer}</p>
                </div>
              </div>
            `
              )
              .join('\n')}
          </div>
        </section>

        <!-- Internal Links to Related Tools -->
        <section class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Related Tools</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${relatedTools
              .map(
                (t) => `
              <a href="${t.slug}" class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500">
                <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100">${t.name}</h3>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${t.shortDesc}</p>
              </a>
            `
              )
              .join('\n')}
          </div>
        </section>
      </main>

      <footer class="mt-20 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-600 dark:text-slate-300">
        <p>&copy; ${new Date().getFullYear()} fileMakeO. Designed &amp; Developed by Parth Prajapati. 100% In-Browser &amp; Zero-Upload.</p>
      </footer>
    </div>
  `;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${seo.metaTitle}</title>`);

  // Replace Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/i,
    `<meta name="description" content="${seo.metaDescription}" />`
  );

  // Clean canonical injection
  const headInjections = `
    <link rel="canonical" href="${seo.canonicalUrl}" />
    <meta property="og:title" content="${seo.metaTitle}" />
    <meta property="og:description" content="${seo.metaDescription}" />
    <meta property="og:url" content="${seo.canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="fileMakeO" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.metaTitle}" />
    <meta name="twitter:description" content="${seo.metaDescription}" />
    <script type="application/ld+json">${JSON.stringify(webAppSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  `;

  html = html.replace('</head>', `${headInjections}\n</head>`);

  // Inject pre-rendered crawlable content inside <div id="root">
  html = html.replace('<div id="root"></div>', `<div id="root">${crawlableRootContent}</div>`);

  return html;
}

function generateStaticPages() {
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory does not exist. Run "vite build" first.');
    process.exit(1);
  }

  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html not found.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  console.log('🚀 Pre-rendering static SEO HTML pages for all tools and routes...');

  // 1. Generate pages for all 14 tools
  for (const [toolId, seo] of Object.entries(TOOLS_SEO_DATA)) {
    const routeDir = path.join(distDir, toolId);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    const toolHtml = generateToolHtml(seo, baseHtml);
    const destPath = path.join(routeDir, 'index.html');
    fs.writeFileSync(destPath, toolHtml, 'utf-8');
    console.log(`  ✓ Generated static HTML for: ${seo.slug} -> ${destPath}`);
  }

  // 2. Generate pages for About, Privacy, Contact
  const infoPages: { slug: string; dir: string; title: string; desc: string; h1: string; bodyText: string }[] = [
    {
      slug: '/about',
      dir: 'about',
      title: 'About fileMakeO - Modern In-Browser Document Studio by Parth Prajapati',
      desc: 'Learn about fileMakeO, a free, 100% in-browser PDF and image toolkit engineered by Parth Prajapati. Discover our zero-upload privacy architecture and open-source foundation.',
      h1: 'About fileMakeO - In-Browser Document Toolkit',
      bodyText: 'fileMakeO is an open, client-side document processing suite engineered by Parth Prajapati. Unlike conventional online PDF services that upload your files to remote servers, fileMakeO executes 100% of operations in your device browser RAM using WebAssembly, Mozilla PDF.js, pdf-lib, and HTML5 Canvas. Zero uploads, zero telemetry, zero paywalls.',
    },
    {
      slug: '/privacy',
      dir: 'privacy',
      title: 'Privacy Policy & Architecture - fileMakeO',
      desc: 'fileMakeO privacy policy: 100% client-side guarantee. Zero server uploads, zero database storage, zero tracking. All files remain in browser RAM.',
      h1: 'Privacy Policy & In-Browser Security Architecture',
      bodyText: 'Our privacy model is absolute: files processed on fileMakeO never leave your device. We run zero server-side file processing, have no file databases, log no user telemetry, and explicitly revoke object URLs after download. You can verify this anytime by running fileMakeO with your internet disconnected.',
    },
    {
      slug: '/contact',
      dir: 'contact',
      title: 'Contact & Support - fileMakeO | Developer Parth Prajapati',
      desc: 'Contact Parth Prajapati, creator of fileMakeO. Submit bug reports, request new client-side PDF and image features, or get in touch for developer support.',
      h1: 'Contact Developer & Report Bugs',
      bodyText: 'Reach out to developer Parth Prajapati for inquiries, feedback, and technical support regarding fileMakeO. Email support@filemakeo.local for direct inquiries.',
    },
  ];

  for (const info of infoPages) {
    const pageDir = path.join(distDir, info.dir);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    let pageHtml = cleanHeadTags(baseHtml);
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${info.title}</title>`);
    pageHtml = pageHtml.replace(
      /<meta name="description" content=".*?" \/>/i,
      `<meta name="description" content="${info.desc}" />`
    );

    const injections = `
      <link rel="canonical" href="${SITE_URL}${info.slug}" />
      <meta property="og:title" content="${info.title}" />
      <meta property="og:description" content="${info.desc}" />
      <meta property="og:url" content="${SITE_URL}${info.slug}" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="fileMakeO" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${info.title}" />
      <meta name="twitter:description" content="${info.desc}" />
    `;
    pageHtml = pageHtml.replace('</head>', `${injections}\n</head>`);

    const crawlableInfo = `
      <div class="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <h1 class="text-3xl font-extrabold text-slate-900">${info.h1}</h1>
        <p class="text-slate-700 leading-relaxed text-base">${info.bodyText}</p>
        <p class="text-sm text-slate-600">Developer: Parth Prajapati &bull; 100% In-Browser &bull; Zero Server Uploads</p>
        <div class="pt-4"><a href="/" class="text-blue-600 font-semibold">&larr; Back to all PDF and Image Tools</a></div>
      </div>
    `;
    pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${crawlableInfo}</div>`);

    const destPath = path.join(pageDir, 'index.html');
    fs.writeFileSync(destPath, pageHtml, 'utf-8');
    console.log(`  ✓ Generated static HTML for: ${info.slug} -> ${destPath}`);
  }

  // 3. Update root index.html with crawlable home directory links
  const homeDirectory = `
    <div class="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <header class="text-center space-y-4">
        <h1 class="text-4xl font-extrabold text-slate-900">fileMakeO - 100% Private Client-Side PDF & Image Tools</h1>
        <p class="text-slate-700 max-w-2xl mx-auto">Free in-browser document processing engineered by Parth Prajapati. Merge, split, compress, convert, rotate, and crop with zero file uploads.</p>
      </header>
      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${TOOLS.map((t) => `
          <a href="${t.slug}" class="p-5 rounded-2xl border border-slate-200">
            <h2 class="font-bold text-base text-slate-900">${t.name}</h2>
            <p class="text-xs text-slate-600 mt-1">${t.shortDesc}</p>
          </a>
        `).join('\n')}
      </section>
      <footer class="pt-8 text-center text-xs text-slate-600 border-t border-slate-200">
        <p>&copy; ${new Date().getFullYear()} fileMakeO by Parth Prajapati. 100% Client-Side Privacy.</p>
      </footer>
    </div>
  `;
  let rootHtml = baseHtml;
  rootHtml = rootHtml.replace('<div id="root"></div>', `<div id="root">${homeDirectory}</div>`);
  fs.writeFileSync(indexHtmlPath, rootHtml, 'utf-8');
  console.log(`  ✓ Updated root index.html with crawlable tools index.`);

  console.log('✅ Static pre-rendering completed successfully!');
}

generateStaticPages();
