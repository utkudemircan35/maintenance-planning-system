// Technician Work Orders
function renderTechWO(el) {
  const myWO = DEMO_WORK_ORDERS.filter(w => w.AssignedTechnicianID === currentUser.UserID && w.Status !== 'Completed' && w.Status !== 'Cancelled');
  el.innerHTML = `<div class="row g-3">${myWO.length ? myWO.map(w => {
    const m = getMachineById(w.MachineID);
    return `<div class="col-md-6 fade-in"><div class="wo-card">
      <div class="wo-header"><span class="wo-id">${w.WOID}</span><span class="badge bg-${getPriorityBadge(w.PriorityLevel)} badge-pill">${w.PriorityLevel}</span></div>
      <div class="wo-detail"><i class="fas fa-cog"></i>${m?m.MachineName:w.MachineID}</div>
      <div class="wo-detail"><i class="fas fa-location-dot"></i>${m?m.Location:'-'}</div>
      <div class="wo-detail"><i class="fas fa-calendar"></i>Planlanan: ${formatDate(w.ScheduledDate)}</div>
      <div class="wo-detail"><i class="fas fa-info-circle"></i>Durum: <span class="badge bg-${getStatusBadge(w.Status)} badge-pill ms-1">${w.Status}</span></div>
      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-accent btn-sm flex-fill" onclick="startWO('${w.WOID}')"><i class="fas fa-play me-1"></i>Başla</button>
        <button class="btn btn-outline-accent btn-sm flex-fill" onclick="openLogForm('${w.WOID}')"><i class="fas fa-pen me-1"></i>Log Gir</button>
      </div></div></div>`;
  }).join('') : '<div class="col-12"><div class="panel"><div class="panel-body text-center py-5"><i class="fas fa-check-circle fa-3x mb-3" style="color:var(--green);"></i><h5>Tüm iş emirleri tamamlandı!</h5></div></div></div>'}</div>`;
}

async function startWO(id) {
  const success = await db.update('work_orders', { Status: 'In Progress' }, 'WOID', id);
  if (success) {
    showToast('İş emri başlatıldı: '+id);
    await renderPage(currentPage);
  } else {
    showToast('Güncelleme başarısız!', 'danger');
  }
}

function openLogForm(woId) {
  currentPage = 'maintenance-log';
  document.querySelectorAll('.sidebar-menu a').forEach(a=>a.classList.toggle('active',a.dataset.page==='maintenance-log'));
  renderMaintenanceLogForm(document.getElementById('mainContent'), woId);
}

// Maintenance Log Form
function renderMaintenanceLogForm(el, preWO) {
  const myWO = DEMO_WORK_ORDERS.filter(w=>w.AssignedTechnicianID===currentUser.UserID || currentUser.Role!=='Technician');
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-pen-to-square me-2" style="color:var(--accent)"></i>Bakım Log Kaydı</h5></div>
  <div class="panel-body"><form class="form-modern" onsubmit="submitLog(event)">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">İş Emri</label><select class="form-select" id="logWO" required>${myWO.map(w=>`<option value="${w.WOID}" ${preWO===w.WOID?'selected':''}>${w.WOID} - ${getMachineById(w.MachineID)?.MachineName||w.MachineID}</option>`).join('')}</select></div>
      <div class="col-md-6"><label class="form-label">Bakım Tipi</label><select class="form-select" id="logType" required><option>Preventive</option><option>Corrective</option><option>Predictive</option></select></div>
      <div class="col-md-6"><label class="form-label">Süre (Saat)</label><input type="number" class="form-control" id="logDuration" step="0.5" min="0.5" required></div>
      <div class="col-md-6"><label class="form-label">Sonuç</label><select class="form-select" id="logOutcome" required><option>Resolved</option><option>Partially Resolved</option><option>Escalated</option></select></div>
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
  const wo = DEMO_WORK_ORDERS.find(w=>w.WOID===woId);
  if(wo) {
    await db.update('work_orders', { Status: 'Completed' }, 'WOID', woId);
  }
  const newLog = {
    LogID:'ML-2024-'+ String(DEMO_MAINTENANCE_LOGS.length+1).padStart(5,'0'),
    WOID:woId, MachineID:wo?wo.MachineID:'', TechnicianID:currentUser.UserID,
    InterventionDate:new Date().toISOString().split('T')[0],
    MaintenanceType:document.getElementById('logType').value,
    DurationHours:parseFloat(document.getElementById('logDuration').value),
    ActionsPerformed:document.getElementById('logActions').value,
    Outcome:document.getElementById('logOutcome').value,
    CompletionTimestamp:new Date().toISOString()
  };
  const success = await db.insert('maintenance_records', [newLog]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if(success) {
    showToast('Bakım log kaydı oluşturuldu!');
    navigateTo('dashboard');
  } else {
    showToast('Kayıt başarısız!', 'danger');
  }
}

// Alerts
function renderAlerts(el) {
  const alerts = DEMO_ALERTS;
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--accent)"></i>Bildirimler</h5></div>
  <div class="panel-body">${alerts.length ? alerts.map(a=>{
    const m=getMachineById(a.MachineID);
    return `<div class="alert-item"><div class="alert-dot ${a.SeverityLevel.toLowerCase()}"></div>
    <div style="flex:1"><div style="font-weight:600;font-size:13px;">${m?m.MachineName:a.MachineID} — ${a.AlertType}</div>
    <div style="font-size:12px;color:var(--text-muted);">Severity: ${a.SeverityLevel} ${a.TriggerValue?'| Değer: '+a.TriggerValue:''}</div>
    <div style="font-size:11px;color:var(--text-muted);">${formatDateTime(a.AlertTimestamp)}</div></div>
    ${a.AcknowledgedBy?`<span class="badge bg-success badge-pill">Onaylandı</span>`:`<button class="btn btn-sm btn-accent" onclick="ackAlert('${a.AlertID}')"><i class="fas fa-check me-1"></i>Onayla</button>`}
    </div>`;
  }).join('') : '<p class="text-muted mb-0">Bildirim yok.</p>'}</div></div>`;
}

async function ackAlert(id) {
  const success = await db.update('notifications', { AcknowledgedBy: currentUser.UserID, AcknowledgementTimestamp: new Date().toISOString() }, 'AlertID', id);
  if (success) {
    showToast('Alert onaylandı.');
    await renderPage(currentPage);
    renderTopbar();
  } else {
    showToast('Onaylama başarısız!', 'danger');
  }
}

// Production Entry
function renderProductionEntry(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-keyboard me-2" style="color:var(--accent)"></i>Üretim Verisi Girişi</h5></div>
  <div class="panel-body"><form class="form-modern" onsubmit="submitProduction(event)">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">Makine</label><select class="form-select" id="prodMachine" required>${DEMO_MACHINES.filter(m=>m.OperationalStatus==='Active').map(m=>`<option value="${m.MachineID}">${m.MachineName} (${m.MachineID})</option>`).join('')}</select></div>
      <div class="col-md-6"><label class="form-label">Vardiya</label><select class="form-select" id="prodShift" required><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
      <div class="col-md-4"><label class="form-label">Vardiya Tarihi</label><input type="date" class="form-control" id="prodDate" required></div>
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
  const mid = document.getElementById('prodMachine').value;
  const m = getMachineById(mid);
  const hours = parseFloat(document.getElementById('prodHours').value);
  const vol = parseInt(document.getElementById('prodVolume').value);
  const util = m ? Math.min(100, (vol / (m.NominalCapacity * (hours/8))) * 100) : 75;
  const newProd = {
    RecordID:'PR-2024-'+String(DEMO_PRODUCTION_RECORDS.length+1).padStart(5,'0'),
    MachineID:mid, RecordedBy:currentUser.UserID,
    ShiftDate:document.getElementById('prodDate').value,
    ShiftType:document.getElementById('prodShift').value,
    ProductionVolume:vol, CapacityUtilizationRate:+util.toFixed(1),
    RuntimeHours:hours, EntryTimestamp:new Date().toISOString()
  };
  const success = await db.insert('production_data', [newProd]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if(success) {
    showToast('Üretim verisi kaydedildi!');
    e.target.reset();
    document.getElementById('prodDate').valueAsDate = new Date();
  } else {
    showToast('Kayıt başarısız!', 'danger');
  }
}

// Maintenance Plans
function renderMaintenancePlans(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-clipboard-list me-2" style="color:var(--accent)"></i>Bakım Planları</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Plan ID</th><th>Makine</th><th>Tip</th><th>Risk</th><th>Tarih</th><th>Durum</th><th>Oluşturan</th><th>İşlem</th></tr></thead><tbody>
  ${DEMO_MAINTENANCE_PLANS.map(p=>{const m=getMachineById(p.MachineID);return `<tr>
    <td><strong>${p.PlanID}</strong></td><td>${m?m.MachineName:p.MachineID}</td>
    <td><span class="badge bg-${p.MaintenanceType==='Corrective'?'danger':p.MaintenanceType==='Predictive'?'info':'success'} badge-pill">${p.MaintenanceType}</span></td>
    <td><span style="color:${getRiskColor(p.RiskScore)};font-weight:700;">${p.RiskScore}</span></td>
    <td>${formatDate(p.RecommendedDate)}</td>
    <td><span class="badge bg-${getStatusBadge(p.PlanStatus)} badge-pill">${p.PlanStatus}</span></td>
    <td>${p.GeneratedBy==='System'?'<i class="fas fa-robot me-1"></i>Sistem':getUserById(p.GeneratedBy)?.FullName||p.GeneratedBy}</td>
    <td>${p.PlanStatus==='Pending'?`<button class="btn btn-sm btn-accent me-1" onclick="approvePlan('${p.PlanID}')"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-outline-secondary" onclick="postponePlan('${p.PlanID}')"><i class="fas fa-clock"></i></button>`:'-'}</td>
  </tr>`;}).join('')}</tbody></table></div></div></div>`;
}

// Work Orders shared
function renderWOTable(orders) {
  if(!orders.length) return '<p class="text-muted mb-0">İş emri bulunamadı.</p>';
  return `<div class="table-responsive"><table class="table-modern"><thead><tr><th>WO ID</th><th>Makine</th><th>Teknisyen</th><th>Öncelik</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>
  ${orders.map(w=>{const m=getMachineById(w.MachineID);const t=getUserById(w.AssignedTechnicianID);return `<tr>
    <td><strong>${w.WOID}</strong></td><td>${m?m.MachineName:w.MachineID}</td><td>${t?t.FullName:'-'}</td>
    <td><span class="badge bg-${getPriorityBadge(w.PriorityLevel)} badge-pill">${w.PriorityLevel}</span></td>
    <td>${formatDate(w.ScheduledDate)}</td>
    <td><span class="badge bg-${getStatusBadge(w.Status)} badge-pill">${w.Status}</span></td>
  </tr>`;}).join('')}</tbody></table></div>`;
}

function renderWorkOrders(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-file-lines me-2" style="color:var(--accent)"></i>İş Emirleri</h5>
  <button class="btn btn-accent btn-sm" data-bs-toggle="modal" data-bs-target="#woModal"><i class="fas fa-plus me-1"></i>Yeni İş Emri</button></div>
  <div class="panel-body">${renderWOTable(DEMO_WORK_ORDERS)}</div></div>
  <div class="modal fade" id="woModal"><div class="modal-dialog"><div class="modal-content" style="border-radius:var(--radius);border:none;">
    <div class="modal-header" style="border-bottom:1px solid var(--border);"><h5 class="modal-title">Yeni İş Emri</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><form class="form-modern" id="woForm" onsubmit="submitWO(event)">
      <div class="mb-3"><label class="form-label">Makine</label><select class="form-select" id="woMachine" required>${DEMO_MACHINES.map(m=>`<option value="${m.MachineID}">${m.MachineName}</option>`).join('')}</select></div>
      <div class="mb-3"><label class="form-label">Teknisyen</label><select class="form-select" id="woTech" required>${DEMO_USERS.filter(u=>u.Role==='Technician'&&u.AccountStatus==='Active').map(u=>`<option value="${u.UserID}">${u.FullName}</option>`).join('')}</select></div>
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
  const newWo = {
    WOID:'WO-2024-'+String(DEMO_WORK_ORDERS.length+1).padStart(5,'0'),
    PlanID:null, MachineID:document.getElementById('woMachine').value,
    AssignedTechnicianID:document.getElementById('woTech').value,
    CreatedBy:currentUser.UserID,
    PriorityLevel:document.getElementById('woPriority').value,
    ScheduledDate:document.getElementById('woDate').value,
    Status:'Open', CreatedTimestamp:new Date().toISOString()
  };
  const success = await db.insert('work_orders', [newWo]);
  btn.innerHTML = ogHtml; btn.disabled = false;
  if (success) {
    bootstrap.Modal.getInstance(document.getElementById('woModal')).hide();
    showToast('İş emri oluşturuldu!');
    await renderPage('work-orders');
  } else {
    showToast('Hata oluştu!', 'danger');
  }
}

// Reports
function renderReports(el) {
  el.innerHTML = `<div class="row g-3">
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;" onclick="alert('PDF rapor indirme simülasyonu')"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:var(--red);"></i><h5>OEE Raporu</h5><p class="text-muted" style="font-size:13px;">Son 30 günlük OEE performans raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div>
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;" onclick="alert('PDF rapor indirme simülasyonu')"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:var(--accent);"></i><h5>Bakım Raporu</h5><p class="text-muted" style="font-size:13px;">Aylık bakım özet raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div>
  <div class="col-md-4 fade-in"><div class="panel" style="cursor:pointer;" onclick="alert('PDF rapor indirme simülasyonu')"><div class="panel-body text-center py-4">
    <i class="fas fa-file-pdf fa-3x mb-3" style="color:#3b82f6;"></i><h5>Risk Raporu</h5><p class="text-muted" style="font-size:13px;">Makine risk analiz raporu</p>
    <button class="btn btn-accent btn-sm"><i class="fas fa-download me-1"></i>PDF İndir</button></div></div></div></div>`;
}

// Technician Performance
function renderTechPerf(el) {
  const techs = DEMO_USERS.filter(u=>u.Role==='Technician');
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-users me-2" style="color:var(--accent)"></i>Teknisyen Performansı</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Teknisyen</th><th>Tamamlanan WO</th><th>Ort. MTTR</th><th>Completion Rate</th><th>Durum</th></tr></thead><tbody>
  ${techs.map(t=>{
    const wos=DEMO_WORK_ORDERS.filter(w=>w.AssignedTechnicianID===t.UserID);
    const done=wos.filter(w=>w.Status==='Completed').length;
    const logs=DEMO_MAINTENANCE_LOGS.filter(l=>l.TechnicianID===t.UserID);
    const avgMTTR=logs.length?logs.reduce((s,l)=>s+l.DurationHours,0)/logs.length:0;
    const rate=wos.length?Math.round(done/wos.length*100):0;
    return `<tr><td><strong>${t.FullName}</strong></td><td>${done}</td><td>${avgMTTR.toFixed(1)}h</td>
    <td><div class="d-flex align-items-center gap-2"><div class="progress flex-fill" style="height:6px;border-radius:3px;"><div class="progress-bar" style="width:${rate}%;background:var(--accent);border-radius:3px;"></div></div><span style="font-size:12px;font-weight:600;">${rate}%</span></div></td>
    <td><span class="badge bg-${t.AccountStatus==='Active'?'success':'secondary'} badge-pill">${t.AccountStatus}</span></td></tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}

// Alert Management
function renderAlertMgmt(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--accent)"></i>Alert Yönetimi</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>Alert ID</th><th>Makine</th><th>Tip</th><th>Severity</th><th>Değer</th><th>Tarih</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
  ${DEMO_ALERTS.map(a=>{const m=getMachineById(a.MachineID);return `<tr>
    <td><strong>${a.AlertID}</strong></td><td>${m?m.MachineName:a.MachineID}</td><td style="font-size:12px;">${a.AlertType}</td>
    <td><span class="badge bg-${a.SeverityLevel==='Critical'?'danger':a.SeverityLevel==='High'?'warning':a.SeverityLevel==='Medium'?'info':'secondary'} badge-pill">${a.SeverityLevel}</span></td>
    <td>${a.TriggerValue||'-'}</td><td>${formatDateTime(a.AlertTimestamp)}</td>
    <td>${a.AcknowledgedBy?'<span class="badge bg-success badge-pill">Onaylandı</span>':'<span class="badge bg-danger badge-pill">Bekliyor</span>'}</td>
    <td>${!a.AcknowledgedBy?`<button class="btn btn-sm btn-accent" onclick="ackAlert('${a.AlertID}')">Onayla</button>`:'-'}</td>
  </tr>`;}).join('')}</tbody></table></div></div></div>`;
}

// User Management
function renderUserMgmt(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-users-gear me-2" style="color:var(--accent)"></i>Kullanıcı Yönetimi</h5>
  <button class="btn btn-accent btn-sm" onclick="alert('Yeni kullanıcı formu açılacak')"><i class="fas fa-plus me-1"></i>Yeni Kullanıcı</button></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>ID</th><th>Ad Soyad</th><th>Rol</th><th>Departman</th><th>E-posta</th><th>Durum</th></tr></thead><tbody>
  ${DEMO_USERS.map(u=>`<tr>
    <td><strong>${u.UserID}</strong></td><td>${u.FullName}</td>
    <td><span class="badge bg-${u.Role==='Admin'?'dark':u.Role==='Production Manager'?'primary':u.Role==='Maintenance Manager'?'info':u.Role==='Technician'?'secondary':'warning'} badge-pill">${u.Role}</span></td>
    <td>${u.Department}</td><td>${u.Email}</td>
    <td><span class="badge bg-${u.AccountStatus==='Active'?'success':'secondary'} badge-pill">${u.AccountStatus}</span></td>
  </tr>`).join('')}</tbody></table></div></div></div>`;
}

// Alert Config
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

// Audit Log
function renderAuditLog(el) {
  el.innerHTML = `<div class="panel fade-in"><div class="panel-header"><h5><i class="fas fa-clock-rotate-left me-2" style="color:var(--accent)"></i>Audit Log</h5></div>
  <div class="panel-body"><div class="table-responsive"><table class="table-modern"><thead><tr><th>#</th><th>Kullanıcı</th><th>Aksiyon</th><th>Zaman</th></tr></thead><tbody>
  ${DEMO_AUDIT_LOG.slice().reverse().map(l=>{const u=getUserById(l.userId);return `<tr>
    <td>${l.id}</td><td><strong>${u?u.FullName:l.userId}</strong></td><td>${l.action}</td><td>${formatDateTime(l.timestamp)}</td>
  </tr>`;}).join('')}</tbody></table></div></div></div>`;
}
