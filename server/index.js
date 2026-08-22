import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { getDb } from './db.js';
import { syncProductsAndRebuild } from './sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = 'mahima-admin-secret-2025';

// Directories
const uploadsDir = path.join(rootDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Database instance helper
const db = getDb();

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Dashboard Stats
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const varieties = db.prepare('SELECT COUNT(*) as count FROM varieties').get().count;
    const blogs = db.prepare('SELECT COUNT(*) as count FROM blogs').get().count;
    const publishedBlogs = db.prepare("SELECT COUNT(*) as count FROM blogs WHERE status = 'published'").get().count;
    const inquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
    const unreadInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries WHERE is_read = 0').get().count;
    const media = db.prepare('SELECT COUNT(*) as count FROM media').get().count;

    res.json({ products, varieties, blogs, publishedBlogs, inquiries, unreadInquiries, media });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Products
app.get('/api/products', authMiddleware, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, id ASC').all();
    const varieties = db.prepare('SELECT * FROM varieties ORDER BY sort_order ASC, id ASC').all();
    
    // Attach varieties to products
    const productsWithVarieties = products.map(p => {
      return {
        ...p,
        specs: p.specs_json ? JSON.parse(p.specs_json) : {},
        benefits: p.benefits_json ? JSON.parse(p.benefits_json) : [],
        health: p.health_json ? JSON.parse(p.health_json) : [],
        varieties: varieties.filter(v => v.product_id === p.id).map(v => ({
          ...v,
          benefits: v.benefits_json ? JSON.parse(v.benefits_json) : [],
          health: v.health_json ? JSON.parse(v.health_json) : []
        }))
      };
    });
    
    res.json(productsWithVarieties);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/products', authMiddleware, (req, res) => {
  try {
    const { slug, name, tagline, icon, image, desc, specs, benefits, health, waMsg, tradeType } = req.body;
    const result = db.prepare(`
      INSERT INTO products (slug, name, tagline, icon, image, desc, specs_json, benefits_json, health_json, wa_msg, trade_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slug, name, tagline, icon, image, desc,
      JSON.stringify(specs || {}),
      JSON.stringify(benefits || []),
      JSON.stringify(health || []),
      waMsg || '',
      tradeType || 'export'
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  try {
    const { slug, name, tagline, icon, image, desc, specs, benefits, health, waMsg, tradeType } = req.body;
    db.prepare(`
      UPDATE products SET 
        slug = ?, name = ?, tagline = ?, icon = ?, image = ?, desc = ?, 
        specs_json = ?, benefits_json = ?, health_json = ?, wa_msg = ?, trade_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      slug, name, tagline, icon, image, desc,
      JSON.stringify(specs || {}),
      JSON.stringify(benefits || []),
      JSON.stringify(health || []),
      waMsg || '',
      tradeType || 'export',
      req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Varieties
app.post('/api/products/:id/varieties', authMiddleware, (req, res) => {
  try {
    const { slug, name, code, tagline, image, desc, benefits, health, waMsg } = req.body;
    const result = db.prepare(`
      INSERT INTO varieties (product_id, slug, name, code, tagline, image, desc, benefits_json, health_json, wa_msg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id, slug, name, code, tagline, image, desc,
      JSON.stringify(benefits || []),
      JSON.stringify(health || []),
      waMsg || ''
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/varieties/:id', authMiddleware, (req, res) => {
  try {
    const { slug, name, code, tagline, image, desc, benefits, health, waMsg } = req.body;
    db.prepare(`
      UPDATE varieties SET 
        slug = ?, name = ?, code = ?, tagline = ?, image = ?, desc = ?, 
        benefits_json = ?, health_json = ?, wa_msg = ?
      WHERE id = ?
    `).run(
      slug, name, code, tagline, image, desc,
      JSON.stringify(benefits || []),
      JSON.stringify(health || []),
      waMsg || '',
      req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/varieties/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM varieties WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Blogs
app.get('/api/blogs', authMiddleware, (req, res) => {
  try {
    const blogs = db.prepare('SELECT * FROM blogs ORDER BY created_at DESC').all();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/blogs/published/list', (req, res) => {
  try {
    const blogs = db.prepare("SELECT * FROM blogs WHERE status = 'published' ORDER BY created_at DESC").all();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/blogs/:slug', (req, res) => {
  try {
    const blog = db.prepare('SELECT * FROM blogs WHERE slug = ?').get(req.params.slug);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/blogs', authMiddleware, (req, res) => {
  try {
    const { title, slug, excerpt, content, thumbnail, status, metaTitle, metaDescription, tags } = req.body;
    const result = db.prepare(`
      INSERT INTO blogs (title, slug, excerpt, content, thumbnail, status, meta_title, meta_description, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, slug, excerpt, content, thumbnail, status || 'draft', metaTitle, metaDescription, tags);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/blogs/:id', authMiddleware, (req, res) => {
  try {
    const { title, slug, excerpt, content, thumbnail, status, metaTitle, metaDescription, tags } = req.body;
    db.prepare(`
      UPDATE blogs SET 
        title = ?, slug = ?, excerpt = ?, content = ?, thumbnail = ?, 
        status = ?, meta_title = ?, meta_description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, slug, excerpt, content, thumbnail, status, metaTitle, metaDescription, tags, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/blogs/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM blogs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Media
app.get('/api/media', authMiddleware, (req, res) => {
  try {
    const media = db.prepare('SELECT * FROM media ORDER BY uploaded_at DESC').all();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/media/upload', authMiddleware, upload.array('files', 10), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = [];
    const insertMedia = db.prepare(`
      INSERT INTO media (filename, original_name, size, mime_type)
      VALUES (?, ?, ?, ?)
    `);
    
    db.transaction(() => {
      for (const file of files) {
        const result = insertMedia.run(file.filename, file.originalname, file.size, file.mimetype);
        uploadedFiles.push({
          id: result.lastInsertRowid,
          filename: file.filename,
          original_name: file.originalname,
          size: file.size,
          mime_type: file.mimetype
        });
      }
    })();
    
    res.status(201).json(uploadedFiles);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/media/:id', authMiddleware, (req, res) => {
  try {
    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const filePath = path.join(uploadsDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Inquiries
app.get('/api/inquiries', authMiddleware, (req, res) => {
  try {
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/inquiries', (req, res) => {
  try {
    const { name, email, phone, company, country, message, type } = req.body;
    const result = db.prepare(`
      INSERT INTO inquiries (name, email, phone, company, country, message, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, company, country, message, type);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/inquiries/:id/read', authMiddleware, (req, res) => {
  try {
    const { is_read } = req.body;
    const updatedStatus = is_read !== undefined ? (is_read ? 1 : 0) : null;
    if (updatedStatus !== null) {
      db.prepare('UPDATE inquiries SET is_read = ? WHERE id = ?').run(updatedStatus, req.params.id);
    } else {
      // toggle
      db.prepare('UPDATE inquiries SET is_read = CASE WHEN is_read = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/inquiries/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Settings
app.get('/api/settings', authMiddleware, (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings', authMiddleware, (req, res) => {
  try {
    const settings = req.body;
    const upsertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsertSetting.run(key, String(value));
      }
    })();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Rebuild
app.post('/api/rebuild', authMiddleware, (req, res) => {
  const result = syncProductsAndRebuild();
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
