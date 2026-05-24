// Auth & Navigation
let currentUser = null;
let currentPage = 'dashboard';

function initApp() {
  const s = sessionStorage.getItem('pmdss_user');
  if (!s) { window.location.href = 'index.html'; return; }
  currentUser = JSON.parse(s);
  renderSidebar();
  renderTopbar();
  navigateTo('dashboard');
  document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
}

function logout() {
  sessionStorage.removeItem('pmdss_user');
  window.location.href = 'index.html';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function getMenuItems() {
  const r = currentUser.Role;
  const items = [];
  if (r === 'Production Manager') {
    items.push({ id:'dashboard', icon:'fa-gauge-high', label:'Dashboard' });
    items.push({ id:'production-entry', icon:'fa-keyboard', label:'Üretim Verisi Girişi' });
    items.push({ id:'maintenance-plans', icon:'fa-clipboard-list', label:'Bakım Planları' });
    items.push({ id:'work-orders', icon:'fa-file-lines', label:'İş Emirleri' });
    items.push({ id:'reports', icon:'fa-chart-bar', label:'Raporlar' });
  } else if (r === 'Technician') {
    items.push({ id:'dashboard', icon:'fa-list-check', label:'İş Emirlerim' });
    items.push({ id:'maintenance-log', icon:'fa-pen-to-square', label:'Bakım Log Girişi' });
    items.push({ id:'alerts', icon:'fa-bell', label:'Bildirimler' });
  } else if (r === 'Maintenance Manager') {
    items.push({ id:'dashboard', icon:'fa-gauge-high', label:'Dashboard' });
    items.push({ id:'work-orders', icon:'fa-file-lines', label:'İş Emirleri' });
    items.push({ id:'technician-perf', icon:'fa-users', label:'Teknisyen Performansı' });
    items.push({ id:'alert-mgmt', icon:'fa-bell', label:'Alert Yönetimi' });
  } else if (r === 'Senior Management') {
    items.push({ id:'dashboard', icon:'fa-gauge-high', label:'Executive Dashboard' });
    items.push({ id:'reports', icon:'fa-file-pdf', label:'Raporlar' });
  } else if (r === 'Admin') {
    items.push({ id:'dashboard', icon:'fa-gauge-high', label:'Dashboard' });
    items.push({ id:'users', icon:'fa-users-gear', label:'Kullanıcı Yönetimi' });
    items.push({ id:'alert-config', icon:'fa-sliders', label:'Alert Eşikleri' });
    items.push({ id:'audit-log', icon:'fa-clock-rotate-left', label:'Audit Log' });
  }
  return items;
}

function renderSidebar() {
  const menu = getMenuItems();
  const initials = currentUser.FullName.split(' ').map(n=>n[0]).join('');
  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="fas fa-industry"></i></div>
      <span>PM-DSS</span>
    </div>
    <ul class="sidebar-menu">
      <li class="menu-label">Ana Menü</li>
      ${menu.map(m => `<li><a href="#" data-page="${m.id}" onclick="navigateTo('${m.id}');return false;" class="${m.id==='dashboard'?'active':''}"><i class="fas ${m.icon}"></i>${m.label}</a></li>`).join('')}
    </ul>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${currentUser.FullName}</div>
          <div class="user-role">${currentUser.Role}</div>
        </div>
        <button onclick="logout()" class="btn-icon" style="border:none;background:none;color:rgba(255,255,255,.5);"><i class="fas fa-right-from-bracket"></i></button>
      </div>
    </div>`;
}

function renderTopbar() {
  const unack = DEMO_ALERTS.filter(a => !a.AcknowledgedBy).length;
  document.getElementById('topbar').innerHTML = `
    <div class="topbar-left">
      <button class="hamburger" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
      <h4 id="pageTitle">Dashboard</h4>
    </div>
    <div class="topbar-right">
      <button class="btn-icon" onclick="navigateTo('${currentUser.Role==='Technician'?'alerts':'alert-mgmt'}')" title="Bildirimler">
        <i class="fas fa-bell"></i>
        ${unack > 0 ? `<span class="notification-badge">${unack}</span>` : ''}
      </button>
      <button class="btn-icon" onclick="logout()" title="Çıkış"><i class="fas fa-right-from-bracket"></i></button>
    </div>`;
}

function navigateTo(page) {
  currentPage = page;
  // Update sidebar active
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  // Update title
  const titles = { dashboard:'Dashboard', 'production-entry':'Üretim Verisi Girişi', 'maintenance-plans':'Bakım Planları', 'work-orders':'İş Emirleri', reports:'Raporlar', 'maintenance-log':'Bakım Log Girişi', alerts:'Bildirimler', 'technician-perf':'Teknisyen Performansı', 'alert-mgmt':'Alert Yönetimi', users:'Kullanıcı Yönetimi', 'alert-config':'Alert Eşikleri', 'audit-log':'Audit Log' };
  const t = document.getElementById('pageTitle');
  if (t) t.textContent = titles[page] || 'Dashboard';
  renderPage(page);
}

async function renderPage(page) {
  const main = document.getElementById('mainContent');
  main.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--accent)"></i><p class="mt-2">Yükleniyor...</p></div>';
  await loadData();
  const r = currentUser.Role;
  if (page === 'dashboard') {
    if (r === 'Production Manager') renderPMDashboard(main);
    else if (r === 'Technician') renderTechWO(main);
    else if (r === 'Maintenance Manager') renderMMDashboard(main);
    else if (r === 'Senior Management') renderExecDashboard(main);
    else if (r === 'Admin') renderAdminDashboard(main);
  } else if (page === 'production-entry') renderProductionEntry(main);
  else if (page === 'maintenance-plans') renderMaintenancePlans(main);
  else if (page === 'work-orders') renderWorkOrders(main);
  else if (page === 'reports') renderReports(main);
  else if (page === 'maintenance-log') renderMaintenanceLogForm(main);
  else if (page === 'alerts') renderAlerts(main);
  else if (page === 'technician-perf') renderTechPerf(main);
  else if (page === 'alert-mgmt') renderAlertMgmt(main);
  else if (page === 'users') renderUserMgmt(main);
  else if (page === 'alert-config') renderAlertConfig(main);
  else if (page === 'audit-log') renderAuditLog(main);
  else main.innerHTML = '<p>Sayfa bulunamadı.</p>';
}

function showToast(msg, type='success') {
  const c = document.getElementById('toastContainer');
  const id = 'toast-' + Date.now();
  c.innerHTML = `<div id="${id}" class="toast show align-items-center text-bg-${type} border-0" role="alert" style="border-radius:10px;">
    <div class="d-flex"><div class="toast-body">${msg}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
  setTimeout(() => { const el = document.getElementById(id); if(el) el.remove(); }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initApp();
});
