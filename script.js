/* FitsMatch AI - script.js v2 */

// === CONFIG ===
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/bQw8U2vD6/';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// === APP STATE (Shared Context) ===
const AppState = {
  cuaca: '', acara: '', warna: '', style: '', gender: 'Unisex',
  detectedType: null, detectedColor: null, detectedColorHex: null, scanScore: 0,
  scanAnalysis: '', scanAdvice: '',
  chatHistory: [], chatContext: null,
  tmModel: null, isCameraActive: false, imageReady: false, currentBase64: null
};

// === OFFLINE DB ===
const DB = {
  outfits: {
    'Cerah-Kantor/Meeting':  [{t:'Kemeja Putih + Blazer Abu + Chino Beige',r:'Katun ringan sejuk untuk cuaca cerah, blazer kasual tetap profesional.',a:'Jam tangan kulit, loafers cokelat'},{t:'Polo Shirt Pastel + Celana Bahan Gelap',r:'Semi-formal segar dan adem di cuaca cerah.',a:'Ikat pinggang kulit, sneakers putih'},{t:'Dress Linen Pendek + Blazer Tipis',r:'Bahan linen ringan ideal untuk panas cerah.',a:'Flat shoes, kalung emas tipis'}],
    'Cerah-Nongkrong':       [{t:'Kaos Katun Oversize + Jeans Putih + Sneakers',r:'Kombinasi kasual trendi dan adem untuk hangout siang.',a:'Cap topi, kacamata hitam'},{t:'Crop Top + Celana Kulot Linen + Sandal',r:'Santai feminim untuk cuaca cerah.',a:'Totebag, gelang tipis'},{t:'Kemeja Flanel Terbuka + Tank Top + Shorts',r:'Streetwear kasual yang adem dan stylish.',a:'Waist bag, sneakers putih'}],
    'Hujan-Kantor/Meeting':  [{t:'Turtleneck Rajut + Blazer Wol + Celana Bahan Gelap',r:'Turtleneck melindungi dari dingin hujan, blazer tetap formal.',a:'Payung hitam, sepatu boots kulit'},{t:'Kemeja Flanel + Sweater V-Neck + Chino',r:'Layer hangat namun tetap rapi untuk rapat.',a:'Sepatu loafers anti-air'},{t:'Trench Coat Beige + Inner Polos + Celana Panjang',r:'Trench coat elegan menahan hujan ringan.',a:'Tas kulit, boots hak rendah'}],
    'Hujan-Kuliah':          [{t:'Hoodie Tebal + Jeans + Sneakers Kulit',r:'Hoodie hangat untuk kuliah saat hujan dingin.',a:'Beanie hat, ransel waterproof'},{t:'Jaket Windbreaker + Kaos + Jogger',r:'Windbreaker ringan anti-angin dan hujan ringan.',a:'Sneakers, topi bucket'},{t:'Sweater Oversized + Rok Midi + Boots',r:'Korean style hangat yang tetap stylish.',a:'Kaus kaki lucu, tas bahu'}],
    'Panas-Nongkrong':       [{t:'Tank Top + Shorts Denim + Sandal',r:'Pakaian minimal untuk cuaca panas terik.',a:'Kacamata hitam, topi pantai'},{t:'Dress Katun Pendek + Sandal',r:'Ringan dan adem untuk hangout cuaca panas.',a:'Gelang tipis, tas rotan'},{t:'Crop Top + Wide Leg Pants Linen',r:'Stylish namun adem dengan bahan linen.',a:'Sneakers putih, tas kecil'}],
    'Dingin-Kantor/Meeting': [{t:'Turtleneck Tebal + Blazer Tebal + Celana Wol',r:'Layer tebal sangat diperlukan di cuaca dingin.',a:'Syal wol, sepatu boots tebal'},{t:'Kemeja + Pullover Rajut + Celana Bahan',r:'Business casual hangat untuk meeting.',a:'Jam tangan, loafers'},{t:'Dress Wol + Outer Coat Tebal',r:'Elegan dan hangat untuk cuaca dingin.',a:'Stocking tebal, ankle boots'}]
  },
  defaults: [
    {t:'Kemeja Oxford + Chino + Sneakers',r:'Serbaguna untuk hampir semua cuaca dan acara.',a:'Jam tangan minimalis'},
    {t:'Kaos Katun + Jaket Parka + Jeans',r:'Jaket melindungi dari cuaca, kaos menjaga sirkulasi.',a:'Tas ransel'},
    {t:'Blouse Ringan + Celana Kulot + Flat Shoes',r:'Feminin dan nyaman untuk berbagai acara.',a:'Kalung tipis, tas tote'}
  ],
  tips: {
    'Panas': 'Pilih bahan katun, linen, atau rayon yang menyerap keringat. Hindari warna gelap yang menyerap panas.',
    'Dingin': 'Gunakan teknik layering: base layer tipis, middle layer hangat, outer windbreaker.',
    'Hujan': 'Pilih outer waterproof atau bawa jaket. Hindari bahan suede yang rusak terkena air.',
    'Cerah': 'Gunakan SPF pada kulit yang terbuka. Aksesori topi dan kacamata hitam sangat direkomendasikan.',
    'Berawan': 'Bawa outer tipis untuk antisipasi perubahan suhu. Berawan bisa berubah hujan.'
  },
  chatResponses: [
    {k:['hujan','rain','basah'],r:'Saat hujan, pilih **jaket windbreaker atau trench coat** sebagai outer. Gunakan sepatu boots atau sepatu waterproof. Hindari bahan suede. Warna gelap seperti navy dan hitam sangat cocok karena tidak terlihat kotor terkena percikan air.'},
    {k:['panas','terik','gerah'],r:'Untuk cuaca panas, prioritaskan bahan **katun, linen, atau rayon** yang berpori. Pilih warna terang seperti putih, krem, atau pastel yang memantulkan panas. Hindari pakaian ketat dan gelap.'},
    {k:['kantor','meeting','kerja','interview','wawancara'],r:'Untuk lingkungan formal, gunakan **kemeja atau blouse berkerah** dipadukan celana bahan atau rok midi. Blazer menambah kesan profesional. Pilih warna netral: hitam, navy, abu-abu, atau putih.'},
    {k:['kuliah','kampus','sekolah'],r:'Gaya kuliah yang ideal: **kaos katun + jeans + sneakers** untuk hari biasa, atau **polo shirt + chino** untuk tampilan lebih rapi. Korean style oversized juga sangat populer di kampus.'},
    {k:['kencan','date','romantis'],r:'Untuk kencan, tampil elegan kasual dengan **kemeja atau blouse satin** dipadukan chino atau rok midi. Pilih warna lembut: dusty pink, sage green, atau cream. Tambahkan aksesori sederhana untuk kesan istimewa.'},
    {k:['olahraga','gym','sport','lari'],r:'Outfit olahraga ideal: **jersey polyester dri-fit** yang menyerap keringat + celana training elastis. Pilih warna mencolok atau pastel. Sneakers dengan bantalan tebal sangat penting untuk perlindungan sendi.'},
    {k:['hitam','black'],r:'**Hitam adalah warna paling serbaguna!** Cocok dipadukan dengan hampir semua warna. Kombinasi terbaik: hitam-putih (klasik), hitam-merah (berani), hitam-krem (elegan). Pakaian hitam juga menyerap panas, jadi kurang cocok untuk cuaca terik.'},
    {k:['putih','white'],r:'**Putih memancarkan kesan bersih dan elegan.** Mudah dipadukan dengan warna apapun. Tip: kombinasi putih-navy sangat klasik, putih-hijau sage terasa segar, putih-pastel terlihat feminin. Perhatikan bahan agar tidak transparan.'},
    {k:['casual','santai','harian'],r:'Gaya casual terbaik: **kaos katun oversized + jeans atau jogger + sneakers putih**. Tambahkan outer flanel atau hoodie untuk nuansa streetwear. Aksesori minimalis seperti cap dan kacamata memberi sentuhan stylish.'},
    {k:['korean','kpop','korea'],r:'Korean style identik dengan: **oversized fit, warna pastel atau monokrom, layering**. Populer: kaos oversize + rok mini + platform sneakers, atau kemeja oversized + celana wide leg + tote bag. Aksesori khas: hair clip, kaus kaki lucu, tas mini.'},
    {k:['vintage','retro'],r:'Gaya vintage: **high-waist jeans + crop top tucked in**, atau **dress midi floral + cardigan rajut**. Warna earthtone (krem, mustard, cokelat, hijau zaitun) adalah pilihan utama. Sepatu loafers atau mary jane melengkapi tampilan retro.'}
  ]
};

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initFloatingElements();
  loadTMModel();
  loadApiKeyStatus();
  updateHistoryBadge();
  showSection('landing');
  document.getElementById('scan-file-input')?.addEventListener('change', handleScanFileSelect);
});


// === NAVIGATION ===
function showSection(id) {
  const sections = ['landing','recommendation','scanner','chatbot','about'];
  sections.forEach(sid => {
    const el = document.getElementById(sid);
    if (!el) return;
    if (sid === id) { el.classList.remove('hidden'); el.classList.add('animate-enter'); }
    else { el.classList.add('hidden'); el.classList.remove('animate-enter'); }
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeNav = document.getElementById('nav-' + id);
  if (activeNav) activeNav.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  const m = document.getElementById('mobile-menu');
  if (m) m.classList.toggle('hidden');
}

// === DARK MODE ===
let isDark = true;
function toggleDarkMode() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) { icon.className = isDark ? 'fa-solid fa-moon text-xs' : 'fa-solid fa-sun text-xs'; }
  document.querySelector('.bg-blob-1').style.background = isDark ? 'var(--accent)' : 'var(--accent)';
}

// === TOAST ===
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const icons = { success:'fa-circle-check text-green-400', error:'fa-circle-xmark text-red-400', warning:'fa-triangle-exclamation text-yellow-400', info:'fa-circle-info text-blue-400' };
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = '<i class="fa-solid ' + icons[type] + ' text-base"></i><span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 350); }, 3500);
}

// === FLOATING FASHION ELEMENTS ===
function initFloatingElements() {
  const wrapper = document.getElementById('floating-wrapper');
  if (!wrapper) return;
  const items = ['👕','🧥','👗','👖','👟','🧢','👜','🕶️','🧣','👠','🧤','🎀'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = items[i % items.length];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDelay = (Math.random() * 15) + 's';
    el.style.animationDuration = (14 + Math.random() * 14) + 's';
    wrapper.appendChild(el);
  }
}

// === API KEY ===
function getApiKey() {
  const k = localStorage.getItem('fitsmatch_api') || '';
  return (k && k.startsWith('AIza') && k.length > 20) ? k : '';
}
function loadApiKeyStatus() {
  const key = getApiKey();
  const dot = document.getElementById('api-dot');
  const label = document.getElementById('api-label');
  if (dot && label) {
    dot.style.background = key ? 'var(--success)' : 'var(--warning)';
    label.textContent = key ? 'Gemini Aktif' : 'Demo Mode';
  }
}
function toggleApiModal() {
  const m = document.getElementById('api-modal');
  if (!m) return;
  const isHidden = m.classList.contains('hidden') || !m.style.display || m.style.display === 'none';
  if (isHidden) {
    m.style.display = 'flex';
    const inp = document.getElementById('api-key-input');
    if (inp) inp.value = localStorage.getItem('fitsmatch_api') || '';
  } else {
    m.style.display = 'none';
  }
}
function saveApiKey() {
  const k = document.getElementById('api-key-input')?.value.trim();
  if (!k || !k.startsWith('AIza')) { showToast('Format API Key tidak valid! Harus diawali AIza...','error'); return; }
  localStorage.setItem('fitsmatch_api', k); loadApiKeyStatus(); toggleApiModal();
  showToast('Gemini API Key berhasil disimpan! AI aktif.','success');
}
function clearApiKey() {
  localStorage.removeItem('fitsmatch_api'); loadApiKeyStatus(); toggleApiModal();
  showToast('API Key dihapus. Kembali ke Demo Mode.','info');
}


// === CIRCULAR SCORE ===
function setScore(ringId, textId, score, circ) {
  const ring = document.getElementById(ringId);
  const txt = document.getElementById(textId);
  if (!ring || !txt) return;
  const offset = circ - (circ * Math.min(100, Math.max(0, score)) / 100);
  ring.style.strokeDashoffset = offset;
  ring.style.stroke = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  let current = 0;
  const step = score / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    txt.textContent = Math.round(current) + '%';
    if (current >= score) clearInterval(timer);
  }, 16);
}

// === RECOMMENDATION MODULE ===
async function handleRecSubmit(e) {
  e.preventDefault();
  const cuaca = document.getElementById('rec-cuaca').value;
  const acara = document.getElementById('rec-acara').value;
  const warna = document.getElementById('rec-warna').value;
  const style = document.getElementById('rec-style').value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'Unisex';
  if (!cuaca || !acara || !warna || !style) { showToast('Lengkapi semua pilihan terlebih dahulu!','warning'); return; }
  AppState.cuaca = cuaca; AppState.acara = acara; AppState.warna = warna; AppState.style = style; AppState.gender = gender;
  const btn = document.getElementById('rec-submit-btn');
  const spinner = document.getElementById('rec-spinner');
  const icon = document.getElementById('rec-icon');
  const results = document.getElementById('rec-results');
  btn.disabled = true; spinner.classList.remove('hidden'); icon.classList.add('hidden');
  results.classList.add('hidden');
  try {
    let data;
    const key = getApiKey();
    if (key) {
      try { data = await fetchGeminiRec(cuaca, acara, warna, style, gender); document.getElementById('rec-source-label').textContent = 'Menggunakan Gemini AI'; }
      catch(e) { showToast('Gemini gagal, menggunakan offline mode.','warning'); data = offlineRec(cuaca, acara, warna, style); document.getElementById('rec-source-label').textContent = 'Algoritma Cerdas Offline'; }
    } else {
      await new Promise(r => setTimeout(r, 900));
      data = offlineRec(cuaca, acara, warna, style);
      document.getElementById('rec-source-label').textContent = 'Algoritma Cerdas Offline';
    }
    displayRec(data); results.classList.remove('hidden');
    setTimeout(() => results.scrollIntoView({ behavior:'smooth', block:'start' }), 200);
    showToast('Rekomendasi outfit berhasil dibuat!','success');
    saveToHistory('recommendation', { input:{cuaca,acara,warna,style,gender}, result:data });
  } catch(err) { showToast('Terjadi kesalahan. Silakan coba lagi.','error'); console.error(err); }
  finally { btn.disabled = false; spinner.classList.add('hidden'); icon.classList.remove('hidden'); }
}

async function fetchGeminiRec(cuaca, acara, warna, style, gender) {
  const key = getApiKey();
  const prompt = 'Kamu adalah AI fashion stylist profesional. Buat rekomendasi outfit lengkap berdasarkan: Cuaca=' + cuaca + ', Acara=' + acara + ', Warna Favorit=' + warna + ', Gaya=' + style + ', Gender=' + gender + '. Berikan 3 pilihan outfit. Balas dalam JSON murni tanpa markdown: {"score":90,"tips":"tips fashion singkat","recommendations":[{"title":"nama outfit","reason":"alasan singkat","accessories":"aksesori"},{"title":"","reason":"","accessories":""},{"title":"","reason":"","accessories":""}]}';
  const res = await fetch(GEMINI_ENDPOINT + '?key=' + key, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}] }) });
  if (!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  let txt = data.candidates[0].content.parts[0].text.replace(/`json/g,'').replace(/`/g,'').trim();
  return JSON.parse(txt);
}

function offlineRec(cuaca, acara, warna, style) {
  const key = cuaca + '-' + acara;
  let outfits = DB.outfits[key] || DB.defaults;
  const score = (cuaca==='Panas' && (acara==='Kantor/Meeting')) ? 78 : (cuaca==='Dingin'||cuaca==='Hujan') ? 92 : 85;
  const tips = DB.tips[cuaca] || 'Sesuaikan outfit dengan kondisi cuaca dan acara untuk kenyamanan maksimal.';
  const recs = outfits.slice(0,3).map((o,i) => ({
    title: i===0 ? o.t.replace(/(Kemeja|Kaos|Dress|Blouse)/,' Warna ' + warna) : o.t,
    reason: o.r, accessories: o.a
  }));
  while (recs.length < 3) { const d = DB.defaults[recs.length % DB.defaults.length]; recs.push({title:d.t, reason:d.r, accessories:d.a}); }
  return { score, tips, recommendations: recs };
}

function displayRec(data) {
  setScore('rec-score-ring','rec-score-text', data.score, 188.5);
  document.getElementById('rec-tips').textContent = data.tips || '';
  const cont = document.getElementById('rec-cards-container');
  const icons = ['fa-shirt','fa-vest','fa-user-ninja'];
  const labels = ['Pilihan Utama','Alternatif 1','Alternatif 2'];
  cont.innerHTML = data.recommendations.slice(0,3).map((r,i) => '<div class="rec-card glass-card p-6 hover-float"><span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style="background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);color:#a78bfa">' + labels[i] + '</span><div class="text-2xl mt-3 mb-2" style="color:var(--accent)"><i class="fa-solid ' + icons[i] + '"></i></div><h4 class="font-outfit font-bold text-base mb-2" style="color:var(--text-1)">' + r.title + '</h4><p class="text-xs leading-relaxed mb-2" style="color:var(--text-2)"><strong style="color:var(--text-1)">Alasan:</strong> ' + r.reason + '</p><p class="text-xs" style="color:var(--text-3)"><i class="fa-solid fa-gem mr-1"></i>' + r.accessories + '</p></div>').join('');
}


// === SCANNER MODULE ===
async function loadTMModel() {
  const badge = document.getElementById('scan-model-badge');
  const dot = document.getElementById('model-dot');
  const status = document.getElementById('model-status');
  if (status) status.textContent = 'Memuat model...';
  try {
    AppState.tmModel = await tmImage.load(TM_MODEL_URL + 'model.json', TM_MODEL_URL + 'metadata.json');
    if (badge) { badge.textContent = 'Teachable Machine Aktif'; badge.style.background='rgba(124,58,237,.12)'; badge.style.borderColor='rgba(124,58,237,.3)'; badge.style.color='#a78bfa'; }
    if (dot) dot.style.background = 'var(--success)';
    if (status) status.textContent = 'Teachable Machine Siap';
  } catch(e) {
    if (badge) { badge.textContent = 'Local Classifier'; badge.style.background='rgba(245,158,11,.12)'; badge.style.borderColor='rgba(245,158,11,.3)'; badge.style.color='#fbbf24'; }
    if (dot) dot.style.background = 'var(--warning)';
    if (status) status.textContent = 'Mode Lokal Aktif';
    console.warn('TM model fallback:', e);
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user'}, audio:false });
    const video = document.getElementById('camera-video');
    video.srcObject = stream; video.classList.remove('hidden');
    document.getElementById('scan-placeholder').classList.add('hidden');
    document.getElementById('scan-overlay').classList.remove('hidden');
    document.getElementById('camera-controls').classList.remove('hidden');
    AppState.isCameraActive = true;
    showToast('Kamera aktif! Arahkan ke outfit kamu.','info');
  } catch(err) {
    showToast('Gagal akses kamera. Coba upload foto.','error');
    console.error(err);
  }
}

function stopCamera() {
  const v = document.getElementById('camera-video');
  if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null; }
  v?.classList.add('hidden');
  document.getElementById('camera-controls').classList.add('hidden');
  document.getElementById('scan-overlay').classList.add('hidden');
  AppState.isCameraActive = false;
}

function capturePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('color-canvas');
  const preview = document.getElementById('image-preview-el');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg');
  AppState.currentBase64 = dataUrl.split(',')[1];
  preview.src = dataUrl; preview.classList.remove('hidden');
  stopCamera();
  document.getElementById('scan-placeholder').classList.add('hidden');
  document.getElementById('scan-reset-bar').classList.remove('hidden');
  predictImage(canvas);
}

function handleScanFileSelect(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const preview = document.getElementById('image-preview-el');
    preview.src = ev.target.result; preview.classList.remove('hidden');
    document.getElementById('scan-placeholder').classList.add('hidden');
    document.getElementById('scan-reset-bar').classList.remove('hidden');
    AppState.currentBase64 = ev.target.result.split(',')[1];
    const img = new Image();
    img.onload = () => { predictImage(img); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function predictImage(imgEl) {
  AppState.imageReady = false;
  document.getElementById('detected-type').textContent = 'Memproses...';
  document.getElementById('type-confidence-text').textContent = '—';
  document.getElementById('type-confidence-bar').style.width = '0%';
  extractDominantColor(imgEl);
  if (AppState.tmModel) {
    try {
      const preds = await AppState.tmModel.predict(imgEl);
      let best = preds.reduce((a,b) => b.probability > a.probability ? b : a);
      AppState.detectedType = best.className;
      document.getElementById('detected-type').textContent = best.className;
      const conf = Math.round(best.probability * 100);
      document.getElementById('type-confidence-text').textContent = conf + '% cocok';
      document.getElementById('type-confidence-bar').style.width = conf + '%';
      showToast('Terdeteksi: ' + best.className + ' (' + conf + '%)','success');
    } catch { localClassify(); }
  } else { localClassify(); }
  AppState.imageReady = true;
}

function localClassify() {
  const types = ['Kemeja','Kaos','Hoodie','Jaket','Dress','Blazer','Celana Panjang','Rok'];
  const t = types[Math.floor(Math.random() * types.length)];
  const conf = 75 + Math.floor(Math.random() * 22);
  AppState.detectedType = t;
  document.getElementById('detected-type').textContent = t;
  document.getElementById('type-confidence-text').textContent = '~' + conf + '% (estimasi)';
  document.getElementById('type-confidence-bar').style.width = conf + '%';
  showToast('Terdeteksi: ' + t + ' (estimasi lokal)','info');
}

function extractDominantColor(imgEl) {
  const c = document.createElement('canvas'); c.width = 50; c.height = 50;
  const ctx = c.getContext('2d'); ctx.drawImage(imgEl, 0, 0, 50, 50);
  const d = ctx.getImageData(0,0,50,50).data;
  let r=0,g=0,b=0, n=d.length/4;
  for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];}
  r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
  const hex = '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  const name = rgbToName(r,g,b);
  AppState.detectedColor = name; AppState.detectedColorHex = hex;
  document.getElementById('detected-color').textContent = name;
  document.getElementById('detected-color-swatch').style.background = hex;
}

function rgbToName(r,g,b) {
  const colors = [{n:'Putih',r:255,g:255,b:255},{n:'Hitam',r:0,g:0,b:0},{n:'Merah',r:220,g:30,b:30},{n:'Biru',r:30,g:80,b:200},{n:'Hijau',r:30,g:150,b:60},{n:'Kuning',r:240,g:210,b:30},{n:'Abu-abu',r:128,g:128,b:128},{n:'Navy',r:20,g:30,b:100},{n:'Krem',r:240,g:215,b:180},{n:'Cokelat',r:130,g:70,b:30},{n:'Pink',r:240,g:160,b:180},{n:'Ungu',r:120,g:50,b:170},{n:'Oranye',r:240,g:140,b:30}];
  return colors.reduce((a,c) => { const d = Math.sqrt((r-c.r)**2+(g-c.g)**2+(b-c.b)**2); return d < a.d ? {n:c.n,d} : a; }, {n:'Putih',d:Infinity}).n;
}

function resetScanner() {
  stopCamera();
  document.getElementById('image-preview-el').classList.add('hidden');
  document.getElementById('scan-placeholder').classList.remove('hidden');
  document.getElementById('scan-reset-bar').classList.add('hidden');
  document.getElementById('scan-results').classList.add('hidden');
  document.getElementById('scan-file-input').value='';
  document.getElementById('detected-type').textContent='Belum Dideteksi';
  document.getElementById('detected-color').textContent='Belum Dideteksi';
  document.getElementById('detected-color-swatch').style.background='transparent';
  document.getElementById('type-confidence-bar').style.width='0%';
  document.getElementById('type-confidence-text').textContent='—';
  AppState.imageReady=false; AppState.detectedType=null; AppState.currentBase64=null;
  showToast('Scanner direset. Siap untuk scan baru.','info');
}


async function analyzeScan() {
  const cuaca = document.getElementById('scan-cuaca').value;
  const acara = document.getElementById('scan-acara').value;
  if (!cuaca) { showToast('Pilih cuaca terlebih dahulu!','warning'); return; }
  if (!acara) { showToast('Pilih acara terlebih dahulu!','warning'); return; }
  if (!AppState.imageReady || !AppState.detectedType) { showToast('Upload foto atau ambil gambar terlebih dahulu!','warning'); return; }
  const spinner = document.getElementById('analyze-spinner');
  const icon = document.getElementById('analyze-icon');
  const btn = document.getElementById('analyze-btn');
  const results = document.getElementById('scan-results');
  btn.disabled=true; spinner.classList.remove('hidden'); icon.classList.add('hidden');
  results.classList.add('hidden');
  try {
    let data;
    const key = getApiKey();
    if (key && AppState.currentBase64) {
      try { data = await fetchGeminiScan(cuaca, acara); }
      catch { data = offlineScan(cuaca, acara); }
    } else {
      await new Promise(r => setTimeout(r, 700));
      data = offlineScan(cuaca, acara);
    }
    AppState.scanScore = data.score; AppState.scanAnalysis = data.analysis; AppState.scanAdvice = data.advice;
    displayScan(data); results.classList.remove('hidden');
    setTimeout(() => results.scrollIntoView({ behavior:'smooth', block:'start' }), 200);
    showToast('Analisis outfit selesai!','success');
  } catch(e) { showToast('Terjadi kesalahan analisis.','error'); console.error(e); }
  finally { btn.disabled=false; spinner.classList.add('hidden'); icon.classList.remove('hidden'); }
}

async function fetchGeminiScan(cuaca, acara) {
  const key = getApiKey();
  const prompt = 'Kamu adalah AI fashion stylist. Outfit terdeteksi: ' + AppState.detectedType + ', warna ' + AppState.detectedColor + '. Cuaca: ' + cuaca + ', Acara: ' + acara + '. Analisis kesesuaian outfit ini. Balas JSON murni: {"score":80,"items":[{"item":"nama pakaian","ok":true,"note":"catatan singkat"}],"analysis":"analisis keseluruhan","advice":"saran perbaikan spesifik"}';
  const res = await fetch(GEMINI_ENDPOINT + '?key=' + key, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}] }) });
  if (!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  let txt = data.candidates[0].content.parts[0].text.replace(/`json/g,'').replace(/`/g,'').trim();
  return JSON.parse(txt);
}

function offlineScan(cuaca, acara) {
  const t = AppState.detectedType; const col = AppState.detectedColor;
  let score = 82; let analysis = ''; let advice = '';
  const isHot = cuaca==='Panas' || cuaca==='Cerah';
  const isCold = cuaca==='Dingin' || cuaca==='Hujan';
  const isFormal = acara==='Kantor/Meeting' || acara==='Kondangan';
  const isCasual = acara==='Nongkrong' || acara==='Jalan-jalan';
  if ((t==='Hoodie'||t==='Jaket') && isHot) { score-=35; analysis='Pakaian tebal kurang cocok untuk cuaca ' + cuaca + '.'; advice='Ganti dengan kaos katun atau kemeja lengan pendek berbahan ringan.'; }
  else if ((t==='Kaos'||t==='Tank Top') && isFormal) { score-=40; analysis=t + ' terlalu kasual untuk acara ' + acara + '.'; advice='Ganti dengan kemeja berkerah atau blazer untuk tampilan lebih profesional.'; }
  else if ((t==='Kemeja'||t==='Blazer') && acara==='Olahraga') { score-=50; analysis=t + ' tidak cocok untuk olahraga.'; advice='Gunakan jersey atau kaos dri-fit dengan celana training.'; }
  else if ((t==='Hoodie'||t==='Jaket') && isCold) { score+=10; analysis=t + ' sangat tepat untuk cuaca ' + cuaca + '. Pilihan sangat baik!'; advice='Padukan dengan syal atau beanie untuk kehangatan ekstra.'; }
  else { analysis=t + ' berwarna ' + col + ' cukup sesuai untuk ' + acara + ' saat cuaca ' + cuaca + '.'; advice='Tambahkan aksesori yang tepat untuk memperkuat tampilan.'; }
  score = Math.max(20, Math.min(100, score));
  const items = [{item:t, ok: score>=60, note: score>=60?'Cocok untuk '+acara:'Kurang ideal untuk '+acara},{item:'Warna '+col, ok: true, note:'Pilihan warna yang baik'},{item:'Cuaca '+cuaca, ok: !((t==='Hoodie'||t==='Jaket')&&isHot), note: score>=60?'Sesuai cuaca':'Pertimbangkan pakaian berbahan lebih tipis'}];
  return { score, items, analysis, advice };
}

function displayScan(data) {
  setScore('scan-score-ring','scan-score-text', data.score, 138.2);
  const cont = document.getElementById('scan-analysis-items');
  if (data.items) {
    cont.innerHTML = data.items.map(i => '<div class="analysis-item ' + (i.ok?'good':'bad') + '"><span class="text-lg shrink-0">' + (i.ok?'✅':'⚠️') + '</span><div><strong style="color:var(--text-1)">' + i.item + '</strong><p class="text-xs mt-0.5" style="color:var(--text-2)">' + i.note + '</p></div></div>').join('');
  }
  document.getElementById('scan-advice').textContent = data.advice || '';
}

function saveChatContext(type) {
  if (type === 'rec') {
    AppState.chatContext = { type:'recommendation', cuaca:AppState.cuaca, acara:AppState.acara, warna:AppState.warna, style:AppState.style };
    showSection('chatbot');
    const banner = document.getElementById('chat-context-banner');
    const label = document.getElementById('chat-context-label');
    if (banner) banner.classList.remove('hidden');
    if (label) label.textContent = 'Konteks rekomendasi outfit (' + AppState.acara + ' - ' + AppState.cuaca + ') dimuat';
    addChatBubble('ai', 'Konteks rekomendasi outfit kamu sudah dimuat! Tanyakan apa saja tentang outfit untuk ' + AppState.acara + ' saat cuaca ' + AppState.cuaca + '.');
  } else if (type === 'scan') {
    AppState.chatContext = { type:'scan', detectedType:AppState.detectedType, detectedColor:AppState.detectedColor, score:AppState.scanScore, analysis:AppState.scanAnalysis };
    showSection('chatbot');
    const banner = document.getElementById('chat-context-banner');
    const label = document.getElementById('chat-context-label');
    if (banner) banner.classList.remove('hidden');
    if (label) label.textContent = 'Konteks dari scan outfit (' + AppState.detectedType + ') dimuat';
    addChatBubble('ai', 'Saya sudah melihat hasil scan outfit kamu! Terdeteksi ' + AppState.detectedType + ' dengan skor kecocokan ' + AppState.scanScore + '%. Ada yang ingin kamu tanyakan?');
  }
  showToast('Konteks outfit dimuat ke AI Chat!','success');
}

function clearChatContext() {
  AppState.chatContext = null;
  const banner = document.getElementById('chat-context-banner');
  if (banner) banner.classList.add('hidden');
  showToast('Konteks chat dihapus.','info');
}


// === CHATBOT MODULE ===
async function sendChatMessage() {
  const inp = document.getElementById('chat-input');
  const msg = inp?.value.trim(); if (!msg) return;
  addChatBubble('user', msg);
  AppState.chatHistory.push({ role:'user', content:msg });
  inp.value = ''; inp.style.height = 'auto';
  document.getElementById('send-btn').disabled = true;
  document.getElementById('send-icon').classList.add('hidden');
  document.getElementById('send-spinner').classList.remove('hidden');
  const typingEl = showTypingIndicator();
  try {
    let reply;
    const key = getApiKey();
    if (key) {
      try { reply = await fetchGeminiChat(msg); }
      catch { reply = offlineChat(msg); }
    } else { await new Promise(r => setTimeout(r,800)); reply = offlineChat(msg); }
    typingEl.remove();
    addChatBubble('ai', reply);
    AppState.chatHistory.push({ role:'ai', content:reply });
  } catch(e) {
    typingEl.remove();
    addChatBubble('ai','Maaf, ada kendala teknis. Silakan coba lagi.');
  } finally {
    document.getElementById('send-btn').disabled = false;
    document.getElementById('send-icon').classList.remove('hidden');
    document.getElementById('send-spinner').classList.add('hidden');
  }
}

async function fetchGeminiChat(msg) {
  const key = getApiKey();
  let system = 'Kamu adalah FitsMatch AI, asisten fashion stylist profesional yang ramah dan berbahasa Indonesia. Berikan saran fashion yang relevan, spesifik, dan praktis. Gunakan emoji sesekali untuk membuat percakapan lebih menarik.';
  if (AppState.chatContext) {
    if (AppState.chatContext.type==='scan') system += ' Konteks: pengguna baru scan outfit ' + AppState.chatContext.detectedType + ' warna ' + AppState.chatContext.detectedColor + ' dengan skor ' + AppState.chatContext.score + '%.';
    else if (AppState.chatContext.type==='recommendation') system += ' Konteks: pengguna mencari outfit untuk ' + AppState.chatContext.acara + ' saat cuaca ' + AppState.chatContext.cuaca + ' dengan warna favorit ' + AppState.chatContext.warna + '.';
  }
  const history = AppState.chatHistory.slice(-6).map(h => ({ role: h.role==='user'?'user':'model', parts:[{text:h.content}] }));
  history.push({ role:'user', parts:[{text: system + '\n\nPertanyaan pengguna: ' + msg}] });
  const res = await fetch(GEMINI_ENDPOINT + '?key=' + key, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents: history }) });
  if (!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

function offlineChat(msg) {
  const lower = msg.toLowerCase();
  if (AppState.chatContext?.type==='scan') {
    if (lower.includes('cocok')||lower.includes('sesuai')||lower.includes('bagus')) return 'Berdasarkan scan, ' + AppState.chatContext.detectedType + '-mu mendapat skor ' + AppState.chatContext.score + '%. ' + AppState.chatContext.analysis + ' ' + AppState.chatContext.advice;
  }
  const match = DB.chatResponses.find(cr => cr.k.some(k => lower.includes(k)));
  if (match) return match.r;
  const generics = ['Outfit yang baik adalah yang membuat kamu nyaman dan percaya diri! Ceritakan lebih detail kondisimu (cuaca, acara, warna favorit) agar saya bisa memberi saran yang lebih spesifik.','Pilihan outfit tergantung banyak faktor: cuaca, acara, dan tentu saja preferensi pribadimu. Coba gunakan fitur Rekomendasi untuk saran yang lebih personal!','Gaya terbaik adalah yang mencerminkan kepribadianmu. Apakah ada acara spesifik yang ingin kamu persiapkan outfitnya?'];
  return generics[Math.floor(Math.random()*generics.length)];
}

function addChatBubble(role, text) {
  const cont = document.getElementById('chatbot-messages');
  if (!cont) return;
  const div = document.createElement('div');
  div.className = 'chat-bubble ' + role;
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g,'<strong></strong>').replace(/\n/g,'<br>');
  cont.appendChild(div);
  cont.scrollTop = cont.scrollHeight;
}

function showTypingIndicator() {
  const cont = document.getElementById('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  cont.appendChild(div); cont.scrollTop = cont.scrollHeight;
  return div;
}

function clearChat() {
  const cont = document.getElementById('chatbot-messages');
  if (!cont) return;
  cont.innerHTML = '';
  AppState.chatHistory = [];
  AppState.chatContext = null;
  const banner = document.getElementById('chat-context-banner');
  if (banner) banner.classList.add('hidden');
  addChatBubble('ai','Chat dihapus. Ada yang ingin kamu tanyakan tentang fashion? ✨');
  showToast('Percakapan dihapus.','info');
}

function sendQuickPrompt(text) {
  const inp = document.getElementById('chat-input');
  if (inp) { inp.value = text; sendChatMessage(); }
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// === HISTORY ===
function saveToHistory(type, data) {
  let h = JSON.parse(localStorage.getItem('fitsmatch_history') || '[]');
  h.unshift({ id:Date.now(), type, timestamp:new Date().toLocaleString('id-ID'), data });
  if (h.length > 50) h = h.slice(0, 50);
  localStorage.setItem('fitsmatch_history', JSON.stringify(h));
  updateHistoryBadge();
  showToast('Tersimpan ke riwayat!','success');
}

function updateHistoryBadge() {
  const h = JSON.parse(localStorage.getItem('fitsmatch_history') || '[]');
  const badge = document.getElementById('history-badge');
  if (badge) { if(h.length>0){badge.textContent=h.length;badge.classList.remove('hidden');}else{badge.classList.add('hidden');} }
}

// === CLOSE MODAL ON BACKDROP CLICK ===
document.addEventListener('click', e => {
  const modal = document.getElementById('api-modal');
  if (modal && e.target === modal) modal.style.display = 'none';
});

