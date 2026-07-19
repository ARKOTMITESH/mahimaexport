/* ================================================================
   MAHIMA GLOBAL EXPORTS — Main JavaScript
   Three.js Globe · GSAP · Lenis · Cursor · All Interactions
   ================================================================ */

import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════ */
/*  LOADER                                                       */
/* ════════════════════════════════════════════════════════════ */
function initLoader() {
  const loader       = document.getElementById('loader');
  const canvas       = document.getElementById('loader-canvas');
  const emblemSvg    = document.querySelector('.emblem-svg');
  const loaderBrand  = document.querySelector('.loader-brand');
  const sweepLine    = document.querySelector('.loader-sweep-line');
  const loaderSub    = document.querySelector('.loader-sub');
  const loaderTag    = document.querySelector('.loader-tagline-anim');
  const barWrap      = document.querySelector('.loader-bar-wrap');
  const progressEl   = document.getElementById('loader-progress');
  const percentEl    = document.getElementById('loader-percent');

  // Particle canvas
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const particles = Array.from({ length: 160 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.8 + 0.3,
    vx: (Math.random() - .5) * .5,
    vy: (Math.random() - .5) * .5,
    a: Math.random() * .5 + .05,
    pulse: Math.random() * Math.PI * 2,
  }));

  let rafId;
  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() * .001;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      const alpha = p.a * (.5 + .5 * Math.sin(t * .8 + p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${alpha})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // Animate progress value
  let pct = 0;
  const pctInterval = setInterval(() => {
    pct = Math.min(pct + Math.random() * 4 + 1, 100);
    if (progressEl) progressEl.style.width = pct + '%';
    if (percentEl)  percentEl.textContent  = Math.round(pct) + '%';
    if (pct >= 100) clearInterval(pctInterval);
  }, 28);

  const tl = gsap.timeline({
    onComplete: () => {
      cancelAnimationFrame(rafId);
      clearInterval(pctInterval);
      gsap.to(loader, {
        opacity: 0, duration: .9, ease: 'power2.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          startHeroReveal();
        }
      });
    }
  });

  tl
    .to('.emblem-svg',        { opacity: 1, duration: .6, ease: 'power2.out' }, .3)
    .to('.loader-brand',      { opacity: 1, duration: .7, ease: 'power2.out' }, .55)
    .to('.loader-sweep-line', { width: '100%', duration: .8, ease: 'power2.out' }, .7)
    .to('.loader-sub',        { opacity: 1, duration: .5, ease: 'power2.out' }, .85)
    .to('.loader-tagline-anim',{ opacity: 1, duration: .6, ease: 'power2.out' }, 1.0)
    .to('.loader-bar-wrap',   { opacity: 1, duration: .4, ease: 'power2.out' }, 1.2)
    .to({}, { duration: 1.4 });                    // hold at 100%
}

/* ════════════════════════════════════════════════════════════ */
/*  HERO REVEAL (post-loader)                                   */
/* ════════════════════════════════════════════════════════════ */
function startHeroReveal() {
  const tl = gsap.timeline();
  tl
    .to('.h1-line',       { opacity: 1, y: 0, duration: .9, stagger: .14, ease: 'power3.out' }, 0)
    .to('.hero-overline', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, .3)
    .to('.hero-tagline',  { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, .5)
    .to('.hero-buttons',  { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, .7)
    .to('.hero-profile-row', { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, .85);
}

/* ════════════════════════════════════════════════════════════ */
/*  THREE.JS GLOBE                                              */
/* ════════════════════════════════════════════════════════════ */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  // Responsive size
  function getSize() {
    const vw = window.innerWidth;
    if (vw < 540)  return Math.min(vw * .9, 360);
    if (vw < 768)  return Math.min(vw * .8, 480);
    if (vw < 1024) return Math.min(vw * .7, 560);
    return Math.min(vw * .65, 680);
  }

  let S = getSize();
  canvas.width  = S;
  canvas.height = S;
  canvas.style.width  = S + 'px';
  canvas.style.height = S + 'px';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(S, S);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.z = 2.85;

  // Generate dynamic continent texture with glowing gold outlines (completely offline/procedural)
  function createGlobeTexture() {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 2048;
    texCanvas.height = 1024;
    const ctx = texCanvas.getContext('2d');

    // Fill Ocean
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

    // Draw techy longitude/latitude lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.03)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * texCanvas.width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, texCanvas.height); ctx.stroke();
    }
    for (let lat = -90; lat <= 90; lat += 15) {
      const y = ((90 - lat) / 180) * texCanvas.height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(texCanvas.width, y); ctx.stroke();
    }

    // Draw Continents (dark grey filled landmasses with gold borders)
    ctx.fillStyle = '#0f0f15';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4.5;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
    ctx.shadowBlur = 6;

    landPolygons.forEach(polygon => {
      ctx.beginPath();
      polygon.forEach((pt, idx) => {
        const lat = pt[0];
        const lon = pt[1];
        const x = ((lon + 180) / 360) * texCanvas.width;
        const y = ((90 - lat) / 180) * texCanvas.height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /* ── GLOBE CORE ── */
  const globeTexture = createGlobeTexture();
  const sphereGeo = new THREE.SphereGeometry(1, 72, 72);
  const sphereMat = new THREE.MeshPhongMaterial({
    map: globeTexture,
    emissiveMap: globeTexture,
    emissive: 0x221a05,
    emissiveIntensity: 1.6,
    shininess: 45,
    transparent: true,
    opacity: 0.96,
  });
  const globe = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(globe);

  // Background Load high-resolution earth map from CDN with procedural fallback
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';
  textureLoader.load(
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_specular_2048.jpg',
    (tex) => {
      // Create high-fidelity map texture using canvas compositing
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = 2048;
      mapCanvas.height = 1024;
      const mCtx = mapCanvas.getContext('2d');

      // 1. Draw ocean & grid lines
      mCtx.fillStyle = '#06060a';
      mCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

      mCtx.strokeStyle = 'rgba(212, 175, 55, 0.03)';
      mCtx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 15) {
        const x = ((lon + 180) / 360) * mapCanvas.width;
        mCtx.beginPath(); mCtx.moveTo(x, 0); mCtx.lineTo(x, mapCanvas.height); mCtx.stroke();
      }
      for (let lat = -90; lat <= 90; lat += 15) {
        const y = ((90 - lat) / 180) * mapCanvas.height;
        mCtx.beginPath(); mCtx.moveTo(0, y); mCtx.lineTo(mapCanvas.width, y); mCtx.stroke();
      }

      // 2. Prepare colored land using offscreen canvas multiply blending
      const landCanvas = document.createElement('canvas');
      landCanvas.width = mapCanvas.width;
      landCanvas.height = mapCanvas.height;
      const lCtx = landCanvas.getContext('2d');

      lCtx.drawImage(tex.image, 0, 0, landCanvas.width, landCanvas.height);
      lCtx.globalCompositeOperation = 'multiply';
      lCtx.fillStyle = '#101016'; // dark grey land masses
      lCtx.fillRect(0, 0, landCanvas.width, landCanvas.height);

      // 3. Composite land over ocean background using lighten
      mCtx.globalCompositeOperation = 'lighten';
      mCtx.drawImage(landCanvas, 0, 0);

      // 4. Update Three.js material maps & properties
      const highResTexture = new THREE.CanvasTexture(mapCanvas);
      highResTexture.colorSpace = THREE.SRGBColorSpace;

      sphereMat.map = highResTexture;
      sphereMat.bumpMap = tex;
      sphereMat.bumpScale = 0.022;
      sphereMat.specularMap = tex;
      sphereMat.specular = new THREE.Color(0xD4AF37); // Gold specular highlights on land
      sphereMat.shininess = 65;
      sphereMat.emissiveMap = tex;
      sphereMat.emissive = new THREE.Color(0x35280b); // Gold land glow
      sphereMat.emissiveIntensity = 1.4;
      sphereMat.color = new THREE.Color(0xffffff);
      sphereMat.needsUpdate = true;
    },
    undefined,
    (err) => {
      console.warn("CDN earth texture failed to load, procedural fallback is active.", err);
    }
  );

  /* ── LAND DOTS (Empty group to prevent errors since dots are now replaced by solid gold continents) ── */
  const landDotGroup = new THREE.Group();
  scene.add(landDotGroup);

  /* ── WIREFRAME GRID ── */
  const wireGeo = new THREE.SphereGeometry(1.003, 24, 24);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: .04 });
  scene.add(new THREE.Mesh(wireGeo, wireMat));

  /* ── ATMOSPHERE ── */
  const atmoGeo = new THREE.SphereGeometry(1.14, 32, 32);
  const atmoMat = new THREE.MeshPhongMaterial({ color: 0xD4AF37, side: THREE.BackSide, transparent: true, opacity: .055 });
  scene.add(new THREE.Mesh(atmoGeo, atmoMat));

  /* ── INNER GLOW ── */
  const glowGeo = new THREE.SphereGeometry(1.02, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: .025, side: THREE.BackSide });
  scene.add(new THREE.Mesh(glowGeo, glowMat));

  /* ── OUTER RINGS ── */
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.24, .003, 2, 128),
    new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: .28 })
  );
  ring1.rotation.x = Math.PI * .5;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, .002, 2, 100),
    new THREE.MeshBasicMaterial({ color: 0xA8880D, transparent: true, opacity: .12 })
  );
  ring2.rotation.x = Math.PI * .32; ring2.rotation.z = Math.PI * .15;
  scene.add(ring2);

  /* ── CITY MARKERS ── */
  const cities = [
    { lat: 28.6,  lon: 77.2,   name: 'India (HQ)',  main: true  },
    { lat: 40.7,  lon: -74.0,  name: 'New York'  },
    { lat: 51.5,  lon: -0.1,   name: 'London'    },
    { lat: 25.2,  lon: 55.3,   name: 'Dubai'     },
    { lat: 1.35,  lon: 103.8,  name: 'Singapore' },
    { lat: -33.9, lon: 151.2,  name: 'Sydney'    },
    { lat: -1.3,  lon: 36.8,   name: 'Nairobi'   },
    { lat: 48.9,  lon: 2.35,   name: 'Paris'     },
    { lat: 35.7,  lon: 139.7,  name: 'Tokyo'     },
    { lat: 24.7,  lon: 46.7,   name: 'Riyadh'    },
    { lat: 53.3,  lon: -6.3,   name: 'Dublin'    },
    { lat: 43.7,  lon: -79.4,  name: 'Toronto'   },
    { lat: -26.2, lon: 28.0,   name: 'Johannesburg' },
    { lat: 37.6,  lon: 126.9,  name: 'Seoul'     },
  ];

  const dotGeo  = new THREE.SphereGeometry(.018, 8, 8);
  const dotMat  = new THREE.MeshBasicMaterial({ color: 0xD4AF37 });
  const bigGeo  = new THREE.SphereGeometry(.028, 8, 8);
  const bigMat  = new THREE.MeshBasicMaterial({ color: 0xE8CC6A });
  const ringGeo = new THREE.RingGeometry(.028, .044, 20);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: .5, side: THREE.DoubleSide });

  const cityGroup = new THREE.Group();
  const pulseRings = [];

  cities.forEach(city => {
    const pos = latLon(city.lat, city.lon, 1.012);
    const mesh = new THREE.Mesh(city.main ? bigGeo : dotGeo, city.main ? bigMat.clone() : dotMat.clone());
    mesh.position.copy(pos);
    cityGroup.add(mesh);

    const r = new THREE.Mesh(ringGeo, ringMat.clone());
    r.position.copy(pos);
    r.lookAt(pos.clone().multiplyScalar(2));
    r.userData.baseScale = city.main ? 1.5 : 1;
    cityGroup.add(r);
    pulseRings.push(r);
  });
  scene.add(cityGroup);

  /* ── TRADE ROUTE ARCS ── */
  const indiaCity = cities[0];
  const routes = cities.slice(1).map(c => [indiaCity, c]);
  routes.push([cities[1], cities[2]]); // NY → London
  routes.push([cities[2], cities[3]]); // London → Dubai
  routes.push([cities[4], cities[8]]); // Singapore → Tokyo
  routes.push([cities[9], cities[3]]); // Riyadh → Dubai

  const arcGroup  = new THREE.Group();
  const pulsePool = [];

  routes.forEach(([from, to], idx) => {
    const p1 = latLon(from.lat, from.lon, 1.015);
    const p2 = latLon(to.lat,   to.lon,   1.015);
    const mid = p1.clone().add(p2).multiplyScalar(.5).normalize()
                .multiplyScalar(1.015 + .22 + p1.distanceTo(p2) * .3);

    const curve  = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const pts    = curve.getPoints(64);
    const geo    = new THREE.BufferGeometry().setFromPoints(pts);
    const mat    = new THREE.LineBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: .16 });
    arcGroup.add(new THREE.Line(geo, mat));

    // Animated pulse dots (3 per route for continuous flowing stream)
    for (let p = 0; p < 3; p++) {
      const pGeo = new THREE.SphereGeometry(.015, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xE8CC6A, transparent: true, opacity: .95 });
      const pDot = new THREE.Mesh(pGeo, pMat);
      pDot.userData = { 
        curve, 
        t: (p / 3 + idx * 0.12) % 1, 
        spd: .0025 + Math.random() * .0012 
      };
      arcGroup.add(pDot);
      pulsePool.push(pDot);
    }
  });
  scene.add(arcGroup);

  /* ── STAR FIELD PARTICLES ── */
  const starGeo  = new THREE.BufferGeometry();
  const starPos  = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    const r = 1.55 + Math.random() * .9;
    starPos[i*3]   = r * Math.sin(p) * Math.cos(t);
    starPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
    starPos[i*3+2] = r * Math.cos(p);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xD4AF37, size: .011, transparent: true, opacity: .45 })));

  /* ── LIGHTS ── */
  scene.add(new THREE.AmbientLight(0x111122, .8));
  const keyLight = new THREE.PointLight(0xD4AF37, 2.5, 8);
  keyLight.position.set(2.5, 1.5, 2);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0x1a1a40, 1.2, 6);
  fillLight.position.set(-2, -1, -1.5);
  scene.add(fillLight);

  /* ── MOUSE PARALLAX ── */
  let tgtX = 0, tgtY = 0, curX = 0, curY = 0;
  window.addEventListener('mousemove', e => {
    tgtX =  ((e.clientX / window.innerWidth)  - .5) * .35;
    tgtY = -((e.clientY / window.innerHeight) - .5) * .18;
  });

  /* ── SCROLL PARALLAX ── */
  let scrollY = 0;
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => { scrollY = self.progress; }
  });

  /* ── RESIZE ── */
  window.addEventListener('resize', () => {
    S = getSize();
    canvas.width  = S; canvas.height = S;
    canvas.style.width = S + 'px'; canvas.style.height = S + 'px';
    renderer.setSize(S, S);
  });

  /* ── RENDER LOOP ── */
  let autoRot = 0;
  function tick() {
    requestAnimationFrame(tick);
    autoRot += .0035;
    curX += (tgtX - curX) * .045;
    curY += (tgtY - curY) * .045;

    const rotY = autoRot + curX;
    const rotX = curY - scrollY * .15;

    globe.rotation.y      = rotY; globe.rotation.x      = rotX;
    cityGroup.rotation.y  = rotY; cityGroup.rotation.x  = rotX;
    arcGroup.rotation.y   = rotY; arcGroup.rotation.x   = rotX;
    landDotGroup.rotation.y = rotY; landDotGroup.rotation.x = rotX;
    ring1.rotation.y = autoRot * .4;

    // Pulse rings animate
    const t = Date.now() * .0018;
    pulseRings.forEach((r, i) => {
      const s = r.userData.baseScale * (1 + .35 * Math.sin(t + i * .7));
      r.material.opacity = .35 + .25 * Math.sin(t + i * .7);
      r.scale.setScalar(s);
    });

    // Move pulse dots along arcs
    pulsePool.forEach(dot => {
      dot.userData.t = (dot.userData.t + dot.userData.spd) % 1;
      dot.position.copy(dot.userData.curve.getPoint(dot.userData.t));
    });

    renderer.render(scene, camera);
  }
  tick();
}

/* lat/lon → Vec3 */
function latLon(lat, lon, r = 1) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/* Generate scattered land cells (simplified continent simulation) */
/* Point-in-polygon helper */
function inPolygon(lat, lon, polygon) {
  let inside = false;
  const x = lon, y = lat;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const landPolygons = [
  // North America
  [
    [70, -165], [70, -140], [80, -120], [83, -60], [75, -40], [60, -40], [60, -60],
    [45, -60], [30, -80], [20, -100], [7, -80], [15, -105], [33, -120], [60, -145], [65, -168]
  ],
  // South America
  [
    [12, -72], [8, -55], [-5, -35], [-30, -50], [-56, -67], [-45, -75], [-20, -70], [-5, -80], [8, -80]
  ],
  // Africa
  [
    [37, 10], [30, 32], [12, 43], [10, 51], [-34, 20], [-15, 12], [5, 9], [15, -17], [32, -17]
  ],
  // Eurasia
  [
    [75, 10], [70, 40], [75, 80], [75, 180], [60, 180], [40, 140], [22, 115], [10, 105],
    [6, 95], [20, 90], [8, 78], [24, 68], [25, 60], [12, 45], [25, 35], [30, 32],
    [36, 26], [38, 15], [36, -5], [48, -5], [60, 5], [70, 18]
  ],
  // Australia
  [
    [-10, 113], [-10, 143], [-20, 154], [-38, 154], [-38, 140], [-35, 115], [-22, 113]
  ],
  // Greenland
  [
    [83, -60], [75, -15], [60, -40], [60, -60], [83, -60]
  ],
  // Madagascar
  [
    [-12, 49], [-25, 47], [-25, 43], [-12, 43]
  ],
  // Japan
  [
    [30, 130], [45, 140], [45, 146], [30, 130]
  ]
];

function isLand(lat, lon) {
  for (let i = 0; i < landPolygons.length; i++) {
    if (inPolygon(lat, lon, landPolygons[i])) return true;
  }
  return false;
}

function generateLandCells() {
  const cells = [];
  const latStep = 5.2; // Sparser latitude spacing
  for (let lat = -60; lat <= 78; lat += latStep) {
    const cosLat = Math.cos(lat * Math.PI / 180);
    const numPoints = Math.round(52 * cosLat); // Sparser longitude spacing
    if (numPoints <= 0) continue;
    const lonStep = 360 / numPoints;
    for (let i = 0; i < numPoints; i++) {
      const lon = -180 + i * lonStep;
      if (isLand(lat, lon)) {
        cells.push([lat, lon]);
      }
    }
  }
  return cells;
}

/* ════════════════════════════════════════════════════════════ */
/*  CANVAS WORLD MAP (Network Section)                          */
/* ════════════════════════════════════════════════════════════ */
function initWorldMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  const hubs = [
    { name: 'India (Origin)', x: .64, y: .45, main: true  },
    { name: 'New York',       x: .20, y: .34 },
    { name: 'London',         x: .45, y: .23 },
    { name: 'Dubai',          x: .60, y: .39 },
    { name: 'Singapore',      x: .76, y: .54 },
    { name: 'Sydney',         x: .83, y: .73 },
    { name: 'Nairobi',        x: .57, y: .59 },
    { name: 'Paris',          x: .47, y: .25 },
    { name: 'Tokyo',          x: .87, y: .30 },
    { name: 'Riyadh',         x: .60, y: .44 },
    { name: 'Toronto',        x: .21, y: .29 },
    { name: 'Johannesburg',   x: .55, y: .71 },
    { name: 'Seoul',          x: .85, y: .32 },
  ];

  // Routes always from India to others
  const routes = hubs.slice(1).map((_, i) => [0, i + 1]);
  routes.push([2, 3]); // London → Dubai
  routes.push([4, 8]); // Singapore → Tokyo

  const routeParticles = routes.map(([fi, ti]) => ({
    fi, ti, t: Math.random(), spd: .003 + Math.random() * .003,
  }));

  function lerp(a, b, t) { return a + (b - a) * t; }
  function quad(p0, cp, p1, t) {
    return (1-t)*(1-t)*p0 + 2*(1-t)*t*cp + t*t*p1;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(212,175,55,.035)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 14; i++) { ctx.beginPath(); ctx.moveTo((i/14)*W,0); ctx.lineTo((i/14)*W,H); ctx.stroke(); }
    for (let i = 1; i < 8;  i++) { ctx.beginPath(); ctx.moveTo(0,(i/8)*H); ctx.lineTo(W,(i/8)*H); ctx.stroke(); }

    // Routes
    routes.forEach(([fi, ti]) => {
      const f = hubs[fi], t2 = hubs[ti];
      const fx=f.x*W, fy=f.y*H, tx=t2.x*W, ty=t2.y*H;
      const cpx=(fx+tx)/2, cpy=Math.min(fy,ty) - Math.abs(tx-fx)*.18;
      ctx.beginPath(); ctx.moveTo(fx,fy);
      ctx.quadraticCurveTo(cpx,cpy,tx,ty);
      ctx.strokeStyle='rgba(212,175,55,.1)'; ctx.lineWidth=1; ctx.stroke();
    });

    // Particles
    routeParticles.forEach(p => {
      p.t = (p.t + p.spd) % 1;
      const f=hubs[p.fi], t2=hubs[p.ti];
      const fx=f.x*W, fy=f.y*H, tx=t2.x*W, ty=t2.y*H;
      const cpx=(fx+tx)/2, cpy=Math.min(fy,ty) - Math.abs(tx-fx)*.18;
      const x=quad(fx,cpx,tx,p.t), y=quad(fy,cpy,ty,p.t);
      const g=ctx.createRadialGradient(x,y,0,x,y,5);
      g.addColorStop(0,'rgba(232,204,106,.95)');
      g.addColorStop(1,'rgba(212,175,55,0)');
      ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    });

    // Hub dots
    hubs.forEach((hub, i) => {
      const x=hub.x*W, y=hub.y*H;
      const pulse=.5+.5*Math.sin(Date.now()*.002+i*.7);
      // Outer ring
      ctx.beginPath(); ctx.arc(x,y,10+pulse*7,0,Math.PI*2);
      ctx.strokeStyle=`rgba(212,175,55,${.06+pulse*.1})`; ctx.lineWidth=1; ctx.stroke();
      // Core
      const r=hub.main?7:4;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,hub.main?'#F5E6A3':'#E8CC6A');
      g.addColorStop(1,'#D4AF37');
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
      // Label
      ctx.font = hub.main ? 'bold 11px Inter' : '10px Inter';
      ctx.fillStyle = hub.main ? '#D4AF37' : 'rgba(248,248,248,.5)';
      ctx.fillText(hub.name, x+10, y-5);
    });

    requestAnimationFrame(render);
  }
  render();
}

/* ════════════════════════════════════════════════════════════ */
/*  HERO CANVAS PARTICLES                                        */
/* ════════════════════════════════════════════════════════════ */
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = cv.width = window.innerWidth;
  let H = cv.height = window.innerHeight;

  const pts = Array.from({length:80}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*.9+.2,
    vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
    a: Math.random()*.25+.05,
    phase: Math.random()*Math.PI*2,
  }));

  function draw() {
    ctx.clearRect(0,0,W,H);
    const t = Date.now()*.001;
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      const a = p.a*(.4+.6*Math.sin(t+p.phase));
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(212,175,55,${a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize',()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;});
}

/* ════════════════════════════════════════════════════════════ */
/*  CURSOR                                                       */
/* ════════════════════════════════════════════════════════════ */
function initCursor() {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-follower');
  if (!dot || !ring) return;

  let mx=0, my=0, fx=0, fy=0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { x: mx, y: my, duration: .08, ease: 'none' });
  });

  (function follow() {
    fx += (mx - fx) * .11;
    fy += (my - fy) * .11;
    gsap.set(ring, { x: fx, y: fy });
    requestAnimationFrame(follow);
  })();

  const interactives = 'a,button,.prod-card,.cert-card,.testi-card,.why-card,.btn,.inv-opp,.pillar,.region-chip,input,textarea,select,.avf-play,.form-tab,.nav-link';
  document.querySelectorAll(interactives).forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  LENIS SMOOTH SCROLL                                          */
/* ════════════════════════════════════════════════════════════ */
function initLenis() {
  const lenis = new Lenis({
    duration: 1.5,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 1.8,
    infinite: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* ════════════════════════════════════════════════════════════ */
/*  NAVBAR                                                       */
/* ════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const ham    = document.getElementById('hamburger');
  const menu   = document.getElementById('mobile-menu');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  if (ham && menu) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      menu.classList.toggle('open');
    });

    document.querySelectorAll('.mob-link').forEach(l => {
      l.addEventListener('click', () => { ham.classList.remove('open'); menu.classList.remove('open'); });
    });
  }
}

/* ════════════════════════════════════════════════════════════ */
/*  SCROLL REVEAL                                                */
/* ════════════════════════════════════════════════════════════ */
function initReveal() {
  const selectors = [
    '.reveal', '.reveal-left', '.reveal-right',
    '.sec-header', '.about-grid > *', '.prod-card',
    '.why-card', '.cert-card', '.testi-card', '.nstat',
    '.region-chip', '.ps-step', '.bb-item', '.inv-type',
    '.pillar', '.cs-item', '.ft-col', '.ft-brand',
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
        el.classList.add('reveal');
      }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            opacity: 1, x: 0, y: 0,
            duration: .75,
            delay: Math.min(i * .04, .3),
            ease: 'power3.out',
            onStart: () => el.classList.add('visible'),
          });
        },
      });
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  COUNTER ANIMATION                                            */
/* ════════════════════════════════════════════════════════════ */
function initCounters() {
  document.querySelectorAll('.nstat-num[data-count], .hstat-num[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to({ v: 0 }, {
          v: target, duration: 2.2, ease: 'power2.out',
          onUpdate() {
            const v = Math.round(this.targets()[0].v);
            el.textContent = target >= 1000 ? (v >= 1000 ? Math.round(v/1000)+'K' : v) : v;
          },
          onComplete() {
            el.textContent = (target >= 1000 ? Math.round(target/1000)+'K' : target) + suffix;
          }
        });
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  PROCESS TIMELINE                                             */
/* ════════════════════════════════════════════════════════════ */
function initProcessTimeline() {
  const bar   = document.getElementById('process-bar');
  const steps = document.querySelectorAll('.ps-step');

  ScrollTrigger.create({
    trigger: '.process-section',
    start: 'top 65%',
    end: 'bottom 35%',
    scrub: 1,
    onUpdate: self => {
      if (bar) bar.style.width = (self.progress * 100) + '%';
      steps.forEach((step, i) => {
        step.classList.toggle('active', self.progress > i / steps.length);
      });
    }
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  TESTIMONIALS CAROUSEL                                        */
/* ════════════════════════════════════════════════════════════ */
function initTestiCarousel() {
  const track    = document.getElementById('testi-track');
  const prevBtn  = document.getElementById('tc-prev');
  const nextBtn  = document.getElementById('tc-next');
  const dotsEl   = document.getElementById('tc-dots');
  if (!track) return;

  const cards = track.querySelectorAll('.testi-card');
  let current = 0;

  function pv() {
    if (window.innerWidth < 768)  return 1;
    if (window.innerWidth < 1200) return 2;
    return 4;
  }

  function buildDots() {
    const tot = Math.ceil(cards.length / pv());
    dotsEl.innerHTML = '';
    for (let i = 0; i < tot; i++) {
      const d = document.createElement('div');
      d.className = 'tc-dot' + (i === current ? ' active' : '');
      d.onclick = () => goTo(i);
      dotsEl.appendChild(d);
    }
  }

  function goTo(idx) {
    const tot = Math.ceil(cards.length / pv());
    current = ((idx % tot) + tot) % tot;
    if (pv() < 4) {
      const cw = cards[0].getBoundingClientRect().width + 20;
      track.style.transform = `translateX(-${current * cw}px)`;
    } else {
      track.style.transform = 'translateX(0)';
    }
    buildDots();
    dotsEl.querySelectorAll('.tc-dot').forEach((d,i) => d.classList.toggle('active', i===current));
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  window.addEventListener('resize', () => goTo(0));
  buildDots();
  setInterval(() => { if (pv() < 4) goTo(current + 1); }, 5500);
}

/* ════════════════════════════════════════════════════════════ */
/*  CERT CARD 3D TILT                                            */
/* ════════════════════════════════════════════════════════════ */
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      gsap.to(card, { rotateY: x*14, rotateX: -y*14, duration: .35, ease: 'power2.out', transformPerspective: 700 });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: .5, ease: 'power2.out' });
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  MAGNETIC BUTTONS                                             */
/* ════════════════════════════════════════════════════════════ */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top  - r.height/2;
      gsap.to(el, { x: x*.22, y: y*.22, duration: .35, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.5)' });
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  HERO PARALLAX                                                */
/* ════════════════════════════════════════════════════════════ */
function initHeroParallax() {
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      gsap.set('.hero-content', { y: self.progress * 90 });
    }
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  CONTACT FORM TABS                                            */
/* ════════════════════════════════════════════════════════════ */
function initFormTabs() {
  const tabs   = document.querySelectorAll('.form-tab');
  const panels = document.querySelectorAll('.form-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + target);
      if (panel) {
        panel.classList.add('active');
        gsap.fromTo(panel, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  FORM SUBMIT                                                  */
/* ════════════════════════════════════════════════════════════ */
function initForms() {
  ['buyer-form', 'supplier-form', 'quote-form'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    const submitId = id === 'buyer-form' ? 'buyer-submit' : id === 'supplier-form' ? 'supplier-submit' : 'quote-submit';
    const btn = document.getElementById(submitId);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!btn) return;
      const span = btn.querySelector('span');
      const orig = span.textContent;
      span.textContent = 'Sending...';
      btn.disabled = true;
      gsap.to(btn, { scale: .98, duration: .1, yoyo: true, repeat: 1 });

      setTimeout(() => {
        span.textContent = '✓ Submitted Successfully!';
        gsap.to(btn, { scale: 1.02, duration: .2, yoyo: true, repeat: 1 });
        setTimeout(() => {
          span.textContent = orig;
          btn.disabled = false;
          form.reset();
        }, 3000);
      }, 1600);
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  PRODUCT CARD PARTICLE CANVASES                               */
/* ════════════════════════════════════════════════════════════ */
function initProductParticles() {
  for (let i = 0; i <= 11; i++) {
    const el = document.getElementById('pc-bg-' + i);
    if (!el) continue;
    const cv = document.createElement('canvas');
    cv.width  = 500; cv.height = 400;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.5;';
    el.appendChild(cv);
    const ctx = cv.getContext('2d');
    const pts = Array.from({length:20}, () => ({
      x:Math.random()*500, y:Math.random()*400,
      r:Math.random()*1.4+.3,
      vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
      a:Math.random()*.35+.08,
    }));
    (function animate() {
      ctx.clearRect(0,0,500,400);
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=500; if(p.x>500)p.x=0;
        if(p.y<0)p.y=400; if(p.y>400)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(212,175,55,${p.a})`; ctx.fill();
      });
      requestAnimationFrame(animate);
    })();
  }
}

/* ════════════════════════════════════════════════════════════ */
/*  FAQ ACCORDION CONTROLLER                                     */
/* ════════════════════════════════════════════════════════════ */
function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Collapse all other active FAQ items
      items.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherContent = otherItem.querySelector('.faq-content');
          gsap.to(otherContent, { maxHeight: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
        }
      });

      // Toggle current FAQ item
      if (isActive) {
        item.classList.remove('active');
        gsap.to(content, { maxHeight: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
      } else {
        item.classList.add('active');
        const targetHeight = content.scrollHeight;
        gsap.fromTo(content,
          { maxHeight: 0, opacity: 0 },
          { maxHeight: targetHeight, opacity: 1, duration: 0.45, ease: 'power2.out' }
        );
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  SECTION COLOR TRANSITIONS                                    */
/* ════════════════════════════════════════════════════════════ */
function initColorTransitions() {
  // Gold pulse on buyers section entry
  ScrollTrigger.create({
    trigger: '.buyers-section',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.buyers-section', { '--gold-opacity': 0 }, { duration: 1.2, ease: 'power2.out' });
    }
  });

  // Why section stagger
  ScrollTrigger.create({
    trigger: '.why-section',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.to('.why-card', {
        opacity: 1, y: 0, duration: .7,
        stagger: .06, ease: 'power3.out',
        onStart: () => document.querySelectorAll('.why-card').forEach(c => c.classList.add('visible')),
      });
    }
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  SMOOTH ANCHOR LINKS                                          */
/* ════════════════════════════════════════════════════════════ */
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  INVESTOR OPPORTUNITIES HOVER ROTATION                        */
/* ════════════════════════════════════════════════════════════ */
function initInvestorCards() {
  const opps = document.querySelectorAll('.inv-opp');
  opps.forEach(opp => {
    opp.addEventListener('mouseenter', () => {
      opps.forEach(o => o.classList.remove('active'));
      opp.classList.add('active');
    });
  });
}

/* ════════════════════════════════════════════════════════════ */
/*  FAVICON                                                       */
/* ════════════════════════════════════════════════════════════ */
function setFavicon() {
  const link = document.querySelector("link[rel='icon']");
  if (link) link.href = '/favicon.svg';
}

/* ════════════════════════════════════════════════════════════ */
/*  BOOTSTRAP ALL                                                */
/* ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setFavicon();
  initLoader();
  initGlobe();
  initHeroParticles();
  initCursor();
  initNavbar();
  initLenis();
  initReveal();
  initCounters();
  initProcessTimeline();
  initTestiCarousel();
  initTilt();
  initMagnetic();
  initHeroParallax();
  initFormTabs();
  initForms();
  initProductParticles();
  initFaq();
  initColorTransitions();
  initAnchorLinks();
  initInvestorCards();

  // Delay map init to let DOM fully layout
  setTimeout(initWorldMap, 400);
});
/* updated */
