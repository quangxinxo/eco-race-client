/* ==========================
   CONFIG — Thay KEY ở đây
   ========================== */
const IMGBB_API_KEY = '1cdfb3b6df0d685d372064a9a55db58f'; // <-- Thay bằng key của bạn (ImgBB API key)
const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';
// URL proxy server Render của bạn:
const PROXY_URL = "https://eco-race-proxy.onrender.com/upload";

/* ==========================
   App state
   ========================== */
const photoInput = document.getElementById('photoInput');
const localPreview = document.getElementById('localPreview');
const localList = document.getElementById('localList');
const reportForm = document.getElementById('reportForm');
const submitBtn = document.getElementById('submitBtn');
const saveLocalBtn = document.getElementById('saveLocal');
const exportJsonBtn = document.getElementById('exportJson');
const galleryEl = document.getElementById('gallery');
const uploadStatus = document.getElementById('uploadStatus');
const geoBtn = document.getElementById('geoBtn');
const coordsEl = document.getElementById('coords');

let stagedFiles = []; // File objects
let reports = JSON.parse(localStorage.getItem('eco_reports_v2') || '[]');
let currentCoords = null;

/* ==========================
   Init
   ========================== */
window.addEventListener('load', () => {
  document.getElementById('app-status').textContent = 'Sẵn sàng — chế độ ImgBB upload (image hosting).';
  renderGallery();
});

photoInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).slice(0, 6);
  stagedFiles = files;
  renderLocalPreview();
});

/* ==========================
   Geolocation
   ========================== */
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { coordsEl.textContent = 'Trình duyệt không hỗ trợ Geolocation'; return; }
  coordsEl.textContent = 'Đang lấy vị trí...';
  navigator.geolocation.getCurrentPosition((pos) => {
    currentCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    coordsEl.textContent = `Lat: ${currentCoords.lat.toFixed(5)}, Lon: ${currentCoords.lon.toFixed(5)}`;
  }, (err) => {
    coordsEl.textContent = 'Không lấy được vị trí: ' + err.message;
  });
});

/* ==========================
   Render preview & gallery
   ========================== */
function renderLocalPreview() {
  localPreview.innerHTML = '';
  localList.innerHTML = '';
  stagedFiles.forEach((f, i) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.alt = f.name;
      localPreview.appendChild(img);
      // small list
      const row = document.createElement('div');
      row.textContent = `${i+1}. ${f.name} — ${(f.size/1024|0)}KB`;
      localList.appendChild(row);
    };
    reader.readAsDataURL(f);
  });
}

function renderGallery() {
  galleryEl.innerHTML = '';
  if (!reports.length) {
    galleryEl.innerHTML = '<div class="text-sm text-gray-500">Chưa có báo cáo nào.</div>';
    return;
  }
  reports.forEach(r => {
    const wrap = document.createElement('div');
    wrap.className = 'gallery-item';
    const title = document.createElement('div');
    title.innerHTML = `<strong>${escapeHtml(r.name)}</strong> • ${escapeHtml(r.type)}`;
    const time = document.createElement('div');
    time.className = 'text-xs text-gray-600';
    time.textContent = new Date(r.ts).toLocaleString();
    const desc = document.createElement('div');
    desc.className = 'text-sm mt-1';
    desc.textContent = r.desc || '';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'mt-2 grid gap-2';
    // images (URLs)
    (r.images || []).forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.loading = 'lazy';
      img.alt = 'photo';
      img.style.width = '100%';
      imgWrap.appendChild(img);
    });
    const meta = document.createElement('div');
    meta.className = 'text-xs text-gray-500 mt-2';
    meta.textContent = r.coords ? `Vị trí: ${r.coords.lat.toFixed(5)}, ${r.coords.lon.toFixed(5)}` : 'Vị trí: —';

    wrap.appendChild(title);
    wrap.appendChild(time);
    wrap.appendChild(desc);
    wrap.appendChild(imgWrap);
    wrap.appendChild(meta);
    galleryEl.appendChild(wrap);
  });
}

/* ==========================
   Submit handler: upload files to ImgBB then save report
   ========================== */
reportForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  await handleSubmit();
});

async function handleSubmit() {
  const name = document.getElementById('name').value.trim();
  const type = document.getElementById('type').value;
  const desc = document.getElementById('desc').value.trim();

  if (!name) { alert('Nhập tên đội/người'); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi...';
  uploadStatus.textContent = '';

  // upload each staged file to ImgBB -> get URL
  const uploadedUrls = [];
  try {
    for (let i = 0; i < stagedFiles.length; i++) {
      uploadStatus.textContent = `Uploading ${i+1}/${stagedFiles.length}...`;
      const url = await uploadFileToImgbb(stagedFiles[i]);
      uploadedUrls.push(url);
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi khi upload ảnh: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = '🎉 Gửi & Upload';
    uploadStatus.textContent = '';
    return;
  }

  // build report object
  const report = {
    id: 'r_' + Math.random().toString(36).slice(2,9),
    name, type, desc,
    images: uploadedUrls,
    coords: currentCoords,
    ts: Date.now()
  };

  // save to localStorage
  reports.unshift(report);
  localStorage.setItem('eco_reports_v2', JSON.stringify(reports));

  // reset UI
  stagedFiles = [];
  photoInput.value = '';
  renderLocalPreview();
  renderGallery();
  submitBtn.disabled = false;
  submitBtn.textContent = '🎉 Gửi & Upload';
  uploadStatus.textContent = 'Hoàn tất upload ' + uploadedUrls.length + ' ảnh.';
  alert('Gửi báo cáo thành công!');
}

/* ==========================
   ImgBB upload helper
   - Convert to base64 then POST to ImgBB
   ========================== */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      // result contains "data:*/*;base64,AAAA..."
      const base64 = r.result.split(',')[1];
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function uploadFileToImgbb(file) {
  if (!IMGBB_API_KEY || IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY') {
    throw new Error('Chưa cấu hình IMGBB_API_KEY trong main.js');
  }
  const b64 = await fileToBase64(file);
  const form = new FormData();
  form.append('key', IMGBB_API_KEY);
  form.append('image', b64);
  // optional: name and expiration
  // form.append('name', 'eco_' + file.name);

  const res = await fetch(IMGBB_ENDPOINT, {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('ImgBB upload failed: ' + res.status + ' ' + txt);
  }
  const data = await res.json();
  // data.data.url (image URL), data.data.display_url etc.
  return data.data.url;
}

/* ==========================
   Save local / export JSON
   ========================== */
saveLocalBtn.addEventListener('click', () => {
  localStorage.setItem('eco_reports_v2', JSON.stringify(reports));
  alert('Đã lưu vào localStorage (localStorage).');
});

exportJsonBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eco_reports.json';
  a.click();
  URL.revokeObjectURL(url);
});

/* ==========================
   Small helpers
   ========================== */
function escapeHtml(s) { if (!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
