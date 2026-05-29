// Production Manager & Exec Dashboards + Charts

function renderPMDashboard(el) {
  const avgOEE = OEE_TREND.slice(-7).reduce((s, d) => s + d.oee, 0) / 7;
  const openWO = DEMO_WORK_ORDERS.length;
  const activeAlerts = DEMO_ALERTS.filter(a => !a.is_read).length;
  const mtbf = 580;

  el.innerHTML = `
  <div class="row g-3 mb-4">
    <div class="col-6 col-lg-3 fade-in fade-in-delay-1"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon teal"><i class="fas fa-gauge-high"></i></div><span class="kpi-trend up"><i class="fas fa-arrow-up"></i>2.1%</span></div>
      <div class="kpi-value">${avgOEE.toFixed(1)}%</div><div class="kpi-label">OEE (7 Gün Ort.)</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-2"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon blue"><i class="fas fa-clock"></i></div></div>
      <div class="kpi-value">${mtbf}h</div><div class="kpi-label">MTBF (Ortalama)</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-3"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon red"><i class="fas fa-triangle-exclamation"></i></div></div>
      <div class="kpi-value">${activeAlerts}</div><div class="kpi-label">Aktif Alert</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-4"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon amber"><i class="fas fa-file-lines"></i></div></div>
      <div class="kpi-value">${openWO}</div><div class="kpi-label">Bekleyen İş Emri</div>
    </div></div>
  </div>

  <div class="row g-3 mb-4">
    <div class="col-lg-8 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-chart-line me-2" style="color:var(--accent)"></i>OEE Trend (30 Gün)</h5></div><div class="panel-body"><div class="chart-container"><canvas id="oeeChart"></canvas></div></div></div></div>
    <div class="col-lg-4 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--red)"></i>Aktif Alertler</h5></div><div class="panel-body">${renderAlertList()}</div></div></div>
  </div>

  <div class="row g-3 mb-4">
    <div class="col-12 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-th me-2" style="color:var(--accent)"></i>Makine Risk Haritası</h5></div><div class="panel-body"><div class="risk-grid">${renderRiskGrid()}</div></div></div></div>
  </div>

  <div class="row g-3">
    <div class="col-12 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-clipboard-list me-2" style="color:var(--accent)"></i>Bekleyen Bakım Planları</h5>
      <button class="btn btn-accent btn-sm" onclick="navigateTo('maintenance-plans')">Tümünü Gör</button></div>
      <div class="panel-body">${renderPendingPlansTable()}</div></div></div>
  </div>`;

  setTimeout(() => drawOEEChart(), 100);
}

function renderAlertList() {
  const alerts = DEMO_ALERTS.filter(a => !a.is_read);
  if (!alerts.length) return '<p class="text-muted mb-0" style="font-size:13px;">Aktif alert yok.</p>';
  return alerts.map(a => {
    const m = getMachineById(a.machine_id);
    const sev = a.alert_type === 'critical' ? 'Critical' : a.alert_type === 'warning' ? 'High' : 'Medium';
    return `<div class="alert-item">
      <div class="alert-dot ${sev.toLowerCase()}"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:13px;">${m ? m.machine_name : a.machine_id}</div>
        <div style="font-size:12px;color:var(--text-muted);">${a.alert_type}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${formatDateTime(a.alert_date)}</div>
      </div>
      <span class="badge bg-${sev === 'Critical' ? 'danger' : sev === 'High' ? 'warning' : sev === 'Medium' ? 'info' : 'secondary'}" style="font-size:10px;">${sev}</span>
    </div>`;
  }).join('');
}

function renderRiskGrid() {
  return DEMO_MACHINES.map(m => {
    const score = RISK_SCORES[m.id] || 0;
    const bg = score >= 85 ? 'linear-gradient(135deg,#dc2626,#ef4444)' : score >= 60 ? 'linear-gradient(135deg,#ca8a04,#eab308)' : 'linear-gradient(135deg,#16a34a,#22c55e)';
    return `<div class="risk-cell" style="background:${bg};" title="${m.machine_name}">
      <div class="machine-name">${m.machine_name}</div>
      <div class="risk-value">${score}</div>
      <div class="risk-status">${getRiskLabel(score)}</div>
    </div>`;
  }).join('');
}

function renderPendingPlansTable() {
  // ✅ DEĞİŞİKLİK: maintenance_schedules → maintenance_plans
  const pending = DEMO_MAINTENANCE_PLANS.filter(p =>
    p.status?.toLowerCase() === 'planned' || p.status?.toLowerCase() === 'pending'
  );
  if (!pending.length) return '<p class="text-muted mb-0">Bekleyen plan yok.</p>';
  return `<div class="table-responsive"><table class="table-modern"><thead><tr>
    <th>Plan ID</th><th>Makine</th><th>Tip</th><th>Risk</th><th>Önerilen Tarih</th><th>İşlem</th>
  </tr></thead><tbody>${pending.map(p => {
    const m = getMachineById(p.machine_id);
    const risk = m ? RISK_SCORES[m.id] : 0;
    return `<tr>
      <td><strong>${p.id}</strong></td>
      <td>${m ? m.machine_name : p.machine_id}</td>
      <td><span class="badge bg-${p.priority === 'High' ? 'danger' : p.priority === 'Medium' ? 'info' : 'success'} badge-pill">${p.priority || '-'}</span></td>
      <td><span style="color:${getRiskColor(risk)};font-weight:700;">${risk}</span></td>
      <td>${formatDate(p.planned_date)}</td>
      <td>
        <button class="btn btn-sm btn-accent me-1" onclick="approvePlan('${p.id}')"><i class="fas fa-check"></i></button>
        <button class="btn btn-sm btn-outline-secondary" onclick="postponePlan('${p.id}')"><i class="fas fa-clock"></i></button>
      </td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}

// ✅ DEĞİŞİKLİK: maintenance_schedules → maintenance_plans
async function approvePlan(id) {
  const success = await db.update('maintenance_plans', { status: 'approved' }, 'id', id);
  if (success) {
    await logAudit('Bakım planı onaylandı: ' + id);
    showToast('Plan onaylandı: ' + id);
    await loadData();
    await renderPage(currentPage);
  } else {
    showToast('Onaylama başarısız!', 'danger');
  }
}

async function postponePlan(id) {
  const success = await db.update('maintenance_plans', { status: 'postponed' }, 'id', id);
  if (success) {
    await logAudit('Bakım planı ertelendi: ' + id);
    showToast('Plan ertelendi: ' + id, 'warning');
    await loadData();
    await renderPage(currentPage);
  } else {
    showToast('Erteleme başarısız!', 'danger');
  }
}

function drawOEEChart() {
  const ctx = document.getElementById('oeeChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: OEE_TREND.map(d => d.date.slice(5)),
      datasets: [{
        label: 'OEE %',
        data: OEE_TREND.map(d => d.oee),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13,148,136,.08)',
        fill: true, tension: .4, borderWidth: 2.5, pointRadius: 0, pointHitRadius: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 60, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 10 } }
      }
    }
  });
}

// Executive Dashboard
function renderExecDashboard(el) {
  const avgOEE = OEE_TREND.slice(-7).reduce((s, d) => s + d.oee, 0) / 7;
  const topRisk = DEMO_MACHINES.map(m => ({ ...m, risk: RISK_SCORES[m.id] })).sort((a, b) => b.risk - a.risk).slice(0, 5);
  const totalDowntime = 47.5;
  const totalMaint = DEMO_MAINTENANCE_LOGS.length;

  el.innerHTML = `
  <div class="row g-3 mb-4">
    <div class="col-6 col-lg-3 fade-in fade-in-delay-1"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon teal"><i class="fas fa-gauge-high"></i></div></div>
      <div class="kpi-value">${avgOEE.toFixed(1)}%</div><div class="kpi-label">Fleet OEE</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-2"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon red"><i class="fas fa-power-off"></i></div></div>
      <div class="kpi-value">${totalDowntime}h</div><div class="kpi-label">Toplam Downtime (Ay)</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-3"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon blue"><i class="fas fa-wrench"></i></div></div>
      <div class="kpi-value">${totalMaint}</div><div class="kpi-label">Toplam Bakım (Ay)</div>
    </div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-4"><div class="kpi-card">
      <div class="kpi-header"><div class="kpi-icon amber"><i class="fas fa-triangle-exclamation"></i></div></div>
      <div class="kpi-value">${DEMO_ALERTS.filter(a => !a.is_read).length}</div><div class="kpi-label">Aktif Alert</div>
    </div></div>
  </div>

  <div class="row g-3 mb-4">
    <div class="col-lg-4 fade-in"><div class="panel"><div class="panel-header"><h5>OEE Göstergesi</h5></div><div class="panel-body" style="text-align:center;"><div class="gauge-container"><canvas id="gaugeChart"></canvas></div><p style="font-size:13px;color:var(--text-muted);margin-top:8px;">Fleet Ortalama OEE</p></div></div></div>
    <div class="col-lg-8 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-ranking-star me-2" style="color:var(--red)"></i>En Riskli 5 Makine</h5></div><div class="panel-body">
      <div class="table-responsive"><table class="table-modern"><thead><tr><th>Makine</th><th>Konum</th><th>Kritiklik</th><th>Risk Score</th><th>Durum</th></tr></thead><tbody>
      ${topRisk.map(m => `<tr>
        <td><strong>${m.machine_name}</strong></td><td>${m.location}</td>
        <td><span class="badge bg-${m.criticality === 'Critical' ? 'danger' : m.criticality === 'High' ? 'warning' : 'secondary'} badge-pill">${m.criticality || '-'}</span></td>
        <td><span style="color:${getRiskColor(m.risk)};font-weight:700;font-size:16px;">${m.risk}</span></td>
        <td><span class="badge bg-${m.status?.toLowerCase() === 'active' ? 'success' : m.status === 'Under Maintenance' ? 'warning' : 'secondary'} badge-pill">${m.status}</span></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div></div></div>
  </div>

  <div class="row g-3">
    <div class="col-lg-6 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-chart-scatter me-2" style="color:var(--accent)"></i>Maliyet vs Downtime</h5></div><div class="panel-body"><div class="chart-container"><canvas id="scatterChart"></canvas></div></div></div></div>
    <div class="col-lg-6 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-chart-line me-2" style="color:var(--accent)"></i>OEE Trend</h5></div><div class="panel-body"><div class="chart-container"><canvas id="execOeeChart"></canvas></div></div></div></div>
  </div>`;

  setTimeout(() => {
    drawGaugeChart(avgOEE);
    drawScatterChart();
    drawExecOEEChart();
  }, 100);
}

function drawGaugeChart(val) {
  const ctx = document.getElementById('gaugeChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: { datasets: [{ data: [val, 100 - val], backgroundColor: [val >= 85 ? '#22c55e' : val >= 75 ? '#eab308' : '#ef4444', '#e2e8f0'], borderWidth: 0 }] },
    options: {
      circumference: 180, rotation: 270, cutout: '78%',
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    },
    plugins: [{
      id: 'gaugeText',
      afterDraw(chart) {
        const { ctx: c, width, height } = chart;
        c.save(); c.textAlign = 'center';
        c.font = '700 32px Inter'; c.fillStyle = '#0f172a';
        c.fillText(val.toFixed(1) + '%', width / 2, height - 20);
        c.restore();
      }
    }]
  });
}

function drawScatterChart() {
  const ctx = document.getElementById('scatterChart');
  if (!ctx) return;
  const data = DEMO_MACHINES.map(m => ({ x: +(Math.random() * 20 + 5).toFixed(1), y: +(Math.random() * 15000 + 2000).toFixed(0) }));
  new Chart(ctx, {
    type: 'scatter',
    data: { datasets: [{ data: data.map(d => ({ x: d.x, y: d.y })), backgroundColor: 'rgba(13,148,136,.6)', pointRadius: 8, pointHoverRadius: 11 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Downtime (Saat)', font: { size: 12 } }, grid: { color: '#f1f5f9' } },
        y: { title: { display: true, text: 'Maliyet (₺)', font: { size: 12 } }, grid: { color: '#f1f5f9' } }
      }
    }
  });
}

function drawExecOEEChart() {
  const ctx = document.getElementById('execOeeChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: OEE_TREND.map(d => d.date.slice(5)),
      datasets: [{ label: 'OEE %', data: OEE_TREND.map(d => d.oee), borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,.08)', fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 60, max: 100, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } } } }
  });
}

// Maintenance Manager Dashboard
function renderMMDashboard(el) {
  const openWO = DEMO_WORK_ORDERS.length;
  const avgRisk = Object.values(RISK_SCORES).reduce((s, v) => s + v, 0) / Object.values(RISK_SCORES).length;

  el.innerHTML = `
  <div class="row g-3 mb-4">
    <div class="col-6 col-lg-3 fade-in fade-in-delay-1"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon blue"><i class="fas fa-clock"></i></div></div><div class="kpi-value">580h</div><div class="kpi-label">MTBF</div></div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-2"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon amber"><i class="fas fa-stopwatch"></i></div></div><div class="kpi-value">2.4h</div><div class="kpi-label">MTTR</div></div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-3"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon purple"><i class="fas fa-gauge"></i></div></div><div class="kpi-value">${avgRisk.toFixed(0)}</div><div class="kpi-label">Ort. Risk Skoru</div></div></div>
    <div class="col-6 col-lg-3 fade-in fade-in-delay-4"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon red"><i class="fas fa-power-off"></i></div></div><div class="kpi-value">12h</div><div class="kpi-label">Aylık Downtime</div></div></div>
  </div>
  <div class="row g-3 mb-4">
    <div class="col-lg-7 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-chart-line me-2" style="color:var(--accent)"></i>MTBF / MTTR Trend (90 Gün)</h5></div><div class="panel-body"><div class="chart-container"><canvas id="mtbfChart"></canvas></div></div></div></div>
    <div class="col-lg-5 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-bell me-2" style="color:var(--red)"></i>Aktif Alertler</h5></div><div class="panel-body">${renderAlertList()}</div></div></div>
  </div>
  <div class="row g-3">
    <div class="col-12 fade-in"><div class="panel"><div class="panel-header"><h5><i class="fas fa-file-lines me-2" style="color:var(--accent)"></i>Tüm İş Emirleri</h5>
      <button class="btn btn-accent btn-sm" onclick="navigateTo('work-orders')">Tümünü Gör</button></div>
      <div class="panel-body">${renderWOTable(DEMO_WORK_ORDERS)}</div></div></div>
  </div>`;

  setTimeout(drawMTBFChart, 100);
}

function drawMTBFChart() {
  const ctx = document.getElementById('mtbfChart');
  if (!ctx) return;
  const labels = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i * 7); labels.push(d.toISOString().slice(5, 10)); }
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'MTBF (Saat)', data: labels.map(() => 500 + Math.random() * 200), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)', fill: false, tension: .4, borderWidth: 2, pointRadius: 3, yAxisID: 'y' },
        { label: 'MTTR (Saat)', data: labels.map(() => 1 + Math.random() * 3), borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,.08)', fill: false, tension: .4, borderWidth: 2, pointRadius: 3, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } } },
      scales: {
        y: { type: 'linear', position: 'left', title: { display: true, text: 'MTBF (Saat)' }, grid: { color: '#f1f5f9' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: 'MTTR (Saat)' }, grid: { display: false } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Admin Dashboard
function renderAdminDashboard(el) {
  const active = DEMO_USERS.filter(u => u.status === 'Active').length;
  const total = DEMO_USERS.length;
  el.innerHTML = `
  <div class="row g-3 mb-4">
    <div class="col-6 col-lg-3 fade-in"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon teal"><i class="fas fa-users"></i></div></div><div class="kpi-value">${total}</div><div class="kpi-label">Toplam Kullanıcı</div></div></div>
    <div class="col-6 col-lg-3 fade-in"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon green"><i class="fas fa-user-check"></i></div></div><div class="kpi-value">${active}</div><div class="kpi-label">Aktif Kullanıcı</div></div></div>
    <div class="col-6 col-lg-3 fade-in"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon amber"><i class="fas fa-bell"></i></div></div><div class="kpi-value">${DEMO_ALERTS.length}</div><div class="kpi-label">Toplam Alert</div></div></div>
    <div class="col-6 col-lg-3 fade-in"><div class="kpi-card"><div class="kpi-header"><div class="kpi-icon blue"><i class="fas fa-server"></i></div></div><div class="kpi-value">${DEMO_MACHINES.length}</div><div class="kpi-label">Kayıtlı Makine</div></div></div>
  </div>
  <div class="row g-3">
    <div class="col-lg-6 fade-in"><div class="panel"><div class="panel-header"><h5>Son Aktiviteler</h5></div><div class="panel-body">${DEMO_AUDIT_LOG.slice(-5).reverse().map(l => {
    const u = DEMO_USERS.find(x => x.full_name === l.user_name || x.id === l.user_name);
    return `<div class="alert-item"><div class="alert-dot" style="background:var(--accent);"></div><div><div style="font-weight:600;font-size:13px;">${u ? u.full_name : l.user_name}</div><div style="font-size:12px;color:var(--text-muted);">${l.action}</div><div style="font-size:11px;color:var(--text-muted);">${formatDateTime(l.created_at)}</div></div></div>`;
  }).join('')}</div></div></div>
    <div class="col-lg-6 fade-in"><div class="panel"><div class="panel-header"><h5>Rol Dağılımı</h5></div><div class="panel-body"><div class="chart-container" style="min-height:200px;"><canvas id="roleChart"></canvas></div></div></div></div>
  </div>`;
  setTimeout(() => {
    const ctx = document.getElementById('roleChart'); if (!ctx) return;
    const roles = ['Admin', 'Production Manager', 'Maintenance Manager', 'Technician', 'Senior Management'];
    const counts = roles.map(r => DEMO_USERS.filter(u => u.role === r).length);
    new Chart(ctx, { type: 'doughnut', data: { labels: roles, datasets: [{ data: counts, backgroundColor: ['#0d9488', '#3b82f6', '#eab308', '#8b5cf6', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } } } });
  }, 100);
}
