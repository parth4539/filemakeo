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

  // 3. Update root index.html with crawlable tools index & matching hero for instant LCP (1.2s)
  const homeDirectory = `
    <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Pre-rendered Header -->
      <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2.5">
            <div class="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/20">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>
            </div>
            <span class="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">file<span class="text-blue-600 dark:text-blue-400">MakeO</span></span>
          </a>
          <nav class="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="/?category=pdf#pdf-tools" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">PDF Tools</a>
            <a href="/?category=image#image-tools" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">Image Tools</a>
            <a href="/about" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">About</a>
            <a href="/privacy" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">Privacy</a>
            <a href="/contact" class="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">Contact</a>
          </nav>
        </div>
      </header>

      <!-- Pre-rendered Hero with matching LCP element -->
      <main class="flex-1 pb-16 space-y-12">
        <section class="relative pt-8 sm:pt-14 pb-8 sm:pb-12 text-center px-4 sm:px-6 lg:px-8">
          <div class="max-w-4xl mx-auto space-y-6">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
                <span>100% In-Browser Privacy</span>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-xs">
                <span>Developer:</span>
                <strong class="text-blue-900 dark:text-blue-100">Parth Prajapati</strong>
              </div>
            </div>

            <h1 class="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">
              file<span class="text-blue-600 dark:text-blue-400">MakeO</span> — Free Tools for <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">PDFs &amp; Images</span>
            </h1>

            <p class="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Engineered by Parth Prajapati. Fast, 100% private in-browser document processing. Merge, split, compress, watermark, crop, and convert with zero file uploads and zero accounts.
            </p>

            <div class="max-w-xl mx-auto pt-4 space-y-4">
              <div class="flex items-center gap-2 px-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-500 text-sm sm:text-base shadow-md">
                <span>Search all 15 tools (e.g. merge pdf, compress under 50kb, resize)...</span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <span class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">All Tools (15)</span>
                <a href="/?category=pdf#pdf-tools" class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800">PDF Tools (11)</a>
                <a href="/?category=image#image-tools" class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800">Image Tools (4)</a>
              </div>
            </div>
          </div>
        </section>

        <!-- Tools Grid -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Available Utilities</span>
              <span class="text-xs font-medium text-slate-600 dark:text-slate-400">(15 tools)</span>
            </h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            ${TOOLS.map((tool) => `
              <a href="${tool.slug}" class="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-all">
                <div>
                  <div class="flex items-start justify-between gap-2 mb-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${tool.category === 'pdf' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'}">
                      <span class="font-bold text-xs uppercase">${tool.category}</span>
                    </div>
                    ${tool.badge ? `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">${tool.badge}</span>` : ''}
                  </div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">${tool.name}</h3>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">${tool.shortDesc}</p>
                </div>
                <div class="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Open Tool</span>
                  <span>&rarr;</span>
                </div>
              </a>
            `).join('\n')}
          </div>
        </section>
      </main>

      <!-- Pre-rendered Footer -->
      <footer class="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 mt-20 py-8 text-center text-xs text-slate-600 dark:text-slate-300">
        <p>&copy; ${new Date().getFullYear()} fileMakeO. Designed &amp; Developed by <strong class="text-slate-900 dark:text-slate-100 font-bold">Parth Prajapati</strong>. 100% Client-Side Privacy.</p>
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
