// Danh sách lớp từ 10A1 -> 12A6
const CLASSES = [];
for (let grade = 10; grade <= 12; grade++) {
  for (let i = 1; i <= 6; i++) {
    CLASSES.push(`${grade}A${i}`);
  }
}

// Khởi tạo dropdown lớp
window.onload = () => {
  const select = document.getElementById('class-select');
  CLASSES.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  });
  switchView('input-view');
};

function switchView(id) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-green-700', 'text-white');
    btn.classList.add('bg-gray-200');
  });
  document.querySelector(`button[onclick="switchView('${id}')"]`).classList.add('bg-green-700', 'text-white');
}

function logRecycling() {
  const cls = document.getElementById('class-select').value;
  const date = document.getElementById('log-date').value;
  const bottles = +document.getElementById('bottle-count').value || 0;
  const paper = +document.getElementById('paper-weight').value || 0;
  const file = document.getElementById('photo-input').files[0];

  if (!cls || !date) return alert('⚠️ Vui lòng nhập đủ thông tin!');
  const points = bottles * 500 + paper; // Tạm tính điểm

  // Thêm vào BXH
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML += `<tr><td class="border p-2 font-semibold">${cls}</td><td class="border p-2 text-green-600 font-bold">${points}</td></tr>`;

  // Thêm vào gallery nếu có ảnh
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('gallery').innerHTML += `
        <div class="border rounded-xl overflow-hidden shadow hover:scale-[1.02] transition-transform">
          <img src="${e.target.result}" class="w-full h-40 object-cover" alt="Ảnh kỷ niệm">
          <p class="p-2 text-center text-sm text-gray-600">${cls} (${date})</p>
        </div>`;
    };
    reader.readAsDataURL(file);
  }

  launchFireworks();
  alert(`🎉 Lưu dữ liệu thành công cho ${cls}!`);
  document.getElementById('input-form').reset();
}

function launchFireworks() {
  const container = document.getElementById('fireworks-container');
  container.classList.remove('hidden');
  container.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const f = document.createElement('div');
    f.className = 'firework';
    f.style.left = `${Math.random() * 100}%`;
    f.style.setProperty('--color', ['#10B981', '#F59E0B', '#34D399', '#22C55E'][i % 4]);
    container.appendChild(f);
  }
  setTimeout(() => container.classList.add('hidden'), 2000);
}
