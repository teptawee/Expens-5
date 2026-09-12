/**
 * ============================================
 * App.js — Logic กลาง (Final)
 * ============================================
 */

// 🔧 ตั้งค่า API URL ของคุณตรงนี้
const API_URL = "https://script.google.com/macros/s/xxxxxxxxxxxxx/exec";

// ==================== UTILS ====================
const fmt = n => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number(n) || 0);

async function callAPI(action, data = null, method = 'GET') {
  let url = API_URL;
  let opts = { method: 'GET' };

  if (method === 'GET') {
    url += `?action=${action}`;
  } else {
    opts = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data })
    };
  }

  console.log('🔵 API Call:', action, opts.method);
  const res = await fetch(url, opts);
  const json = await res.json();
  console.log('🟢 API Response:', json);

  if (!json.ok) throw new Error(json.error || 'API Error');
  return json.data;
}

// ==================== DASHBOARD ====================
let CHART_INSTANCES = {};

function destroyAllCharts() {
  Object.keys(CHART_INSTANCES).forEach(k => {
    try { CHART_INSTANCES[k].destroy(); } catch(e) {}
  });
  CHART_INSTANCES = {};
}

async function loadDashboard() {
  try {
    const d = await callAPI('getDashboard');
    if (!d || typeof d !== 'object') throw new Error('ข้อมูล Dashboard ไม่ถูกต้อง');

    const summary = d.summary || { today: 0, week: 0, month: 0, year: 0 };
    const monthBudgetInfo = d.monthBudgetInfo || { totalBudget: 0, spent: 0, remain: 0 };

    document.getElementById('sumToday').textContent = '฿' + fmt(summary.today);
    document.getElementById('sumWeek').textContent = '฿' + fmt(summary.week);
    document.getElementById('sumMonth').textContent = '฿' + fmt(summary.month);
    document.getElementById('sumYear').textContent = '฿' + fmt(summary.year);

    const b = monthBudgetInfo;
    document.getElementById('budgetTotal').textContent = '฿' + fmt(b.totalBudget);
    document.getElementById('budgetSpent').textContent = '฿' + fmt(b.spent);
    document.getElementById('budgetRemain').textContent = '฿' + fmt(b.remain);
    const usedPercent = b.totalBudget > 0 ? (b.spent / b.totalBudget) * 100 : 0;
    document.getElementById('budgetBar').style.width = Math.min(100, usedPercent) + '%';

    // destroy chart เก่า + render ใหม่
    destroyAllCharts();
    renderCategoryChart(Array.isArray(d.byCategory) ? d.byCategory : []);
    renderPaymentChart(Array.isArray(d.byPayment) ? d.byPayment : []);
    renderDailyChart(Array.isArray(d.dailyCompare) ? d.dailyCompare : []);
    renderWeeklyChart(Array.isArray(d.weeklyCompare) ? d.weeklyCompare : []);
    renderMonthlyChart(Array.isArray(d.monthlyCompare) ? d.monthlyCompare : []);
    renderCategoryProgress(Array.isArray(d.byCategory) ? d.byCategory : []);
    renderRecent(Array.isArray(d.recentTx) ? d.recentTx : []);

  } catch (err) {
    console.error('Dashboard error:', err);
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
  const filtered = data.filter(d => Number(d.spent) > 0);
  if (!filtered.length) return;
  CHART_INSTANCES.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filtered.map(d => `${d.icon || ''} ${d.name || ''}`),
      datasets: [{
        data: filtered.map(d => Number(d.spent) || 0),
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
  const filtered = data.filter(d => Number(d.total) > 0);
  if (!filtered.length) return;
  CHART_INSTANCES.payment = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filtered.map(d => `${d.icon || ''} ${d.name || ''}`),
      datasets: [{
        data: filtered.map(d => Number(d.total) || 0),
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
  if (!ctx || !data.length) return;
  CHART_INSTANCES.daily = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label || ''),
      datasets: [{
        label: 'ค่าใช้จ่าย (บาท)',
        data: data.map(d => Number(d.amount) || 0),
        backgroundColor: 'rgba(206,147,216,0.75)',
        borderRadius: 10
      }]
    },
    options: { ...chartDefaults, responsive: true }
  });
}

function renderWeeklyChart(data) {
  const ctx = document.getElementById('chartWeekly');
  if (!ctx || !data.length) return;
  CHART_INSTANCES.weekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label || ''),
      datasets: [{
        label: 'บาท',
        data: data.map(d => Number(d.amount) || 0),
        backgroundColor: 'rgba(144,202,249,0.75)',
        borderRadius: 10
      }]
    },
    options: { ...chartDefaults, responsive: true }
  });
}

function renderMonthlyChart(data) {
  const ctx = document.getElementById('chartMonthly');
  if (!ctx || !data.length) return;
  CHART_INSTANCES.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.label || ''),
      datasets: [
        {
          label: 'ใช้ไป',
          data: data.map(d => Number(d.spent) || 0),
          borderColor: '#ce93d8',
          backgroundColor: 'rgba(206,147,216,0.25)',
          fill: true, tension: 0.35
        },
        {
          label: 'งบตั้งไว้',
          data: data.map(d => Number(d.budget) || 0),
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

// ==================== RECENT ====================
function renderRecent(list) {
  const el = document.getElementById('recentList');
  if (!el) return;
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
          <div class="sub">${t.date || ''} ${t.time || ''} · ${t.payIcon || ''} ${t.payName || ''} ${t.note ? '· ' + t.note : ''}</div>
        </div>
      </div>
      <div class="recent-amount">-฿${fmt(t.amount)}</div>
    </div>
  `).join('');
}

/**
 * ============================================
 * Category Progress Cards (Enhanced)
 * ============================================
 */

let CURRENT_CATS = [];
let PENDING_DELETE_ID = null;

const EMOJI_LIST = [
  '☕','🍜','🥤','🎰','🛍️','🚌','⛽','💊','🧴','📦','📌',
  '🍔','🍕','🍱','🍰','🍺','🍷','🧋','🥗',
  '🚗','🚕','🚙','🏍️','🚲','✈️','🚂',
  '💡','💧','🔥','📱','💻','🎮','🎧',
  '👕','👟','💄','💍','🎁','🌷','🐱','🐶'
];

const CAT_STYLE = {
  'ค่าอาหาร':        { bg: 'linear-gradient(135deg,#ffcc80,#ffb74d)', accent: '#ffb74d' },
  'ค่ากาแฟ':         { bg: 'linear-gradient(135deg,#b39ddb,#9575cd)', accent: '#9575cd' },
  'ค่าเครื่องดื่ม':   { bg: 'linear-gradient(135deg,#80cbc4,#4db6ac)', accent: '#4db6ac' },
  'ค่าหวย':          { bg: 'linear-gradient(135deg,#ef9a9a,#e57373)', accent: '#e57373' },
  'ค่าช้อปปิ้ง':      { bg: 'linear-gradient(135deg,#f8bbd0,#f48fb1)', accent: '#f48fb1' },
  'ค่ายานพาหนะ':      { bg: 'linear-gradient(135deg,#90caf9,#64b5f6)', accent: '#64b5f6' },
  'ค่าน้ำมันรถ':      { bg: 'linear-gradient(135deg,#80deea,#4dd0e1)', accent: '#4dd0e1' },
  'ค่ายารักษาโรค':    { bg: 'linear-gradient(135deg,#a5d6a7,#81c784)', accent: '#81c784' },
  'ค่าของใช้ส่วนตัว': { bg: 'linear-gradient(135deg,#ce93d8,#ba68c8)', accent: '#ba68c8' },
  'ค่าของใช้จำเป็น':  { bg: 'linear-gradient(135deg,#81d4fa,#4fc3f7)', accent: '#4fc3f7' },
  'ค่าอื่นๆ':         { bg: 'linear-gradient(135deg,#bcaaa4,#a1887f)', accent: '#a1887f' }
};

function getCatStyle(name) {
  return CAT_STYLE[name] || {
    bg: 'linear-gradient(135deg,#e0e0e0,#bdbdbd)',
    accent: '#bdbdbd'
  };
}

function renderCategoryProgress(cats) {
  const el = document.getElementById('categoryProgress');
  if (!el) return;

  CURRENT_CATS = cats || [];

  if (!CURRENT_CATS.length) {
    el.innerHTML = `
      <div class="cat-empty">
        <span class="emoji">📭</span>
        ยังไม่มีหมวดหมู่ — กด "➕ เพิ่มหมวดหมู่" เพื่อเริ่มต้น
      </div>`;
    return;
  }

  el.innerHTML = CURRENT_CATS.map(c => catCardHTML(c)).join('');
}

function catCardHTML(c) {
  const style = getCatStyle(c.name);
  const percent = Number(c.percent) || 0;
  const barColor = percent > 50 ? '#66bb6a' : percent > 20 ? '#ffb74d' : '#ef5350';
  const percentColor = percent > 50 ? '#2e7d32' : percent > 20 ? '#e65100' : '#c62828';

  return `
    <div class="cat-card" style="--cat-accent:${style.accent}40">
      <div class="cat-card-header">
        <div class="cat-card-icon" style="background:${style.bg}">${c.icon || '📌'}</div>
        <div class="cat-card-info">
          <div class="name">${c.name || '-'}</div>
          <div class="sub">คงเหลือ ${percent}%</div>
        </div>
        <div class="cat-card-percent" style="color:${percentColor}">${percent.toFixed(1)}%</div>
      </div>

      <div class="cat-stats">
        <div class="cat-stat spent">
          <div class="stat-label">🟢 ใช้ไป</div>
          <div class="stat-value">฿${fmt(c.spent)}</div>
        </div>
        <div class="cat-stat budget">
          <div class="stat-label">🎯 วงเงิน</div>
          <div class="stat-value">฿${fmt(c.budget)}</div>
        </div>
        <div class="cat-stat remain">
          <div class="stat-label">💰 คงเหลือ</div>
          <div class="stat-value">฿${fmt(c.remain)}</div>
        </div>
      </div>

      <div class="cat-card-bar">
        <div class="cat-card-bar-fill" style="width:${percent}%;background:${barColor}"></div>
      </div>

      <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">
        <button class="cat-action-btn edit" onclick="openCategoryModal('edit','${c.id}')" title="แก้ไข">✏️</button>
        <button class="cat-action-btn add" onclick="openCategoryModal('add')" title="เพิ่มหมวดใหม่">➕</button>
        <button class="cat-action-btn list" onclick="openCatTxModal('${c.id}')" title="ดูรายการ">📋</button>
        <button class="cat-action-btn" onclick="askDeleteCat('${c.id}','${c.name}')" title="ลบ" style="background:linear-gradient(135deg,#ffcdd2,#ef9a9a);border-color:rgba(239,154,154,0.6)">🗑️</button>
      </div>
    </div>
  `;
}

// ========== CATEGORY MODAL ==========
function openCategoryModal(mode, id) {
  const modal = document.getElementById('categoryModal');
  const emojiPicker = document.getElementById('emojiPicker');

  // สร้าง emoji picker ถ้ายังไม่มี
  if (!emojiPicker.children.length) {
    emojiPicker.innerHTML = EMOJI_LIST.map(e =>
      `<button type="button" class="emoji-btn" data-emoji="${e}">${e}</button>`
    ).join('');

    emojiPicker.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.onclick = () => {
        emojiPicker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('catModalIconInput').value = btn.dataset.emoji;
      };
    });
  }

  if (mode === 'edit' && id) {
    const cat = CURRENT_CATS.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('catModalTitle').textContent = 'แก้ไขหมวดหมู่';
    document.getElementById('catModalIcon').textContent = '✏️';
    document.getElementById('catModalId').value = cat.id;
    document.getElementById('catModalName').value = cat.name;
    document.getElementById('catModalIconInput').value = cat.icon;
    document.getElementById('catModalBudget').value = cat.budget;

    emojiPicker.querySelectorAll('.emoji-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.emoji === cat.icon);
    });
  } else {
    document.getElementById('catModalTitle').textContent = 'เพิ่มหมวดหมู่ใหม่';
    document.getElementById('catModalIcon').textContent = '➕';
    document.getElementById('catModalId').value = '';
    document.getElementById('catModalName').value = '';
    document.getElementById('catModalIconInput').value = '';
    document.getElementById('catModalBudget').value = '';

    emojiPicker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  setTimeout(() => document.getElementById('catModalName').focus(), 200);
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveCategoryModal() {
  const id = document.getElementById('catModalId').value;
  const name = document.getElementById('catModalName').value.trim();
  const icon = document.getElementById('catModalIconInput').value.trim() || '📌';
  const budget = parseFloat(document.getElementById('catModalBudget').value) || 0;

  if (!name) {
    alert('กรุณากรอกชื่อหมวดหมู่');
    return;
  }

  try {
    if (id) {
      await callAPI('updateCategory', {
        id, name, icon, budget, active: true
      }, 'POST');
    } else {
      await callAPI('addCategory', { name, icon, budget }, 'POST');
    }
    closeCategoryModal();
    await loadDashboard();
  } catch (err) {
    alert('บันทึกไม่ได้: ' + err.message);
  }
}

// ========== DELETE ==========
function askDeleteCat(id, name) {
  PENDING_DELETE_ID = id;
  document.getElementById('confirmText').textContent =
    `คุณต้องการลบหมวด "${name}" ใช่หรือไม่?\n(รายการเก่าจะยังคงอยู่)`;
  document.getElementById('confirmModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  PENDING_DELETE_ID = null;
  document.getElementById('confirmModal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function confirmDelete() {
  if (!PENDING_DELETE_ID) return;
  const id = PENDING_DELETE_ID;
  closeConfirm();

  try {
    await callAPI('deleteCategory', { id }, 'POST');
    await loadDashboard();
  } catch (err) {
    alert('ลบไม่ได้: ' + err.message);
  }
}

// ========== CATEGORY TRANSACTIONS VIEW ==========
async function openCatTxModal(catId) {
  const modal = document.getElementById('catTxModal');
  const listEl = document.getElementById('catTxList');
  const cat = CURRENT_CATS.find(c => c.id === catId);
  if (!cat) return;

  document.getElementById('catTxIcon').textContent = cat.icon || '📋';
  document.getElementById('catTxTitle').textContent = cat.name;
  document.getElementById('catTxSubtitle').textContent =
    `ใช้ไป ฿${fmt(cat.spent)} / งบ ฿${fmt(cat.budget)}`;

  listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#7e7e94">⏳ กำลังโหลด...</div>';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const data = await callAPI(`getTransactionsList&categoryId=${catId}&from=${ym}-01`);

    const allTx = [];
    (data.groups || []).forEach(g => {
      (g.items || []).forEach(t => allTx.push(t));
    });

    if (!allTx.length) {
      listEl.innerHTML = `
        <div class="cat-empty">
          <span class="emoji">📭</span>
          ยังไม่มีรายการในเดือนนี้
        </div>`;
      return;
    }

    listEl.innerHTML = allTx.map(t => `
      <div class="cat-tx-item">
        <div class="cat-tx-left">
          <span class="cat-tx-pay-icon">${t.payIcon || '💳'}</span>
          <div class="cat-tx-info">
            <div class="note">${t.note || t.categoryName || '-'}</div>
            <div class="date">${formatThaiDateShort(t.date)} · ${t.payName || ''}</div>
          </div>
        </div>
        <div class="cat-tx-amount">฿${fmt(t.amount)}</div>
      </div>
    `).join('');

  } catch (err) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:30px;color:#c62828">
        ❌ ${err.message}
      </div>`;
  }
}

function closeCatTxModal() {
  document.getElementById('catTxModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function formatThaiDateShort(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()+543).slice(-2)}`;
}

// ========== Modal Handlers ==========
document.addEventListener('DOMContentLoaded', () => {
  ['categoryModal','confirmModal','catTxModal'].forEach(id => {
    const m = document.getElementById(id);
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          if (id === 'categoryModal') closeCategoryModal();
          else if (id === 'confirmModal') closeConfirm();
          else if (id === 'catTxModal') closeCatTxModal();
        }
      });
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCategoryModal();
    closeConfirm();
    closeCatTxModal();
  }
});

// ==================== ADD PAGE ====================
let selectedCat = null;
let selectedPay = null;

async function initAddPage() {
  try {
    const catData = await callAPI('getCategories');
    const payData = await callAPI('getPayments');

    const cats = (Array.isArray(catData) ? catData : []).filter(c => c.active !== false);
    const pays = (Array.isArray(payData) ? payData : []).filter(p => p.active !== false);

    document.getElementById('categoryPicker').innerHTML = cats.length
      ? cats.map(c => `
          <div class="icon-option" data-id="${c.id}" data-name="${c.name}" data-icon="${c.icon}">
            <span class="emoji">${c.icon}</span>${c.name}
          </div>
        `).join('')
      : '<p style="color:#7e7e94;padding:8px">ไม่พบหมวดหมู่</p>';

    document.getElementById('paymentPicker').innerHTML = pays.length
      ? pays.map(p => `
          <div class="icon-option" data-id="${p.id}" data-name="${p.name}" data-icon="${p.icon}">
            <span class="emoji">${p.icon}</span>${p.name}
          </div>
        `).join('')
      : '<p style="color:#7e7e94;padding:8px">ไม่พบประเภทชำระ</p>';

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

  } catch (err) {
    console.error('Init add page error:', err);
    alert('โหลดข้อมูลไม่ได้: ' + err.message);
  }
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
  try {
    const catData = await callAPI('getCategories');
    const payData = await callAPI('getPayments');

    const cats = Array.isArray(catData) ? catData : [];
    const pays = Array.isArray(payData) ? payData : [];

    document.getElementById('catList').innerHTML = cats.length
      ? cats.map(c => `
          <div class="list-item">
            <div class="left">
              <span class="icon">${c.icon}</span>
              <span class="${c.active === false ? 'inactive' : ''}">
                ${c.name} · ฿${fmt(c.budget)}
              </span>
            </div>
            <div>
              <button class="btn-mini" onclick="editCat('${c.id}','${c.name}','${c.icon}',${Number(c.budget) || 0})">✏️</button>
              <button class="btn-mini danger" onclick="delCat('${c.id}')">🗑️</button>
            </div>
          </div>
        `).join('')
      : '<p style="color:#7e7e94;padding:8px">ไม่มีหมวดหมู่</p>';

    document.getElementById('payList').innerHTML = pays.length
      ? pays.map(p => `
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
        `).join('')
      : '<p style="color:#7e7e94;padding:8px">ไม่มีประเภทชำระ</p>';

  } catch (err) {
    console.error('Load settings error:', err);
    alert('โหลดข้อมูลไม่ได้: ' + err.message);
  }
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
