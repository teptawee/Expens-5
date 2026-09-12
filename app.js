/**
 * ============================================
 * Frontend Logic
 * ============================================
 */

// 🔧 ตั้งค่า API URL ของคุณตรงนี้
const API_URL = "https://script.google.com/macros/s/AKfycby-oHhsH3-Bt26DlaBWe3eosyKaPs2yS13IVbEgikb65fAf_Hia6MlINSsj27cZDcI4/exec";

// ==================== UTILS ====================
const fmt = n => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number(n) || 0);

async function callAPI(action, data = null, method = 'GET') {
  let url = API_URL;
  let opts = { method: 'GET' };

  if (method === 'GET') {
    url += `?action=${encodeURIComponent(action)}`;
  } else {
    opts = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data })
    };
  }

  const res = await fetch(url, opts);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'API Error');
  return json.data;
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const d = await callAPI('getDashboard');
    
    // Summary
    document.getElementById('sumToday').textContent = '฿' + fmt(d.summary.today);
    document.getElementById('sumWeek').textContent = '฿' + fmt(d.summary.week);
    document.getElementById('sumMonth').textContent = '฿' + fmt(d.summary.month);
    document.getElementById('sumYear').textContent = '฿' + fmt(d.summary.year);

    // Budget
    const b = d.monthBudgetInfo;
    document.getElementById('budgetTotal').textContent = '฿' + fmt(b.totalBudget);
    document.getElementById('budgetSpent').textContent = '฿' + fmt(b.spent);
    document.getElementById('budgetRemain').textContent = '฿' + fmt(b.remain);
    const usedPercent = b.totalBudget > 0 ? (b.spent / b.totalBudget) * 100 : 0;
    document.getElementById('budgetBar').style.width = Math.min(100, usedPercent) + '%';

    // Chart: Category
    renderCategoryChart(d.byCategory);
    // Chart: Payment
    renderPaymentChart(d.byPayment);
    // Chart: Daily
    renderDailyChart(d.dailyCompare);
    // Chart: Weekly
    renderWeeklyChart(d.weeklyCompare);
    // Chart: Monthly
    renderMonthlyChart(d.monthlyCompare);

    // Progress per category
    renderCategoryProgress(d.byCategory);

    // Recent
    renderRecent(d.recentTx);

  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}

const CHART_COLORS = [
  '#f8bbd0','#ce93d8','#90caf9','#a5d6a7','#ffe082',
  '#ffab91','#b39ddb','#80cbc4','#ef9a9a','#c5e1a5','#ffcc80'
];

const chartDefaults = {
  plugins: { legend: { labels: { font: { family: 'Sarabun' }, color: '#4a4a5e' } } }
};

function renderCategoryChart(data) {
  const ctx = document.getElementById('chartCategory');
  if (!ctx) return;
  const filtered = data.filter(d => d.spent > 0);
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filtered.map(d => `${d.icon} ${d.name}`),
      datasets: [{
        data: filtered.map(d => d.spent),
        backgroundColor: CHART_COLORS,
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: { ...chartDefaults, responsive: true, cutout: '62%' }
  });
}

function renderPaymentChart(data) {
  const ctx = document.getElementById('chartPayment');
  if (!ctx) return;
  const filtered = data.filter(d => d.total > 0);
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filtered.map(d => `${d.icon} ${d.name}`),
      datasets: [{
        data: filtered.map(d => d.total),
        backgroundColor: ['#f8bbd0','#a5d6a7','#90caf9','#ffe082'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: { ...chartDefaults, responsive: true, cutout: '62%' }
  });
}

function renderDailyChart(data) {
  const ctx = document.getElementById('chartDaily');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'ค่าใช้จ่าย (บาท)',
        data: data.map(d => d.amount),
        backgroundColor: 'rgba(206,147,216,0.75)',
        borderRadius: 10
      }]
    },
    options: { ...chartDefaults, responsive: true }
  });
}

function renderWeeklyChart(data) {
  const ctx = document.getElementById('chartWeekly');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'บาท',
        data: data.map(d => d.amount),
        backgroundColor: 'rgba(144,202,249,0.75)',
        borderRadius: 10
      }]
    },
    options: { ...chartDefaults, responsive: true }
  });
}

function renderMonthlyChart(data) {
  const ctx = document.getElementById('chartMonthly');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'ใช้ไป',
          data: data.map(d => d.spent),
          borderColor: '#ce93d8',
          backgroundColor: 'rgba(206,147,216,0.25)',
          fill: true, tension: 0.35
        },
        {
          label: 'งบตั้งไว้',
          data: data.map(d => d.budget),
          borderColor: '#a5d6a7',
          backgroundColor: 'rgba(165,214,167,0.15)',
          borderDash: [6, 4],
          fill: false, tension: 0.35
        }
      ]
    },
    options: { ...chartDefaults, responsive: true }
  });
}

function renderCategoryProgress(cats) {
  const el = document.getElementById('categoryProgress');
  el.innerHTML = cats.map(c => `
    <div class="cat-row">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-info">
        <div class="name">${c.name}</div>
        <div class="meta">ใช้ไป ฿${fmt(c.spent)} / งบ ฿${fmt(c.budget)} · เหลือ ฿${fmt(c.remain)}</div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${c.percent}%;background:${c.color}"></div>
        </div>
      </div>
      <div class="cat-percent" style="color:${c.color}">${c.percent}%</div>
    </div>
  `).join('');
}

function renderRecent(list) {
  const el = document.getElementById('recentList');
  if (!list.length) {
    el.innerHTML = '<p style="text-align:center;color:#7e7e94;padding:16px">ยังไม่มีรายการ</p>';
    return;
  }
  el.innerHTML = list.map(t => `
    <div class="recent-item">
      <div class="recent-left">
        <div class="recent-icon">${t.categoryIcon || '📌'}</div>
        <div class="recent-info">
          <div class="cat-name">${t.categoryName || '-'}</div>
          <div class="sub">${t.date} ${t.time || ''} · ${t.payIcon || ''} ${t.payName || ''} ${t.note ? '· ' + t.note : ''}</div>
        </div>
      </div>
      <div class="recent-amount">-฿${fmt(t.amount)}</div>
    </div>
  `).join('');
}

// ==================== ADD PAGE ====================
let selectedCat = null;
let selectedPay = null;

async function initAddPage() {
  const cats = (await callAPI('getCategories')).filter(c => c.active !== false);
  const pays = (await callAPI('getPayments')).filter(p => p.active !== false);

  document.getElementById('categoryPicker').innerHTML = cats.map(c => `
    <div class="icon-option" data-id="${c.id}" data-name="${c.name}" data-icon="${c.icon}">
      <span class="emoji">${c.icon}</span>${c.name}
    </div>
  `).join('');

  document.getElementById('paymentPicker').innerHTML = pays.map(p => `
    <div class="icon-option" data-id="${p.id}" data-name="${p.name}" data-icon="${p.icon}">
      <span class="emoji">${p.icon}</span>${p.name}
    </div>
  `).join('');

  document.querySelectorAll('#categoryPicker .icon-option').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('#categoryPicker .icon-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedCat = { id: el.dataset.id, name: el.dataset.name, icon: el.dataset.icon };
    };
  });

  document.querySelectorAll('#paymentPicker .icon-option').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('#paymentPicker .icon-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedPay = { id: el.dataset.id, name: el.dataset.name, icon: el.dataset.icon };
    };
  });

  document.getElementById('txForm').onsubmit = async (e) => {
    e.preventDefault();
    const res = document.getElementById('result');
    if (!selectedCat) return showResult(res, 'กรุณาเลือกหมวดหมู่', false);
    if (!selectedPay) return showResult(res, 'กรุณาเลือกประเภทการชำระ', false);
    const amount = parseFloat(document.getElementById('amount').value);
    if (!amount || amount <= 0) return showResult(res, 'กรุณากรอกจำนวนเงิน', false);

    try {
      await callAPI('addTransaction', {
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        categoryIcon: selectedCat.icon,
        payId: selectedPay.id,
        payName: selectedPay.name,
        payIcon: selectedPay.icon,
        amount,
        note: document.getElementById('note').value
      }, 'POST');

      showResult(res, '✅ บันทึกสำเร็จ!', true);
      document.getElementById('amount').value = '';
      document.getElementById('note').value = '';
      setTimeout(() => location.href = 'index.html', 1200);
    } catch (err) {
      showResult(res, '❌ ' + err.message, false);
    }
  };
}

function showResult(el, msg, ok) {
  el.textContent = msg;
  el.className = 'result-msg ' + (ok ? 'ok' : 'err');
}

// ==================== SETTINGS PAGE ====================
async function initSettingsPage() {
  await loadSettings();
  document.getElementById('budgetMonth').value =
    new Date().toISOString().slice(0, 7);
}

async function loadSettings() {
  const cats = await callAPI('getCategories');
  const pays = await callAPI('getPayments');

  document.getElementById('catList').innerHTML = cats.map(c => `
    <div class="list-item">
      <div class="left">
        <span class="icon">${c.icon}</span>
        <span class="${c.active === false ? 'inactive' : ''}">
          ${c.name} · ฿${fmt(c.budget)}
        </span>
      </div>
      <div>
        <button class="btn-mini" onclick="editCat('${c.id}','${c.name}','${c.icon}',${c.budget})">✏️</button>
        <button class="btn-mini danger" onclick="delCat('${c.id}')">🗑️</button>
      </div>
    </div>
  `).join('');

  document.getElementById('payList').innerHTML = pays.map(p => `
    <div class="list-item">
      <div class="left">
        <span class="icon">${p.icon}</span>
        <span class="${p.active === false ? 'inactive' : ''}">${p.name}</span>
      </div>
      <div>
        <button class="btn-mini" onclick="editPay('${p.id}','${p.name}','${p.icon}')">✏️</button>
        <button class="btn-mini danger" onclick="delPay('${p.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function addCat() {
  const name = document.getElementById('catName').value.trim();
  const icon = document.getElementById('catIcon').value.trim() || '📌';
  const budget = parseFloat(document.getElementById('catBudget').value) || 0;
  if (!name) return alert('กรอกชื่อหมวดหมู่');
  await callAPI('addCategory', { name, icon, budget }, 'POST');
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = '';
  document.getElementById('catBudget').value = '';
  loadSettings();
}

async function editCat(id, name, icon, budget) {
  const newName = prompt('ชื่อใหม่:', name); if (!newName) return;
  const newIcon = prompt('ไอคอนใหม่:', icon) || icon;
  const newBudget = parseFloat(prompt('วงเงินใหม่:', budget)) || budget;
  await callAPI('updateCategory', { id, name: newName, icon: newIcon, budget: newBudget, active: true }, 'POST');
  loadSettings();
}

async function delCat(id) {
  if (!confirm('ยืนยันลบหมวดหมู่นี้?')) return;
  await callAPI('deleteCategory', { id }, 'POST');
  loadSettings();
}

async function addPay() {
  const name = document.getElementById('payName').value.trim();
  const icon = document.getElementById('payIcon').value.trim() || '💳';
  if (!name) return alert('กรอกชื่อประเภท');
  await callAPI('addPayment', { name, icon }, 'POST');
  document.getElementById('payName').value = '';
  document.getElementById('payIcon').value = '';
  loadSettings();
}

async function editPay(id, name, icon) {
  const newName = prompt('ชื่อใหม่:', name); if (!newName) return;
  const newIcon = prompt('ไอคอนใหม่:', icon) || icon;
  await callAPI('updatePayment', { id, name: newName, icon: newIcon, active: true }, 'POST');
  loadSettings();
}

async function delPay(id) {
  if (!confirm('ยืนยันลบประเภทนี้?')) return;
  await callAPI('deletePayment', { id }, 'POST');
  loadSettings();
}

async function saveBudget() {
  const ym = document.getElementById('budgetMonth').value;
  const total = parseFloat(document.getElementById('budgetAmount').value);
  if (!ym || !total) return alert('กรอกข้อมูลให้ครบ');
  await callAPI('setMonthlyBudget', { yearMonth: ym, totalBudget: total }, 'POST');
  alert('บันทึกงบประมาณแล้ว!');
}
