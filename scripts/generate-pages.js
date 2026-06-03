import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/products-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const templateDir = path.resolve(rootDir, 'templates');

// Load templates
const overviewTemplate = fs.readFileSync(path.resolve(templateDir, 'overview.html'), 'utf8');
const detailsTemplate = fs.readFileSync(path.resolve(templateDir, 'details.html'), 'utf8');

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

  // Generate overview page
  const imageStyle = `background-image: linear-gradient(135deg, rgba(8, 8, 8, 0.72), rgba(8, 8, 8, 0.96)), url('${product.image}');`;
  let overviewHtml = overviewTemplate
    .replaceAll('{{name}}', product.name)
    .replaceAll('{{tagline}}', product.tagline)
    .replaceAll('{{desc}}', product.desc)
    .replaceAll('{{icon}}', product.icon)
    .replaceAll('{{slug}}', product.slug)
    .replaceAll('{{imageStyle}}', imageStyle)
    .replaceAll('{{varietiesGrid}}', varietiesGrid);

  fs.writeFileSync(path.resolve(rootDir, `${product.slug}-overview.html`), overviewHtml, 'utf8');

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
        .replaceAll('{{backUrl}}', `${product.slug}-overview.html`);

      const filename = `${product.slug}-${variety.slug}.html`;
      fs.writeFileSync(path.resolve(rootDir, filename), detailsHtml, 'utf8');
      console.log(`  -> Generated variety details page: ${filename}`);
    });
  }

  // 3. Clean up old obsolete details page
  const oldDetailsFile = path.resolve(rootDir, `${product.slug}-details.html`);
  if (fs.existsSync(oldDetailsFile)) {
    fs.unlinkSync(oldDetailsFile);
    console.log(`  -> Cleaned up obsolete file: ${product.slug}-details.html`);
  }
});

console.log("Static product pages and variety detail pages generated successfully!");
