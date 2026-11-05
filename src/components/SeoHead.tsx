/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ToolSeoData, SITE_URL } from '../data/toolsSeoData';

interface SeoHeadProps {
  seo: ToolSeoData;
}

export const SeoHead: React.FC<SeoHeadProps> = ({ seo }) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = seo.metaTitle;

    // Helper to set or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 2. Set Meta Description
    setMetaTag('name', 'description', seo.metaDescription);

    // 3. Set Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.canonicalUrl);

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', seo.metaTitle);
    setMetaTag('property', 'og:description', seo.metaDescription);
    setMetaTag('property', 'og:url', seo.canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'fileMakeR');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', seo.metaTitle);
    setMetaTag('name', 'twitter:description', seo.metaDescription);

    // 6. JSON-LD Structured Data: WebApplication
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${seo.name} - fileMakeR`,
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

    let scriptWebApp = document.getElementById('schema-web-app');
    if (!scriptWebApp) {
      scriptWebApp = document.createElement('script');
      scriptWebApp.id = 'schema-web-app';
      scriptWebApp.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptWebApp);
    }
    scriptWebApp.textContent = JSON.stringify(webAppSchema);

    // 7. JSON-LD Structured Data: FAQPage
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

    let scriptFaq = document.getElementById('schema-faq');
    if (!scriptFaq) {
      scriptFaq = document.createElement('script');
      scriptFaq.id = 'schema-faq';
      scriptFaq.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptFaq);
    }
    scriptFaq.textContent = JSON.stringify(faqSchema);
  }, [seo]);

  return null;
};
