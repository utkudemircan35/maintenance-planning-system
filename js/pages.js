// PM-DSS Pages — Supabase çift yönlü entegrasyon

// ─── Technician Work Orders ───────────────────────────────────────────
function renderTechWO(el) {
  const myWO = DEMO_WORK_ORDERS.filter(w => String(w.technician) === String(currentUser.id) || w.technician === currentUser.full_name);
  el.innerHTML = `<div class="row g-3">${myWO.length ? myWO.map(w => {
    const m = getMachineById(w.machine_id);
    return `<div class="col-md-6 fade-in"><div class="wo-card">
      <div class="wo-header"><span class="wo-id">${w.id}</span><span class="badge bg-${getPriorityBadge(w.priority)} badge-pill">${w.priority}</span></div>
      <div class="wo-detail"><i class="fas fa-cog"></i>${m ? m.machine_name : w.machine_id}</div>
      <div class="wo-detail"><i class="fas fa-location-dot"></i>${m ? m.location : '-'}</div>
      <div class="wo-detail"><i class="fas fa-calendar"></i>Planlanan: ${formatDate(w.date)}</div>
      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-accent btn-sm flex-fill" onclick="startWO('${w.id}')"><i class="fas fa-play me-1"></i>Başla</button>
        <button class="btn btn-outline-accent btn-sm flex-fill" onclick="openLogForm('${w.id}')"><i class="fas fa-pen me-1"></i>Log Gir</button>
      </div></div></div>`;
  }).join('') : '<div class="col-12"><div class="panel"><div class="panel-body text-center py-5"><i class="fas fa-check-circle fa-3x mb-3" style="color:var(--green);"></i><h5>Tüm iş emirleri tamamlandı!</h5></div></div></div>'}</div>`;
}

async function startWO(id) {
  await logAudit('İş emri başlatıldı: ' + id);
  showToast('İş emri başlatıldı: ' + id);
  await loadData();
  await renderPage(currentPage);
}

function openLogForm(woId) {
  currentPage = 'maintenance-log';
  document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.toggle('active', a.dataset.page === 'maintenance-log'));
  renderMaintenanceLogForm(document.getElementById('mainContent'), woId);
}

// ─── Maintenance Log Form ─────────────────────────────────────────────
function renderMaintenanceLogForm(el, preWO) {
  const myWO = DEMO_WORK_ORDERS.filter(w => String(w.technician) === String(currentUser.id) || currentUser.role !== 'Technician');
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-pen-to-square me-2" style="color:var(--accent)"></i>Bakım Log Kaydı</h5></div>
  <div class="panel-body"><form class="form-modern" onsubmit="submitLog(event)">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">İş Emri</label><select class="form-select" id="logWO" required>${myWO.map(w => `<option value="${w.id}" ${preWO === w.id ? 'selected' : ''}>${w.id} - ${getMachineById(w.machine_id)?.machine_name || w.machine_id}</option>`).join('')}</select></div>
      <div class="col-md-6"><label class="form-label">Bakım Tipi</label><select class="form-select" id="logType" required><option>Preventive</option><option>Corrective</option><option>Predictive</option></select></div>
      <div class="col-md-6"><label class="form-label">Süre (Saat)</label><input type="number" class="form-control" id="logDuration" step="0.5" min="0.5" required></div>
      <div class="col-12"><label class="form-label">Yapılan İşlemler</label><textarea class="form-control" id="logActions" rows="3" required placeholder="Yapılan bakım işlemlerini açıklayın..."></textarea></div>
      <div class="col-12"><button type="submit" class="btn btn-accent"><i class="fas fa-save me-2"></i>Kaydet</button></div>
    </div></form></div></div>`;
}

async function submitLog(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const ogHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...'; btn.disabled = true;
  const woId = document.getElementById('logWO').value;
  const wo = DEMO_WORK_ORDERS.find(w => String(w.id) === String(woId));
  const newLog = {
    machine_id: wo ? parseInt(wo.machine_id) : null,
    technician_id: parseInt(currentUser.id),
    maintenance_date: new Date().toISOString().split('T')[0],
    maintenance_type: document.getElementById('logType').value,
    duration_hours: parseFloat(document.getElementById('logDuration').value),
    description: document.getElementById('logActions').value
  };
  const success = await db.insert('maintenance_records', [newLog]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if (success) {
    await logAudit('Bakım log kaydı oluşturuldu — ' + newLog.maintenance_type + ' / ' + newLog.duration_hours + 'h');
    showToast('Bakım log kaydı oluşturuldu!');
    await loadData();
    navigateTo('dashboard');
  } else {
    showToast('Kayıt başarısız!', 'danger');
  }
}

// ─── Alerts ───────────────────────────────────────────────────────────
function renderAlerts(el) {
  const alerts = DEMO_ALERTS;
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--accent)"></i>Bildirimler</h5></div>
  <div class="panel-body">${alerts.length ? alerts.map(a => {
    const m = getMachineById(a.machine_id);
    const sev = a.alert_type === 'critical' ? 'Critical' : a.alert_type === 'warning' ? 'High' : 'Medium';
    return `<div class="alert-item"><div class="alert-dot ${sev.toLowerCase()}"></div>
    <div style="flex:1"><div style="font-weight:600;font-size:13px;">${m ? m.machine_name : a.machine_id} — ${a.alert_type}</div>
    <div style="font-size:12px;color:var(--text-muted);">Severity: ${sev} ${a.alert_message ? '| Değer: ' + a.alert_message : ''}</div>
    <div style="font-size:11px;color:var(--text-muted);">${formatDateTime(a.alert_date)}</div></div>
    ${a.is_read ? `<span class="badge bg-success badge-pill">Onaylandı</span>` : `<button class="btn btn-sm btn-accent" onclick="ackAlert('${a.id}')"><i class="fas fa-check me-1"></i>Onayla</button>`}
    </div>`;
  }).join('') : '<p class="text-muted mb-0">Bildirim yok.</p>'}</div></div>`;
}

async function ackAlert(id) {
  const success = await db.update('notifications', { is_read: true }, 'id', id);
  if (success) {
    await logAudit('Alert onaylandı: ' + id);
    showToast('Alert onaylandı.');
    await loadData();
    await renderPage(currentPage);
    renderTopbar();
  } else {
    showToast('Onaylama başarısız!', 'danger');
  }
}

// ─── Production Entry ─────────────────────────────────────────────────
function renderProductionEntry(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-keyboard me-2" style="color:var(--accent)"></i>Üretim Verisi Girişi</h5></div>
  <div class="panel-body"><form class="form-modern" onsubmit="submitProduction(event)">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">Makine</label><select class="form-select" id="prodMachine" required>${DEMO_MACHINES.filter(m => m.status?.toLowerCase() === 'active').map(m => `<option value="${m.id}">${m.machine_name} (${m.machine_code})</option>`).join('')}</select></div>
      <div class="col-md-6"><label class="form-label">Vardiya Tarihi</label><input type="date" class="form-control" id="prodDate" required></div>
      <div class="col-md-4"><label class="form-label">Üretim Hacmi (adet)</label><input type="number" class="form-control" id="prodVolume" min="0" required></div>
      <div class="col-md-4"><label class="form-label">Çalışma Saati</label><input type="number" class="form-control" id="prodHours" step="0.5" min="0" max="8" required></div>
      <div class="col-12"><button type="submit" class="btn btn-accent"><i class="fas fa-save me-2"></i>Kaydet</button></div>
    </div></form></div></div>`;
  document.getElementById('prodDate').valueAsDate = new Date();
}

async function submitProduction(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const ogHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...'; btn.disabled = true;
  const mid = parseInt(document.getElementById('prodMachine').value);
  const m = getMachineById(mid);
  const hours = parseFloat(document.getElementById('prodHours').value);
  const vol = parseInt(document.getElementById('prodVolume').value);
  const util = m ? Math.min(100, (vol / (100 * (hours / 8))) * 100) : 75;
  const newProd = {
    machine_id: mid,
    production_date: document.getElementById('prodDate').value,
    runtime_hours: hours,
    capacity_usage: +util.toFixed(1),
    production_quantity: vol
  };
  const success = await db.insert('production_data', [newProd]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if (success) {
    await logAudit('Üretim verisi girildi — Makine ID: ' + mid + ', Miktar: ' + vol);
    showToast('Üretim verisi kaydedildi!');
    await loadData();
    e.target.reset();
    document.getElementById('prodDate').valueAsDate = new Date();
  } else {
    showToast('Kayıt başarısız!', 'danger');
  }
}

// ─── Maintenance Plans ────────────────────────────────────────────────
function renderMaintenancePlans(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-clipboard-list me-2" style="color:var(--accent)"></i>Bakım Planları</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Plan ID</th><th>Makine</th><th>Tip</th><th>Risk</th><th>Tarih</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
  ${DEMO_MAINTENANCE_PLANS.map(p => {
    const m = getMachineById(p.machine_id);
    const risk = p.risk_score || (m ? RISK_SCORES[m.id] : 0);
    return `<tr>
      <td><strong>${p.id}</strong></td><td>${m ? m.machine_name : p.machine_id}</td>
      <td><span class="badge bg-${p.type === 'Corrective' ? 'danger' : p.type === 'Predictive' ? 'info' : 'success'} badge-pill">${p.type || '-'}</span></td>
      <td><span style="color:${getRiskColor(risk)};font-weight:700;">${risk}</span></td>
      <td>${formatDate(p.planned_date)}</td>
      <td><span class="badge bg-${getStatusBadge(p.status)} badge-pill">${p.status}</span></td>
     <td>${['planned','pending'].includes(p.status?.toLowerCase()) ? 
  `<button class="btn btn-sm btn-accent me-1" onclick="approvePlan('${p.id}')"><i class="fas fa-check"></i></button>
   <button class="btn btn-sm btn-outline-secondary" onclick="postponePlan('${p.id}')"><i class="fas fa-clock"></i></button>` 
  : '-'}</td>
    </tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}

// ─── Work Orders ──────────────────────────────────────────────────────
function renderWOTable(orders) {
  if (!orders.length) return '<p class="text-muted mb-0">İş emri bulunamadı.</p>';
  return `<div class="table-responsive"><table class="table-modern"><thead><tr><th>WO ID</th><th>Makine</th><th>Teknisyen</th><th>Öncelik</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>
  ${orders.map(w => {
    const m = getMachineById(w.machine_id);
    return `<tr>
      <td><strong>${w.id}</strong></td><td>${m ? m.machine_name : w.machine_id}</td><td>${w.technician || '-'}</td>
      <td><span class="badge bg-${getPriorityBadge(w.priority)} badge-pill">${w.priority}</span></td>
      <td>${formatDate(w.date)}</td>
      <td><span class="badge bg-primary badge-pill">Açık</span></td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderWorkOrders(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-file-lines me-2" style="color:var(--accent)"></i>İş Emirleri</h5>
  <button class="btn btn-accent btn-sm" data-bs-toggle="modal" data-bs-target="#woModal"><i class="fas fa-plus me-1"></i>Yeni İş Emri</button></div>
  <div class="panel-body">${renderWOTable(DEMO_WORK_ORDERS)}</div></div>
  <div class="modal fade" id="woModal"><div class="modal-dialog"><div class="modal-content" style="border-radius:var(--radius);border:none;">
    <div class="modal-header" style="border-bottom:1px solid var(--border);"><h5 class="modal-title">Yeni İş Emri</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><form class="form-modern" id="woForm" onsubmit="submitWO(event)">
      <div class="mb-3"><label class="form-label">Makine</label><select class="form-select" id="woMachine" required>${DEMO_MACHINES.map(m => `<option value="${m.id}">${m.machine_name}</option>`).join('')}</select></div>
      <div class="mb-3"><label class="form-label">Teknisyen</label><select class="form-select" id="woTech" required>${DEMO_USERS.filter(u => u.role === 'Technician' && u.status === 'Active').map(u => `<option value="${u.id}">${u.full_name}</option>`).join('')}</select></div>
      <div class="mb-3"><label class="form-label">Öncelik</label><select class="form-select" id="woPriority"><option>Low</option><option>Medium</option><option selected>High</option><option>Critical</option></select></div>
      <div class="mb-3"><label class="form-label">Planlanan Tarih</label><input type="date" class="form-control" id="woDate" required></div>
      <button type="submit" class="btn btn-accent w-100">Oluştur</button>
    </form></div></div></div></div>`;
}

async function submitWO(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const ogHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Oluşturuluyor...'; btn.disabled = true;
  const machineId = document.getElementById('woMachine').value;
  const techId = document.getElementById('woTech').value;
  const newWo = {
    id: 'WO-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5),
    machine_id: machineId,
    machine_name: getMachineById(machineId)?.machine_name,
    technician: techId,
    priority: document.getElementById('woPriority').value,
    date: document.getElementById('woDate').value,
    status: 'Open',
    created_at: new Date().toISOString()
  };
  const success = await db.insert('work_orders', [newWo]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if (success) {
    await logAudit('Yeni iş emri oluşturuldu — Makine: ' + newWo.machine_name + ', Öncelik: ' + newWo.priority);
    bootstrap.Modal.getInstance(document.getElementById('woModal')).hide();
    showToast('İş emri oluşturuldu!');
    await loadData();
    await renderPage('work-orders');
  } else {
    showToast('Hata oluştu!', 'danger');
  }
}
// ─── Reports ──────────────────────────────────────────────────────────
function renderReports(el) {
  el.innerHTML = `<div class="row g-3">
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:var(--red);"></i><h5>OEE Raporu</h5><p class="text-muted" style="font-size:13px;">Son 30 günlük OEE performans raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div>
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:var(--accent);"></i><h5>Bakım Raporu</h5><p class="text-muted" style="font-size:13px;">Aylık bakım özet raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div>
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:#3b82f6;"></i><h5>Risk Raporu</h5><p class="text-muted" style="font-size:13px;">Makine risk analiz raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div></div>`;
}

// ─── Technician Performance ───────────────────────────────────────────
function renderTechPerf(el) {
  const techs = DEMO_USERS.filter(u => u.role === 'Technician');
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-users me-2" style="color:var(--accent)"></i>Teknisyen Performansı</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Teknisyen</th><th>İş Emirleri</th><th>Ort. Süre</th><th>Durum</th></tr></thead><tbody>
  ${techs.map(t => {
    const wos = DEMO_WORK_ORDERS.filter(w => String(w.technician) === String(t.id) || w.technician === t.full_name);
    const logs = DEMO_MAINTENANCE_LOGS.filter(l => String(l.technician_id) === String(t.id));
    const avgMTTR = logs.length ? logs.reduce((s, l) => s + l.duration_hours, 0) / logs.length : 0;
    return `<tr><td><strong>${t.full_name}</strong></td><td>${wos.length}</td><td>${avgMTTR.toFixed(1)}h</td>
    <td><span class="badge bg-${t.status === 'Active' ? 'success' : 'secondary'} badge-pill">${t.status}</span></td></tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}

// ─── Alert Management ─────────────────────────────────────────────────
function renderAlertMgmt(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--accent)"></i>Alert Yönetimi</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Alert ID</th><th>Makine</th><th>Tip</th><th>Severity</th><th>Değer</th><th>Tarih</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
  ${DEMO_ALERTS.map(a => {
    const m = getMachineById(a.machine_id);
    const sev = a.alert_type === 'critical' ? 'Critical' : a.alert_type === 'warning' ? 'High' : 'Medium';
    return `<tr>
      <td><strong>${a.id}</strong></td><td>${m ? m.machine_name : a.machine_id}</td><td style="font-size:12px;">${a.alert_type}</td>
      <td><span class="badge bg-${sev === 'Critical' ? 'danger' : sev === 'High' ? 'warning' : 'info'} badge-pill">${sev}</span></td>
      <td>${a.alert_message || '-'}</td><td>${formatDateTime(a.alert_date)}</td>
      <td>${a.is_read ? '<span class="badge bg-success badge-pill">Onaylandı</span>' : '<span class="badge bg-danger badge-pill">Bekliyor</span>'}</td>
      <td>${!a.is_read ? `<button class="btn btn-sm btn-accent" onclick="ackAlert('${a.id}')">Onayla</button>` : '-'}</td>
    </tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}

// ─── User Management ──────────────────────────────────────────────────
function renderUserMgmt(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-users-gear me-2" style="color:var(--accent)"></i>Kullanıcı Yönetimi</h5>
  <button class="btn btn-accent btn-sm" onclick="alert('Yeni kullanıcı formu açılacak')"><i class="fas fa-plus me-1"></i>Yeni Kullanıcı</button></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>ID</th><th>Ad Soyad</th><th>Rol</th><th>Departman</th><th>E-posta</th><th>Durum</th></tr></thead><tbody>
  ${DEMO_USERS.map(u => `<tr>
    <td><strong>${u.id}</strong></td><td>${u.full_name}</td>
    <td><span class="badge bg-${u.role === 'Admin' ? 'dark' : u.role === 'Production Manager' ? 'primary' : u.role === 'Maintenance Manager' ? 'info' : u.role === 'Technician' ? 'secondary' : 'warning'} badge-pill">${u.role}</span></td>
    <td>${u.department}</td><td>${u.email}</td>
    <td><span class="badge bg-${u.status === 'Active' ? 'success' : 'secondary'} badge-pill">${u.status}</span></td>
  </tr>`).join('')}</tbody></table></div></div></div>`;
}

// ─── Alert Config ─────────────────────────────────────────────────────
function renderAlertConfig(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-sliders me-2" style="color:var(--accent)"></i>Alert Eşik Yapılandırması</h5></div>
  <div class="panel-body"><form class="form-modern" onsubmit="event.preventDefault();showToast('Eşik değerleri güncellendi!');">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">Risk Score — Sarı Eşik</label><input type="number" class="form-control" value="60"></div>
      <div class="col-md-6"><label class="form-label">Risk Score — Kırmızı Eşik</label><input type="number" class="form-control" value="85"></div>
      <div class="col-md-6"><label class="form-label">OEE — Sarı Eşik (%)</label><input type="number" class="form-control" value="75"></div>
      <div class="col-md-6"><label class="form-label">OEE — Kırmızı Eşik (%)</label><input type="number" class="form-control" value="85"></div>
      <div class="col-md-6"><label class="form-label">MTBF — Sarı Eşik (saat)</label><input type="number" class="form-control" value="720"></div>
      <div class="col-md-6"><label class="form-label">MTTR — Kırmızı Eşik (saat)</label><input type="number" class="form-control" value="4"></div>
      <div class="col-12"><button type="submit" class="btn btn-accent"><i class="fas fa-save me-2"></i>Kaydet</button></div>
    </div></form></div></div>`;
}

// ─── Audit Log ────────────────────────────────────────────────────────
function renderAuditLog(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-clock-rotate-left me-2" style="color:var(--accent)"></i>Audit Log</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>#</th><th>Kullanıcı</th><th>Aksiyon</th><th>Zaman</th></tr></thead><tbody>
  ${DEMO_AUDIT_LOG.slice().reverse().map(l => {
    const u = DEMO_USERS.find(x => x.id === l.user_name || x.full_name === l.user_name);
    return `<tr>
      <td>${l.id}</td><td><strong>${u ? u.full_name : l.user_name}</strong></td><td>${l.action}</td><td>${formatDateTime(l.created_at)}</td>
    </tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}
