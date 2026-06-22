import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/products-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const templateDir = path.resolve(rootDir, 'templates');
const BASE_URL = 'https://mahimaglobalentrepreneurs.com';

// Load templates
const overviewTemplate = fs.readFileSync(path.resolve(templateDir, 'overview.html'), 'utf8');
const detailsTemplate = fs.readFileSync(path.resolve(templateDir, 'details.html'), 'utf8');

// Collect all generated page URLs for sitemap
const sitemapUrls = [];

// Static pages for sitemap
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/about.html', priority: '0.8', changefreq: 'monthly' },
  { url: '/products.html', priority: '0.9', changefreq: 'weekly' },
  { url: '/network.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/why-us.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/partners.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact.html', priority: '0.8', changefreq: 'monthly' },
];
staticPages.forEach(p => sitemapUrls.push(p));

// Helper: truncate description to ~155 chars for meta
function metaDesc(text, maxLen = 155) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 3).replace(/\s+\S*$/, '') + '...';
}

// Helper: generate keywords from product name, tagline, and desc
function genKeywords(product, variety) {
  const base = [
    product.name.toLowerCase(),
    'export',
    'India',
    'mahima global',
    'bulk supplier',
    'wholesale',
  ];
  if (variety) {
    base.push(variety.name.toLowerCase());
    base.push(variety.code);
    // Extract key words from tagline
    if (variety.tagline) {
      variety.tagline.split(/[\s,]+/).filter(w => w.length > 3).forEach(w => base.push(w.toLowerCase()));
    }
  } else {
    if (product.tagline) {
      product.tagline.split(/[\s,]+/).filter(w => w.length > 3).forEach(w => base.push(w.toLowerCase()));
    }
  }
  // Deduplicate
  return [...new Set(base)].join(', ');
}

// Helper: generate JSON-LD schema for overview pages (BreadcrumbList + ItemList)
function overviewSchema(product) {
  const schemas = [];

  // BreadcrumbList
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${BASE_URL}/products.html` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/${product.slug}-overview.html` },
    ],
  });

  // ItemList of varieties
  if (product.varieties && product.varieties.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${product.name} — Available Varieties`,
      numberOfItems: product.varieties.length,
      itemListElement: product.varieties.map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: v.name,
        url: `${BASE_URL}/${product.slug}-${v.slug}.html`,
      })),
    });
  }

  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n    </script>`).join('\n    ');
}

// Helper: generate JSON-LD schema for detail pages (BreadcrumbList + Product)
function detailSchema(product, variety) {
  const schemas = [];
  const filename = `${product.slug}-${variety.slug}.html`;

  // BreadcrumbList
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${BASE_URL}/products.html` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/${product.slug}-overview.html` },
      { '@type': 'ListItem', position: 4, name: variety.name, item: `${BASE_URL}/${filename}` },
    ],
  });

  // Product schema (AEO/GEO optimized)
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: variety.name,
    description: variety.desc,
    sku: variety.code,
    brand: {
      '@type': 'Brand',
      name: 'Mahima Global Entrepreneurs',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Mahima Global Entrepreneurs OPC Private Limited',
      url: BASE_URL,
    },
    category: product.name,
    url: `${BASE_URL}/${filename}`,
    image: `${BASE_URL}${variety.image || product.image}`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
        valueAddedTaxIncluded: false,
      },
      seller: {
        '@type': 'Organization',
        name: 'Mahima Global Entrepreneurs',
      },
      eligibleRegion: [
        { '@type': 'Country', name: 'United States' },
        { '@type': 'Country', name: 'United Arab Emirates' },
        { '@type': 'Country', name: 'Singapore' },
        { '@type': 'Country', name: 'United Kingdom' },
        { '@type': 'Country', name: 'Germany' },
        { '@type': 'Country', name: 'Australia' },
        { '@type': 'Country', name: 'Saudi Arabia' },
        { '@type': 'Country', name: 'Japan' },
      ],
    },
    countryOfOrigin: {
      '@type': 'Country',
      name: 'India',
    },
  };

  // Add additional properties if available
  if (variety.benefits && variety.benefits.length > 0) {
    productSchema.additionalProperty = variety.benefits.map(b => ({
      '@type': 'PropertyValue',
      name: 'Key Feature',
      value: b,
    }));
  }

  schemas.push(productSchema);

  return schemas.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n    </script>`).join('\n    ');
}

// Generate pages
products.forEach(product => {
  console.log(`Generating pages for category: ${product.name}`);

  // 1. Generate Varieties Grid HTML for the Overview page
  let varietiesGrid = '';
  
  if (product.varieties && product.varieties.length > 0) {
    product.varieties.forEach(variety => {
      const varietyUrl = `${product.slug}-${variety.slug}.html`;
      const encodedWaMsg = encodeURIComponent(variety.waMsg);
      const waLink = `https://wa.me/911234567890?text=${encodedWaMsg}`;
      const imgPath = variety.image || product.image;

      varietiesGrid += `
        <div class="variety-card">
          <div class="vc-img-container">
            <span class="vc-code-badge">${variety.code}</span>
            <img src="${imgPath}" alt="${variety.name}" class="vc-img" />
            <div class="vc-overlay"></div>
          </div>
          <div class="vc-body">
            <h3 class="vc-title">${variety.name}</h3>
            <p class="vc-desc">${variety.tagline}</p>
            <div class="vc-footer">
              <a href="/${varietyUrl}" class="vc-btn vc-btn-more">View More</a>
              <a href="${waLink}" target="_blank" rel="noopener" class="vc-btn vc-btn-quote">
                <span>Get Quote</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:block;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    varietiesGrid = `<p style="grid-column: 1/-1; text-align: center; color: var(--white-40); padding: 40px 0;">No varieties currently listed for this category.</p>`;
  }

  // SEO metadata for overview page
  const overviewMetaDesc = metaDesc(`Explore our ${product.name} export varieties. ${product.desc}`);
  const overviewKeywords = genKeywords(product);
  const overviewSchemaMarkup = overviewSchema(product);

  // Generate overview page
  const imageStyle = `background-image: linear-gradient(135deg, rgba(8, 8, 8, 0.72), rgba(8, 8, 8, 0.96)), url('${product.image}');`;
  let overviewHtml = overviewTemplate
    .replaceAll('{{name}}', product.name)
    .replaceAll('{{tagline}}', product.tagline)
    .replaceAll('{{desc}}', product.desc)
    .replaceAll('{{icon}}', product.icon)
    .replaceAll('{{slug}}', product.slug)
    .replaceAll('{{imageStyle}}', imageStyle)
    .replaceAll('{{varietiesGrid}}', varietiesGrid)
    .replaceAll('{{metaDescription}}', overviewMetaDesc)
    .replaceAll('{{metaKeywords}}', overviewKeywords)
    .replaceAll('{{schemaMarkup}}', overviewSchemaMarkup);

  fs.writeFileSync(path.resolve(rootDir, `${product.slug}-overview.html`), overviewHtml, 'utf8');

  // Add to sitemap
  sitemapUrls.push({ url: `/${product.slug}-overview.html`, priority: '0.8', changefreq: 'weekly' });

  // 2. Generate detailed pages for each variety
  if (product.varieties && product.varieties.length > 0) {
    product.varieties.forEach(variety => {
      // Create benefits list HTML
      let benefitsList = '';
      variety.benefits.forEach(b => {
        benefitsList += `                  <li><span class="bullet">◈</span> <span>${b}</span></li>\n`;
      });

      // Create health list HTML
      let healthList = '';
      variety.health.forEach(h => {
        healthList += `                  <li><span class="bullet">◈</span> <span>${h}</span></li>\n`;
      });

      const varImage = variety.image || product.image;
      const varImageStyle = `background-image: linear-gradient(135deg, rgba(8, 8, 8, 0.72), rgba(8, 8, 8, 0.96)), url('${varImage}');`;

      // SEO metadata for detail page
      const detailMetaDesc = metaDesc(`${variety.name} (${variety.code}) — ${variety.tagline}. ${variety.desc}`);
      const detailKeywords = genKeywords(product, variety);
      const detailSchemaMarkup = detailSchema(product, variety);
      const canonicalSlug = `${product.slug}-${variety.slug}.html`;

      let detailsHtml = detailsTemplate
        .replaceAll('{{name}}', variety.name)
        .replaceAll('{{code}}', variety.code)
        .replaceAll('{{tagline}}', variety.tagline)
        .replaceAll('{{desc}}', variety.desc)
        .replaceAll('{{icon}}', product.icon)
        .replaceAll('{{slug}}', product.slug)
        .replaceAll('{{benefitsList}}', benefitsList)
        .replaceAll('{{healthList}}', healthList)
        .replaceAll('{{imageStyle}}', varImageStyle)
        .replaceAll('{{waMsg}}', encodeURIComponent(variety.waMsg))
        .replaceAll('{{backUrl}}', `${product.slug}-overview.html`)
        .replaceAll('{{metaDescription}}', detailMetaDesc)
        .replaceAll('{{metaKeywords}}', detailKeywords)
        .replaceAll('{{schemaMarkup}}', detailSchemaMarkup)
        .replaceAll('{{canonicalSlug}}', canonicalSlug);

      const filename = `${product.slug}-${variety.slug}.html`;
      fs.writeFileSync(path.resolve(rootDir, filename), detailsHtml, 'utf8');
      console.log(`  -> Generated variety details page: ${filename}`);

      // Add to sitemap
      sitemapUrls.push({ url: `/${filename}`, priority: '0.6', changefreq: 'monthly' });
    });
  }

  // 3. Clean up old obsolete details page
  const oldDetailsFile = path.resolve(rootDir, `${product.slug}-details.html`);
  if (fs.existsSync(oldDetailsFile)) {
    fs.unlinkSync(oldDetailsFile);
    console.log(`  -> Cleaned up obsolete file: ${product.slug}-details.html`);
  }
});

// ─── GENERATE SITEMAP.XML ───────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

sitemapUrls.forEach(page => {
  const loc = page.url === '/' ? BASE_URL + '/' : BASE_URL + page.url;
  sitemapXml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
});

sitemapXml += `</urlset>
`;

fs.writeFileSync(path.resolve(rootDir, 'public', 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`\nSitemap generated: public/sitemap.xml (${sitemapUrls.length} URLs)`);
console.log("Static product pages, variety detail pages, and sitemap generated successfully!");
