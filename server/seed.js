import { getDb } from './db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function seed() {
  const db = getDb();
  
  // 1. Create admin user
  const adminHash = await bcrypt.hash('Mahima@2025', 12);
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO admin_users (username, password_hash)
    VALUES (?, ?)
  `);
  insertAdmin.run('admin', adminHash);

  // 2. Import products
  try {
    const productsModule = await import('../src/products-data.js');
    const products = productsModule.products || [];
    
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, slug, name, tagline, icon, image, desc, specs_json, benefits_json, health_json, wa_msg, trade_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertVariety = db.prepare(`
      INSERT OR IGNORE INTO varieties (
        product_id, slug, name, code, tagline, image, desc, benefits_json, health_json, wa_msg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const p of products) {
        insertProduct.run(
          p.id, p.slug, p.name, p.tagline, p.icon, p.image, p.desc,
          JSON.stringify(p.specs || {}),
          JSON.stringify(p.benefits || []),
          JSON.stringify(p.health || []),
          p.waMsg || '',
          p.tradeType || 'export'
        );
        
        if (p.varieties && Array.isArray(p.varieties)) {
          for (const v of p.varieties) {
            insertVariety.run(
              p.id, v.slug, v.name, v.code, v.tagline, v.image, v.desc,
              JSON.stringify(v.benefits || []),
              JSON.stringify(v.health || []),
              v.waMsg || ''
            );
          }
        }
      }
    })();
  } catch (error) {
    console.error('Error importing products:', error);
  }

  // 3. Scan ../public/images/
  const imagesDir = path.join(rootDir, 'public', 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir, { recursive: true });
    const insertMedia = db.prepare(`
      INSERT INTO media (filename, original_name, size, mime_type)
      VALUES (?, ?, ?, ?)
    `);
    
    const exts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (exts.includes(ext)) {
        const fullPath = path.join(imagesDir, file);
        if (fs.statSync(fullPath).isFile()) {
          const stat = fs.statSync(fullPath);
          let mimeType = 'image/jpeg';
          if (ext === '.png') mimeType = 'image/png';
          else if (ext === '.webp') mimeType = 'image/webp';
          else if (ext === '.svg') mimeType = 'image/svg+xml';
          
          const filename = file.replace(/\\/g, '/');
          
          const exists = db.prepare('SELECT 1 FROM media WHERE filename = ?').get(filename);
          if (!exists) {
            insertMedia.run(filename, path.basename(file), stat.size, mimeType);
          }
        }
      }
    }
  }

  // 4. Default settings
  const settings = [
    { key: 'company_name', value: 'Mahima Global Entrepreneurs OPC Private Limited' },
    { key: 'phone', value: '+91 93817 06785' },
    { key: 'email', value: 'mahimaagrofarm@gmail.com' },
    { key: 'whatsapp', value: '919381706785' },
    { key: 'address', value: '1st Floor, 26/680, Revenue Ward 26-1, Bhaktha Vatsala Nagar, Nellore, Andhra Pradesh 524004' }
  ];
  
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);
  for (const s of settings) {
    insertSetting.run(s.key, s.value);
  }

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
