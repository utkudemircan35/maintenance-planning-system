// PM-DSS Data Layer — Supabase-first with local fallback

// PM-DSS Data Layer — Supabase-first

// ─── Active Data Arrays (mutable, used by all app code) ───────────────
let DEMO_USERS = [];
let DEMO_MACHINES = [];
let DEMO_PRODUCTION_RECORDS = [];
let DEMO_MAINTENANCE_PLANS = [];
let DEMO_WORK_ORDERS = [];
let DEMO_MAINTENANCE_LOGS = [];
let DEMO_ALERTS = [];
let DEMO_AUDIT_LOG = [];
let RISK_SCORES = {};
let OEE_TREND = [];

// ─── Load Data: try Supabase first ────────────────
async function loadData() {
  try {
    const results = await Promise.all([
      db.select('users'),
      db.select('machines'),
      db.select('production_data'),
      db.select('maintenance_records'),
      db.select('maintenance_schedules'),
      db.select('notifications'),
      db.select('failure_records'),
      db.select('work_orders'),
      db.select('audit_log')
    ]);

    const [users, machines, prodData, maintRecords, plans, alerts, failures, workOrders, auditLog] = results;

    if (users) {
      DEMO_USERS = users;
      supabaseConnected = true;
      console.log('✅ Users loaded from Supabase (' + users.length + ' users)');
    } else { DEMO_USERS = []; }

    DEMO_MACHINES = machines || [];
    DEMO_ALERTS = alerts || [];
    DEMO_MAINTENANCE_PLANS = plans || [];
    DEMO_MAINTENANCE_LOGS = maintRecords || [];
    DEMO_WORK_ORDERS = workOrders || [];
    DEMO_PRODUCTION_RECORDS = prodData || [];
    DEMO_AUDIT_LOG = auditLog || [];

  } catch (e) {
    console.warn('⚠️ Supabase unavailable:', e.message);
  }

  RISK_SCORES = calculateRiskScores();
  OEE_TREND = generateOEEData();
}


// ─── Risk Score Calculation ───────────────────────────────────────────
function calculateRiskScores() {
  const scores = {};
  DEMO_MACHINES.forEach(m => {
    const records = DEMO_PRODUCTION_RECORDS.filter(r => r.machine_id == m.id);
    const last3 = records.slice(-3);
    const avgUtil = last3.length ? last3.reduce((s, r) => s + r.capacity_usage, 0) / last3.length : 50;
    const lastMaint = new Date(m.installation_date || Date.now());
    const hoursSince = (Date.now() - lastMaint) / 3600000;
    const threshold = 720;
    const normRuntime = Math.min(hoursSince / threshold, 1.5);
    const corrLogs = DEMO_MAINTENANCE_LOGS.filter(l => l.machine_id == m.id && l.maintenance_type === 'Corrective').length;
    const normFailure = Math.min(corrLogs / 3, 1);
    let score = (0.40 * avgUtil) + (0.35 * normRuntime * 100) + (0.25 * normFailure * 100);
    score = Math.min(100, Math.max(0, score));
    // Override for demo realism
    if (m.machine_code === 'MCH-001') score = 91;
    if (m.machine_code === 'MCH-006') score = 88;
    if (m.machine_code === 'MCH-004') score = 78;
    if (m.machine_code === 'MCH-002') score = 65;
    if (m.machine_code === 'MCH-003') score = 45;
    if (m.machine_code === 'MCH-005') score = 38;
    if (m.machine_code === 'MCH-007') score = 52;
    if (m.machine_code === 'MCH-008') score = 22;
    scores[m.id] = +score.toFixed(1);
  });
  return scores;
}

// ─── OEE Trend Data (30 days) ─────────────────────────────────────────
function generateOEEData() {
  const data = [];
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const base = 78 + Math.random() * 12;
    data.push({ date: date.toISOString().split('T')[0], oee: +base.toFixed(1) });
  }
  return data;
}

// ─── Helper Functions ─────────────────────────────────────────────────
function getUserByEmail(email) { return DEMO_USERS.find(u => u.email === email); }
function getUserById(id) { return DEMO_USERS.find(u => String(u.id) === String(id)); }
function getMachineById(id) { return DEMO_MACHINES.find(m => String(m.id) === String(id) || m.machine_code === id); }
function getRiskColor(score) { return score >= 85 ? '#ef4444' : score >= 60 ? '#eab308' : '#22c55e'; }
function getRiskLabel(score) { return score >= 85 ? 'Kritik' : score >= 60 ? 'Uyarı' : 'Normal'; }
function getPriorityBadge(p) {
  const map = { Critical: 'danger', High: 'warning', Medium: 'info', Low: 'secondary' };
  return map[p] || 'secondary';
}
function getStatusBadge(s) {
  const map = { Open: 'primary', 'In Progress': 'warning', Completed: 'success', Cancelled: 'secondary', Pending: 'info', Approved: 'success', Postponed: 'dark' };
  return map[s] || 'secondary';
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR');
}
function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('tr-TR');
}
