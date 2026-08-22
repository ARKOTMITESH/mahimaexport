/* ═══════════════════════════════════════════════════════════════ */
/*  MAHIMA GLOBAL ENTREPRENEURS — ADMIN PORTAL SPA                */
/* ═══════════════════════════════════════════════════════════════ */

const tokenKey = 'adminToken';
let quillInstance = null;

/* ── UTILITIES ────────────────────────────────────────────────── */
const getToken = () => localStorage.getItem(tokenKey);
const setToken = (t) => localStorage.setItem(tokenKey, t);
const clearToken = () => localStorage.removeItem(tokenKey);

const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
  .replace(/^-+/, '').replace(/-+$/, '');

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatFileSize = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
};
const esc = (s) => { if (!s) return ''; const d = document.createElement('div'); d.innerText = s; return d.innerHTML; };

/* ── TOAST NOTIFICATIONS ──────────────────────────────────────── */
function showToast(message, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}

/* ── API HELPER ───────────────────────────────────────────────── */
async function api(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body === 'object') options.body = JSON.stringify(options.body);
  }
  const res = await fetch(endpoint, { ...options, headers });
  if (res.status === 401) { clearToken(); window.location.hash = '#login'; throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

/* ── MODAL SYSTEM ─────────────────────────────────────────────── */
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

/* ── ROUTER ───────────────────────────────────────────────────── */
function router() {
  const hash = window.location.hash || '#dashboard';
  const token = getToken();
  if (!token && hash !== '#login') { window.location.hash = '#login'; return; }

  const loginEl = document.getElementById('login-screen');
  const layoutEl = document.getElementById('admin-layout');
  loginEl.style.display = hash === '#login' ? 'flex' : 'none';
  layoutEl.style.display = hash !== '#login' ? 'flex' : 'none';
  if (hash === '#login') return renderLogin();

  document.querySelectorAll('#sidebar-nav .nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === hash));
  const titles = { '#dashboard': 'Dashboard', '#products': 'Products', '#blogs': 'Blogs', '#media': 'Media Gallery', '#inquiries': 'Inquiries', '#settings': 'Settings' };
  document.getElementById('page-title').textContent = titles[hash] || 'Dashboard';

  const c = document.getElementById('app-content');
  c.innerHTML = '<div class="spinner"></div>';
  const routeMap = { '#dashboard': renderDashboard, '#products': renderProducts, '#blogs': renderBlogs, '#media': renderMedia, '#inquiries': renderInquiries, '#settings': renderSettings };
  (routeMap[hash] || renderDashboard)(c);
}

/* ── SIDEBAR NAV INIT ─────────────────────────────────────────── */
function initNav() {
  document.getElementById('sidebar-nav').innerHTML = `
    <a href="#dashboard" class="nav-link active">📊 Dashboard</a>
    <a href="#products" class="nav-link">📦 Products</a>
    <a href="#blogs" class="nav-link">📝 Blogs</a>
    <a href="#media" class="nav-link">🖼️ Media</a>
    <a href="#inquiries" class="nav-link">✉️ Inquiries</a>
    <a href="#settings" class="nav-link">⚙️ Settings</a>
  `;
  document.getElementById('logout-btn').addEventListener('click', () => { clearToken(); window.location.hash = '#login'; });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal(); });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LOGIN                                                         */
/* ═══════════════════════════════════════════════════════════════ */
function renderLogin() {
  const el = document.getElementById('login-screen');
  el.innerHTML = `
    <div class="login-card">
      <div class="login-logo">
        <img src="/images/logo-emblem.png" alt="Logo" style="width:60px;height:60px;margin-bottom:12px;">
        <h2>Admin Portal</h2>
        <p style="color:rgba(255,255,255,.4);font-size:.85rem;margin-top:4px;">Mahima Global Entrepreneurs</p>
      </div>
      <form id="login-form">
        <div class="form-group"><input type="text" id="login-user" class="form-control" placeholder="Username" required></div>
        <div class="form-group"><input type="password" id="login-pass" class="form-control" placeholder="Password" required></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Sign In</button>
      </form>
      <p id="login-error" style="color:#ef4444;text-align:center;margin-top:12px;font-size:.85rem;display:none;"></p>
    </div>`;
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: { username: document.getElementById('login-user').value, password: document.getElementById('login-pass').value } });
      if (res.token) { setToken(res.token); showToast('Welcome back!', 'success'); window.location.hash = '#dashboard'; }
    } catch (err) { errEl.textContent = 'Invalid credentials'; errEl.style.display = 'block'; }
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  DASHBOARD                                                     */
/* ═══════════════════════════════════════════════════════════════ */
async function renderDashboard(c) {
  try {
    const s = await api('/api/dashboard/stats');
    c.innerHTML = `<div class="dashboard-grid">
      <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">${s.products||0}</div><div class="stat-label">Product Categories</div></div>
      <div class="stat-card"><div class="stat-icon">🌱</div><div class="stat-value">${s.varieties||0}</div><div class="stat-label">Product Varieties</div></div>
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${s.publishedBlogs||0}</div><div class="stat-label">Published Blogs</div></div>
      <div class="stat-card"><div class="stat-icon">🖼️</div><div class="stat-value">${s.media||0}</div><div class="stat-label">Media Files</div></div>
      <div class="stat-card"><div class="stat-icon">✉️</div><div class="stat-value">${s.inquiries||0}</div><div class="stat-label">Total Inquiries</div></div>
      <div class="stat-card highlight"><div class="stat-icon">🔔</div><div class="stat-value">${s.unreadInquiries||0}</div><div class="stat-label">Unread Inquiries</div></div>
    </div>`;
  } catch { c.innerHTML = '<div class="empty-state">⚠️ Failed to load dashboard</div>'; }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PRODUCTS                                                      */
/* ═══════════════════════════════════════════════════════════════ */
async function renderProducts(c) {
  c.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" id="add-prod-btn">+ Add Product</button>
      <button class="btn btn-gold" id="publish-btn">🚀 Publish & Rebuild</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Icon</th><th>Name</th><th>Type</th><th>Varieties</th><th style="width:140px">Actions</th></tr></thead><tbody id="prod-tbody"></tbody></table></div>`;

  let products = [];
  try { products = await api('/api/products'); } catch { return; }

  const tbody = document.getElementById('prod-tbody');
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(p.icon)}</td><td><strong>${esc(p.name)}</strong><br><small style="color:rgba(255,255,255,.4)">${esc(p.tagline)}</small></td>
      <td><span class="badge badge-${p.trade_type==='import'?'info':'success'}">${p.trade_type}</span></td><td>${p.varieties?.length||0}</td>
      <td><button class="btn-sm btn-edit" data-id="${p.id}">Edit</button> <button class="btn-sm btn-danger" data-id="${p.id}">Del</button> <button class="btn-sm btn-secondary" data-id="${p.id}" data-action="varieties">Vars</button></td>`;
    tbody.appendChild(tr);
  });

  // Add Product
  document.getElementById('add-prod-btn').addEventListener('click', () => openProductModal());

  // Edit/Delete/Varieties
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const prod = products.find(p => p.id === id);
    if (btn.classList.contains('btn-edit')) openProductModal(prod);
    else if (btn.classList.contains('btn-danger')) { if (confirm(`Delete "${prod?.name}"?`)) deleteProduct(id); }
    else if (btn.dataset.action === 'varieties') openVarietiesPanel(prod);
  });

  // Publish
  document.getElementById('publish-btn').addEventListener('click', async () => {
    try {
      document.getElementById('publish-btn').textContent = '⏳ Rebuilding...';
      await api('/api/rebuild', { method: 'POST' });
      showToast('Site rebuilt successfully!', 'success');
      document.getElementById('publish-btn').textContent = '🚀 Publish & Rebuild';
    } catch { document.getElementById('publish-btn').textContent = '🚀 Publish & Rebuild'; showToast('Rebuild failed', 'error'); }
  });
}

function openProductModal(p = null) {
  const isEdit = !!p;
  const specsHtml = p?.specs ? Object.entries(p.specs).map(([k,v],i) => `<div class="kv-row" data-i="${i}"><input class="form-control spec-key" value="${esc(k)}" placeholder="Key"><input class="form-control spec-val" value="${esc(v)}" placeholder="Value"><button class="btn-sm btn-danger rm-spec">&times;</button></div>`).join('') : '';
  const bensHtml = (p?.benefits||[]).map(b => `<div class="list-row"><input class="form-control ben-input" value="${esc(b)}"><button class="btn-sm btn-danger rm-ben">&times;</button></div>`).join('');

  openModal(isEdit ? 'Edit Product' : 'Add Product', `
    <form id="prod-form" class="modal-form">
      <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input class="form-control" name="name" value="${esc(p?.name||'')}" required></div>
      <div class="form-group"><label class="form-label">Slug</label><input class="form-control" name="slug" value="${esc(p?.slug||'')}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-control" name="icon" value="${esc(p?.icon||'')}" style="width:80px"></div>
      <div class="form-group"><label class="form-label">Trade Type</label><select class="form-control" name="tradeType"><option value="export" ${p?.trade_type!=='import'?'selected':''}>Export</option><option value="import" ${p?.trade_type==='import'?'selected':''}>Import</option></select></div></div>
      <div class="form-group"><label class="form-label">Tagline</label><input class="form-control" name="tagline" value="${esc(p?.tagline||'')}"></div>
      <div class="form-group"><label class="form-label">Image URL</label><input class="form-control" name="image" value="${esc(p?.image||'')}"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" name="desc" rows="3">${esc(p?.desc||'')}</textarea></div>
      <div class="form-group"><label class="form-label">WhatsApp Message</label><input class="form-control" name="waMsg" value="${esc(p?.wa_msg||'')}"></div>
      <div class="form-group"><label class="form-label">Specifications</label><div id="specs-container">${specsHtml}</div><button type="button" class="btn-sm btn-secondary" id="add-spec">+ Add Spec</button></div>
      <div class="form-group"><label class="form-label">Benefits</label><div id="bens-container">${bensHtml}</div><button type="button" class="btn-sm btn-secondary" id="add-ben">+ Add Benefit</button></div>
      <button type="submit" class="btn btn-primary" style="margin-top:16px">${isEdit?'Update':'Create'} Product</button>
    </form>`);

  document.getElementById('add-spec').addEventListener('click', () => {
    document.getElementById('specs-container').insertAdjacentHTML('beforeend', '<div class="kv-row"><input class="form-control spec-key" placeholder="Key"><input class="form-control spec-val" placeholder="Value"><button class="btn-sm btn-danger rm-spec">&times;</button></div>');
  });
  document.getElementById('add-ben').addEventListener('click', () => {
    document.getElementById('bens-container').insertAdjacentHTML('beforeend', '<div class="list-row"><input class="form-control ben-input" placeholder="Benefit"><button class="btn-sm btn-danger rm-ben">&times;</button></div>');
  });
  document.getElementById('modal-body').addEventListener('click', e => {
    if (e.target.classList.contains('rm-spec')) e.target.closest('.kv-row').remove();
    if (e.target.classList.contains('rm-ben')) e.target.closest('.list-row').remove();
  });

  // Auto-slug
  const nameInput = document.querySelector('#prod-form [name="name"]');
  const slugInput = document.querySelector('#prod-form [name="slug"]');
  if (!isEdit) nameInput.addEventListener('input', () => { slugInput.value = slugify(nameInput.value); });

  document.getElementById('prod-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const specs = {};
    document.querySelectorAll('.spec-key').forEach((k, i) => { const v = document.querySelectorAll('.spec-val')[i]; if (k.value) specs[k.value] = v.value; });
    const benefits = [...document.querySelectorAll('.ben-input')].map(i => i.value).filter(Boolean);
    const body = { slug: fd.get('slug'), name: fd.get('name'), tagline: fd.get('tagline'), icon: fd.get('icon'), image: fd.get('image'), desc: fd.get('desc'), waMsg: fd.get('waMsg'), tradeType: fd.get('tradeType'), specs, benefits, health: [] };
    try {
      if (isEdit) await api(`/api/products/${p.id}`, { method: 'PUT', body });
      else await api('/api/products', { method: 'POST', body });
      showToast(isEdit ? 'Product updated' : 'Product created', 'success');
      closeModal(); renderProducts(document.getElementById('app-content'));
    } catch { showToast('Failed to save product', 'error'); }
  });
}

async function deleteProduct(id) {
  try { await api(`/api/products/${id}`, { method: 'DELETE' }); showToast('Product deleted', 'success'); renderProducts(document.getElementById('app-content')); }
  catch { showToast('Failed to delete', 'error'); }
}

function openVarietiesPanel(product) {
  const vars = product.varieties || [];
  let html = `<h3 style="margin-bottom:16px;color:var(--gold-primary)">${esc(product.name)} — Varieties</h3>
    <button class="btn btn-primary btn-sm" id="add-var-btn" style="margin-bottom:16px">+ Add Variety</button>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Code</th><th>Actions</th></tr></thead><tbody>`;
  vars.forEach(v => { html += `<tr><td>${esc(v.name)}</td><td>${esc(v.code)}</td><td><button class="btn-sm btn-edit" data-vid="${v.id}">Edit</button> <button class="btn-sm btn-danger" data-vid="${v.id}">Del</button></td></tr>`; });
  html += '</tbody></table></div>';
  openModal('Manage Varieties', html);

  document.getElementById('add-var-btn').addEventListener('click', () => openVarietyForm(product.id));
  document.getElementById('modal-body').addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.vid) return;
    const vid = parseInt(btn.dataset.vid);
    if (btn.classList.contains('btn-edit')) { const v = vars.find(x => x.id === vid); openVarietyForm(product.id, v); }
    else if (btn.classList.contains('btn-danger')) { if (confirm('Delete this variety?')) { try { await api(`/api/varieties/${vid}`, { method: 'DELETE' }); showToast('Deleted', 'success'); renderProducts(document.getElementById('app-content')); closeModal(); } catch {} } }
  });
}

function openVarietyForm(productId, v = null) {
  const isEdit = !!v;
  openModal(isEdit ? 'Edit Variety' : 'Add Variety', `
    <form id="var-form" class="modal-form">
      <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input class="form-control" name="name" value="${esc(v?.name||'')}" required></div>
      <div class="form-group"><label class="form-label">Code</label><input class="form-control" name="code" value="${esc(v?.code||'')}"></div></div>
      <div class="form-group"><label class="form-label">Slug</label><input class="form-control" name="slug" value="${esc(v?.slug||'')}"></div>
      <div class="form-group"><label class="form-label">Tagline</label><input class="form-control" name="tagline" value="${esc(v?.tagline||'')}"></div>
      <div class="form-group"><label class="form-label">Image URL</label><input class="form-control" name="image" value="${esc(v?.image||'')}"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" name="desc" rows="3">${esc(v?.desc||'')}</textarea></div>
      <div class="form-group"><label class="form-label">WhatsApp Message</label><input class="form-control" name="waMsg" value="${esc(v?.wa_msg||'')}"></div>
      <button type="submit" class="btn btn-primary" style="margin-top:16px">${isEdit?'Update':'Create'} Variety</button>
    </form>`);

  const nameI = document.querySelector('#var-form [name="name"]');
  const slugI = document.querySelector('#var-form [name="slug"]');
  if (!isEdit) nameI.addEventListener('input', () => { slugI.value = slugify(nameI.value); });

  document.getElementById('var-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { slug: fd.get('slug'), name: fd.get('name'), code: fd.get('code'), tagline: fd.get('tagline'), image: fd.get('image'), desc: fd.get('desc'), waMsg: fd.get('waMsg'), benefits: [], health: [] };
    try {
      if (isEdit) await api(`/api/varieties/${v.id}`, { method: 'PUT', body });
      else await api(`/api/products/${productId}/varieties`, { method: 'POST', body });
      showToast(isEdit ? 'Variety updated' : 'Variety created', 'success');
      closeModal(); renderProducts(document.getElementById('app-content'));
    } catch { showToast('Failed to save variety', 'error'); }
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  BLOGS                                                         */
/* ═══════════════════════════════════════════════════════════════ */
async function renderBlogs(c) {
  c.innerHTML = `
    <div class="toolbar"><button class="btn btn-primary" id="add-blog-btn">+ New Post</button></div>
    <div class="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Created</th><th>Updated</th><th style="width:140px">Actions</th></tr></thead><tbody id="blog-tbody"></tbody></table></div>`;

  let blogs = [];
  try { blogs = await api('/api/blogs'); } catch { return; }

  const tbody = document.getElementById('blog-tbody');
  if (!blogs.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No blog posts yet. Click "+ New Post" to create one.</td></tr>'; }
  else blogs.forEach(b => {
    tbody.insertAdjacentHTML('beforeend', `<tr>
      <td><strong>${esc(b.title)}</strong></td>
      <td><span class="badge badge-${b.status==='published'?'success':'warning'}">${b.status}</span></td>
      <td>${formatDate(b.created_at)}</td><td>${formatDate(b.updated_at)}</td>
      <td><button class="btn-sm btn-edit" data-id="${b.id}">Edit</button> <button class="btn-sm btn-danger" data-id="${b.id}">Del</button></td></tr>`);
  });

  document.getElementById('add-blog-btn').addEventListener('click', () => openBlogEditor());
  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const blog = blogs.find(b => b.id === id);
    if (btn.classList.contains('btn-edit')) openBlogEditor(blog);
    else if (btn.classList.contains('btn-danger')) { if (confirm('Delete this post?')) { try { await api(`/api/blogs/${id}`, { method: 'DELETE' }); showToast('Deleted', 'success'); renderBlogs(c); } catch {} } }
  });
}

function openBlogEditor(b = null) {
  const isEdit = !!b;
  const c = document.getElementById('app-content');
  c.innerHTML = `
    <div class="toolbar"><button class="btn btn-secondary" id="back-blogs-btn">← Back to Blogs</button></div>
    <form id="blog-form" class="blog-editor-form">
      <div class="form-row"><div class="form-group" style="flex:2"><label class="form-label">Title</label><input class="form-control" name="title" id="blog-title" value="${esc(b?.title||'')}" required></div>
      <div class="form-group"><label class="form-label">Slug</label><input class="form-control" name="slug" id="blog-slug" value="${esc(b?.slug||'')}"></div></div>
      <div class="form-group"><label class="form-label">Excerpt</label><textarea class="form-control" name="excerpt" rows="2">${esc(b?.excerpt||'')}</textarea></div>
      <div class="form-group"><label class="form-label">Content</label><div id="quill-editor" style="height:300px;"></div></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Thumbnail URL</label><input class="form-control" name="thumbnail" value="${esc(b?.thumbnail||'')}"></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-control" name="status"><option value="draft" ${b?.status!=='published'?'selected':''}>Draft</option><option value="published" ${b?.status==='published'?'selected':''}>Published</option></select></div>
      </div>
      <div class="form-row"><div class="form-group"><label class="form-label">Meta Title (SEO)</label><input class="form-control" name="metaTitle" value="${esc(b?.meta_title||'')}"></div>
      <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-control" name="tags" value="${esc(b?.tags||'')}"></div></div>
      <div class="form-group"><label class="form-label">Meta Description (SEO)</label><textarea class="form-control" name="metaDescription" rows="2">${esc(b?.meta_description||'')}</textarea></div>
      <button type="submit" class="btn btn-primary" style="margin-top:16px">${isEdit?'Update':'Create'} Post</button>
    </form>`;

  document.getElementById('back-blogs-btn').addEventListener('click', () => renderBlogs(c));

  // Auto-slug
  const titleIn = document.getElementById('blog-title');
  const slugIn = document.getElementById('blog-slug');
  if (!isEdit) titleIn.addEventListener('input', () => { slugIn.value = slugify(titleIn.value); });

  // Init Quill
  if (typeof Quill !== 'undefined') {
    quillInstance = new Quill('#quill-editor', {
      theme: 'snow',
      modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline','strike'],['link','image','blockquote','code-block'],[{list:'ordered'},{list:'bullet'}],['clean']] }
    });
    if (b?.content) quillInstance.root.innerHTML = b.content;
  }

  document.getElementById('blog-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { title: fd.get('title'), slug: fd.get('slug'), excerpt: fd.get('excerpt'), content: quillInstance ? quillInstance.root.innerHTML : '', thumbnail: fd.get('thumbnail'), status: fd.get('status'), metaTitle: fd.get('metaTitle'), metaDescription: fd.get('metaDescription'), tags: fd.get('tags') };
    try {
      if (isEdit) await api(`/api/blogs/${b.id}`, { method: 'PUT', body });
      else await api('/api/blogs', { method: 'POST', body });
      showToast(isEdit ? 'Post updated' : 'Post created', 'success');
      renderBlogs(c);
    } catch { showToast('Failed to save post', 'error'); }
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MEDIA GALLERY                                                 */
/* ═══════════════════════════════════════════════════════════════ */
async function renderMedia(c) {
  c.innerHTML = `
    <div class="upload-zone" id="upload-zone">
      <p style="font-size:2rem;margin-bottom:8px;">📁</p>
      <p>Drag & Drop images here</p>
      <p style="color:rgba(255,255,255,.3);font-size:.8rem;margin-top:4px;">or click to browse (max 5MB per file)</p>
      <input type="file" id="file-input" hidden multiple accept="image/*">
      <button class="btn btn-secondary" style="margin-top:12px" id="browse-btn">Browse Files</button>
    </div>
    <div class="media-grid" id="media-grid"></div>`;

  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  document.getElementById('browse-btn').addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); uploadFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', () => { uploadFiles(fileInput.files); fileInput.value = ''; });

  async function uploadFiles(files) {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    try {
      showToast('Uploading...', 'info');
      await api('/api/media/upload', { method: 'POST', body: fd, headers: {} });
      showToast('Upload complete!', 'success');
      loadMedia();
    } catch { showToast('Upload failed', 'error'); }
  }

  async function loadMedia() {
    try {
      const media = await api('/api/media');
      const grid = document.getElementById('media-grid');
      if (!media.length) { grid.innerHTML = '<div class="empty-state">No media files yet. Upload some images above!</div>'; return; }
      grid.innerHTML = media.map(m => {
        const src = m.filename.includes('-') ? `/uploads/${m.filename}` : `/images/${m.filename}`;
        return `<div class="media-card">
          <div class="media-img" style="background-image:url('${src}')"></div>
          <div class="media-info"><p class="media-name">${esc(m.original_name)}</p><p class="media-size">${formatFileSize(m.size)}</p></div>
          <div class="media-actions">
            <button class="btn-sm btn-secondary copy-url" data-url="${src}" title="Copy URL">📋</button>
            <button class="btn-sm btn-danger del-media" data-id="${m.id}" title="Delete">🗑️</button>
          </div>
        </div>`;
      }).join('');

      grid.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('copy-url')) { navigator.clipboard.writeText(window.location.origin + btn.dataset.url); showToast('URL copied!', 'success'); }
        else if (btn.classList.contains('del-media')) { if (confirm('Delete this image?')) { try { await api(`/api/media/${btn.dataset.id}`, { method: 'DELETE' }); showToast('Deleted', 'success'); loadMedia(); } catch {} } }
      });
    } catch {}
  }
  loadMedia();
}

/* ═══════════════════════════════════════════════════════════════ */
/*  INQUIRIES                                                     */
/* ═══════════════════════════════════════════════════════════════ */
async function renderInquiries(c) {
  c.innerHTML = `
    <div class="toolbar">
      <div class="filter-tabs">
        <button class="filter-btn active" data-type="all">All</button>
        <button class="filter-btn" data-type="buyer">Buyer</button>
        <button class="filter-btn" data-type="supplier">Supplier</button>
        <button class="filter-btn" data-type="quote">Quote</button>
      </div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Type</th><th>Status</th><th>Date</th><th style="width:140px">Actions</th></tr></thead><tbody id="inq-tbody"></tbody></table></div>`;

  let inquiries = [];
  try { inquiries = await api('/api/inquiries'); } catch { return; }
  let activeFilter = 'all';

  function renderTable() {
    const filtered = activeFilter === 'all' ? inquiries : inquiries.filter(i => i.type === activeFilter);
    const tbody = document.getElementById('inq-tbody');
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No inquiries found.</td></tr>'; return; }
    tbody.innerHTML = filtered.map(i => `<tr class="${i.is_read?'':'unread-row'}">
      <td><strong>${esc(i.name)}</strong></td><td>${esc(i.email)}</td><td>${esc(i.company)}</td>
      <td><span class="badge badge-${i.type==='buyer'?'success':i.type==='supplier'?'info':'warning'}">${i.type}</span></td>
      <td><span class="badge badge-${i.is_read?'muted':'gold'}">${i.is_read?'Read':'Unread'}</span></td>
      <td>${formatDate(i.created_at)}</td>
      <td><button class="btn-sm btn-secondary view-inq" data-id="${i.id}">View</button> <button class="btn-sm btn-edit toggle-read" data-id="${i.id}">${i.is_read?'📭':'📬'}</button> <button class="btn-sm btn-danger del-inq" data-id="${i.id}">Del</button></td>
    </tr>`).join('');
  }
  renderTable();

  c.querySelector('.filter-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    c.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type;
    renderTable();
  });

  c.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    const inq = inquiries.find(i => i.id === id);
    if (!inq) return;

    if (btn.classList.contains('view-inq')) {
      openModal('Inquiry Details', `
        <div style="line-height:2"><p><strong>Name:</strong> ${esc(inq.name)}</p><p><strong>Email:</strong> ${esc(inq.email)}</p><p><strong>Phone:</strong> ${esc(inq.phone)}</p>
        <p><strong>Company:</strong> ${esc(inq.company)}</p><p><strong>Country:</strong> ${esc(inq.country)}</p><p><strong>Type:</strong> ${inq.type}</p>
        <p><strong>Message:</strong></p><div style="background:rgba(255,255,255,.05);padding:16px;border-radius:8px;margin-top:8px;color:rgba(255,255,255,.7)">${esc(inq.message)}</div></div>`);
      if (!inq.is_read) { try { await api(`/api/inquiries/${id}/read`, { method: 'PUT', body: { is_read: true } }); inq.is_read = 1; renderTable(); } catch {} }
    } else if (btn.classList.contains('toggle-read')) {
      try { await api(`/api/inquiries/${id}/read`, { method: 'PUT' }); inq.is_read = inq.is_read ? 0 : 1; renderTable(); } catch {}
    } else if (btn.classList.contains('del-inq')) {
      if (confirm('Delete this inquiry?')) { try { await api(`/api/inquiries/${id}`, { method: 'DELETE' }); inquiries = inquiries.filter(i => i.id !== id); renderTable(); showToast('Deleted', 'success'); } catch {} }
    }
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  SETTINGS                                                      */
/* ═══════════════════════════════════════════════════════════════ */
async function renderSettings(c) {
  let settings = {};
  try { settings = await api('/api/settings'); } catch { return; }

  c.innerHTML = `
    <form id="settings-form" style="max-width:650px">
      <div class="form-group"><label class="form-label">Company Name</label><input class="form-control" name="company_name" value="${esc(settings.company_name||'')}"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-control" name="phone" value="${esc(settings.phone||'')}"></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-control" name="email" value="${esc(settings.email||'')}"></div></div>
      <div class="form-group"><label class="form-label">WhatsApp Number</label><input class="form-control" name="whatsapp" value="${esc(settings.whatsapp||'')}"></div>
      <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" name="address" rows="3">${esc(settings.address||'')}</textarea></div>
      <button type="submit" class="btn btn-primary" style="margin-top:16px">Save Settings</button>
    </form>`;

  document.getElementById('settings-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    try { await api('/api/settings', { method: 'PUT', body }); showToast('Settings saved!', 'success'); } catch { showToast('Failed to save', 'error'); }
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/*  BOOTSTRAP                                                     */
/* ═══════════════════════════════════════════════════════════════ */
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => { initNav(); router(); });
