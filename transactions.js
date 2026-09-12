/**
 * ============================================
 * Transactions List Page
 * ============================================
 */

let CATS = [];
let PAYS = [];
let CURRENT_RANGE = 'all';

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  document.getElementById('filterFrom').value = toISO(first);
  document.getElementById('filterTo').value = toISO(now);

  document.querySelectorAll('.quick-ranges .chip').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.quick-ranges .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_RANGE = btn.dataset.range;
      applyQuickRange(CURRENT_RANGE);
      loadTransactions();
    };
  });

  document.getElementById('filterFrom').onchange = loadTransactions;
  document.getElementById('filterTo').onchange = loadTransactions;
  document.getElementById('filterCat').onchange = loadTransactions;

  loadTransactions();
});

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function applyQuickRange(range) {
  const from = document.getElementById('filterFrom');
  const to = document.getElementById('filterTo');
  const now = new Date();

  if (range === 'all') {
    from.value = '';
    to.value = '';
  } else {
    const days = parseInt(range);
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    from.value = toISO(start);
    to.value = toISO(now);
  }
}

// ========== LOAD ==========
async function loadTransactions() {
  const el = document.getElementById('txList');
  el.innerHTML = '<div class="glass-card" style="text-align:center;padding:40px">⏳ กำลังโหลด...</div>';

  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  const cat = document.getElementById('filterCat').value;

  try {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (cat && cat !== 'all') params.set('categoryId', cat);

    const data = await callAPI('getTransactionsList&' + params.toString());

    CATS = data.categories;
    PAYS = data.payments;

    const sel = document.getElementById('filterCat');
    const cur = sel.value;
    sel.innerHTML = '<option value="all">🌈 ทุกหมวดหมู่</option>' +
      CATS.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    sel.value = cur || 'all';

    document.getElementById('sumTotal').textContent = '฿' + fmt(data.total);
    document.getElementById('sumCount').textContent = data.count;

    renderGroups(data.groups);

  } catch (err) {
    el.innerHTML = `<div class="glass-card" style="text-align:center;padding:40px;color:#c62828">❌ ${err.message}</div>`;
  }
}

// ========== RENDER ==========
function renderGroups(groups) {
  const el = document.getElementById('txList');
  if (!groups.length) {
    el.innerHTML = '<div class="glass-card" style="text-align:center;padding:40px;color:#7e7e94">📭 ไม่พบรายการ</div>';
    return;
  }

  el.innerHTML = groups.map(g => `
    <div class="date-group">
      <div class="date-header">
        <div class="date-left">
          <span class="date-icon">📅</span>
          <span class="date-text">${formatThaiDate(g.date)}</span>
        </div>
        <div class="date-total">฿${fmt(g.total)}</div>
      </div>

      ${g.items.map(t => txItem(t)).join('')}
    </div>
  `).join('');
}

function txItem(t) {
  return `
    <div class="glass-card tx-item" data-id="${t.id}">
      <div class="tx-bar" style="background:${getBarColor(t.categoryName)}"></div>
      <div class="tx-icon" style="background:${getIconBg(t.categoryName)}">${t.categoryIcon || '📌'}</div>
      <div class="tx-body">
        <div class="tx-line1">
          <span class="tx-cat">${t.categoryName}</span>
          <span class="pay-chip">${t.payIcon || ''} ${t.payName || ''}</span>
        </div>
        <div class="tx-note">🍴 ${t.note || '-'}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">฿${fmt(t.amount)}</div>
        <div class="tx-actions">
          <button class="btn-icon" onclick="openEdit('${t.id}')" title="แก้ไข">✏️</button>
          <button class="btn-icon danger" onclick="delTx('${t.id}')" title="ลบ">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

// ========== COLORS ==========
const CAT_COLORS = {
  'ค่าอาหาร':          { bar: '#ffb300', bg: '#ffe082' },
  'ค่ากาแฟ':           { bar: '#7e57c2', bg: '#b39ddb' },
  'ค่าเครื่องดื่ม':     { bar: '#26a69a', bg: '#80cbc4' },
  'ค่าหวย':            { bar: '#ef5350', bg: '#ef9a9a' },
  'ค่าช้อปปิ้ง':        { bar: '#ec407a', bg: '#f8bbd0' },
  'ค่ายานพาหนะ':        { bar: '#42a5f5', bg: '#90caf9' },
  'ค่าน้ำมันรถ':        { bar: '#26c6da', bg: '#80deea' },
  'ค่ายารักษาโรค':      { bar: '#66bb6a', bg: '#a5d6a7' },
  'ค่าของใช้ส่วนตัว':   { bar: '#ab47bc', bg: '#ce93d8' },
  'ค่าของใช้จำเป็น':    { bar: '#29b6f6', bg: '#81d4fa' },
  'ค่าอื่นๆ':           { bar: '#8d6e63', bg: '#bcaaa4' }
};

function getBarColor(name) {
  return (CAT_COLORS[name] || { bar: '#bdbdbd' }).bar;
}
function getIconBg(name) {
  return (CAT_COLORS[name] || { bg: '#e0e0e0' }).bg;
}

// ========== THAI DATE ==========
const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];
const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

function formatThaiDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const day = THAI_DAYS[d.getDay()];
  const date = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `วัน${day}ที่ ${date} ${month} ${year}`;
}

// ========== EDIT ==========
async function openEdit(id) {
  try {
    const t = await callAPI('getTransactionById&id=' + encodeURIComponent(id));

    document.getElementById('editId').value = t.id;
    document.getElementById('editDate').value = t.dateStr;
    document.getElementById('editAmount').value = t.amount;
    document.getElementById('editNote').value = t.note || '';

    const cs = document.getElementById('editCat');
    cs.innerHTML = CATS.map(c =>
      `<option value="${c.id}" ${c.id === t.categoryId ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');

    const ps = document.getElementById('editPay');
    ps.innerHTML = PAYS.map(p =>
      `<option value="${p.id}" ${p.id === t.payId ? 'selected' : ''}>${p.icon} ${p.name}</option>`
    ).join('');

    document.getElementById('editModal').classList.remove('hidden');
  } catch (err) {
    alert('โหลดข้อมูลไม่ได้: ' + err.message);
  }
}

function closeEdit() {
  document.getElementById('editModal').classList.add('hidden');
}

async function saveEdit() {
  const catId = document.getElementById('editCat').value;
  const payId = document.getElementById('editPay').value;
  const catObj = CATS.find(c => c.id === catId);
  const payObj = PAYS.find(p => p.id === payId);

  const payload = {
    id: document.getElementById('editId').value,
    date: document.getElementById('editDate').value,
    categoryId: catId,
    categoryName: catObj.name,
    categoryIcon: catObj.icon,
    payId: payId,
    payName: payObj.name,
    payIcon: payObj.icon,
    amount: parseFloat(document.getElementById('editAmount').value),
    note: document.getElementById('editNote').value
  };

  if (!payload.amount || payload.amount <= 0) return alert('กรอกจำนวนเงิน');

  try {
    await callAPI('updateTransaction', payload, 'POST');
    closeEdit();
    loadTransactions();
  } catch (err) {
    alert('บันทึกไม่ได้: ' + err.message);
  }
}

// ========== DELETE ==========
async function delTx(id) {
  if (!confirm('ยืนยันลบรายการนี้?')) return;
  try {
    await callAPI('deleteTransaction', { id }, 'POST');
    loadTransactions();
  } catch (err) {
    alert('ลบไม่ได้: ' + err.message);
  }
}
