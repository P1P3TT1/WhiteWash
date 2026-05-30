const dropEl = document.getElementById('drop');
const fileEl = document.getElementById('file');
const gridEl = document.getElementById('grid');
const toolbarEl = document.getElementById('toolbar');
const countEl = document.getElementById('count');
const zipBtn = document.getElementById('zip');
const clearBtn = document.getElementById('clear');

let items = []; // { name, type, outBlob, beforeUrl, afterUrl, warn }

// ---- drag & drop wiring ----
dropEl.addEventListener('click', () => fileEl.click());
fileEl.addEventListener('change', e => handleFiles(e.target.files));
['dragenter','dragover'].forEach(ev =>
  dropEl.addEventListener(ev, e => { e.preventDefault(); dropEl.classList.add('drag'); }));
['dragleave','drop'].forEach(ev =>
  dropEl.addEventListener(ev, e => { e.preventDefault(); dropEl.classList.remove('drag'); }));
dropEl.addEventListener('drop', e => handleFiles(e.dataTransfer.files));

clearBtn.addEventListener('click', () => {
  items.forEach(it => { URL.revokeObjectURL(it.beforeUrl); URL.revokeObjectURL(it.afterUrl); });
  items = [];
  render();
});

zipBtn.addEventListener('click', async () => {
  zipBtn.disabled = true; zipBtn.textContent = 'Zipping…';
  const zip = new JSZip();
  items.forEach(it => zip.file(it.name, it.outBlob));
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'whitewashed.zip');
  zipBtn.disabled = false; zipBtn.textContent = 'Download all (.zip)';
});

// ---- file handling ----
async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f =>
    /\.(png|svg)$/i.test(f.name) || f.type === 'image/png' || f.type === 'image/svg+xml');
  for (const f of files) {
    try {
      const ext = f.name.toLowerCase().endsWith('.svg') || f.type === 'image/svg+xml' ? 'svg' : 'png';
      const it = ext === 'png' ? await whitenPng(f) : await whitenSvg(f);
      items.push(it);
      render();
    } catch (err) {
      console.error(err);
    }
  }
  fileEl.value = '';
}

function whitenPng(file) {
  return new Promise((resolve, reject) => {
    const beforeUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      c.toBlob(blob => {
        resolve({
          name: file.name, type: 'png', outBlob: blob,
          beforeUrl, afterUrl: URL.createObjectURL(blob), warn: null
        });
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = beforeUrl;
  });
}

async function whitenSvg(file) {
  const text = await file.text();
  const beforeUrl = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  const m = text.match(/<svg\b[^>]*>/i);
  if (!m) throw new Error('No <svg> tag');
  const open = m[0];
  const rect = '<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>';
  const out = text.slice(0, m.index + open.length) + rect + text.slice(m.index + open.length);
  const hasViewBox = /viewBox\s*=/i.test(open);
  const hasSize = /\bwidth\s*=/i.test(open) && /\bheight\s*=/i.test(open);
  const warn = (hasViewBox || hasSize) ? null
    : 'No viewBox or width/height – white rect may not fill. Add dimensions.';
  const blob = new Blob([out], { type: 'image/svg+xml' });
  return {
    name: file.name, type: 'svg', outBlob: blob,
    beforeUrl, afterUrl: URL.createObjectURL(blob), warn
  };
}

// ---- rendering ----
function render() {
  const has = items.length > 0;
  toolbarEl.classList.toggle('show', has);
  if (has) {
    const png = items.filter(i => i.type === 'png').length;
    const svg = items.length - png;
    countEl.innerHTML = `<b>${items.length}</b> file${items.length>1?'s':''}` +
      ` · ${png} PNG · ${svg} SVG`;
  }
  gridEl.innerHTML = '';
  items.forEach((it, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="preview">
        <span class="tag l">before</span><span class="tag r">white</span>
        <div class="half before"><img src="${it.beforeUrl}" alt=""></div>
        <div class="half after"><img src="${it.afterUrl}" alt=""></div>
      </div>
      <div class="meta">
        <div class="fname">
          <span class="badge ${it.type}">${it.type.toUpperCase()}</span>
          <span>${escapeHtml(it.name)}</span>
        </div>
        <div class="row">
          <span class="note">${(it.outBlob.size/1024).toFixed(1)} KB</span>
          <a class="dl" data-i="${i}" href="#">download ↓</a>
        </div>
        ${it.warn ? `<div class="warn">⚠ ${it.warn}</div>` : ''}
      </div>`;
    card.querySelector('.dl').addEventListener('click', e => {
      e.preventDefault();
      triggerDownload(it.outBlob, it.name);
    });
    gridEl.appendChild(card);
  });
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

// ---- soap-bubble cursor trail ----
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  let last = 0;
  function spawn(x, y) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 8 + Math.random() * 14;
    b.style.width = b.style.height = size.toFixed(1) + 'px';
    b.style.left = (x + (Math.random() * 14 - 7)).toFixed(1) + 'px';
    b.style.top  = (y + (Math.random() * 14 - 7)).toFixed(1) + 'px';
    b.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
    b.style.setProperty('--dur', (900 + Math.random() * 600).toFixed(0) + 'ms');
    document.body.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    if (now - last < 70) return;      // throttle: ~14 bubbles/sec max
    last = now;
    spawn(e.clientX, e.clientY);
  }, { passive: true });
})();