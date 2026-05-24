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

// ─── Map Supabase user row to app format ──────────────────────────────
function mapSupabaseUser(row) {
  return {
    UserID: row.id ? String(row.id) : row.UserID || '',
    FullName: row.full_name || row.FullName || '',
    Role: row.role || row.Role || '',
    Department: row.department || row.Department || '',
    Email: row.email || row.Email || '',
    Phone: row.phone || row.Phone || '',
    Password: row.password || row.Password || '',
    AccountStatus: row.account_status || row.AccountStatus || 'Active',
    CreatedTimestamp: row.created_at || row.CreatedTimestamp || ''
  };
}

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
      DEMO_USERS = users.map(mapSupabaseUser);
      supabaseConnected = true;
      console.log('✅ Users loaded from Supabase (' + users.length + ' users)');
    } else { DEMO_USERS = []; }

    DEMO_MACHINES = (machines || []).map(m => ({
      MachineID: m.machine_code || String(m.id),
      MachineName: m.machine_name,
      Location: m.location,
      Criticality: m.criticality,
      RiskScore: m.risk_score,
      Status: m.status,
      OEE: m.oee,
      MTBF: m.mtbf,
      MTTR: m.mttr,
      LastMaintenanceDate: m.installation_date
    }));

    DEMO_ALERTS = (alerts || []).map(a => ({
      AlertID: String(a.id),
      MachineID: String(a.machine_id),
      AlertType: a.alert_type,
      SeverityLevel: a.alert_type === 'critical' ? 'Critical' : a.alert_type === 'warning' ? 'High' : 'Medium',
      AlertTimestamp: a.alert_date,
      AlertMessage: a.alert_message,
      AcknowledgedBy: a.is_read ? 'system' : null
    }));

    DEMO_MAINTENANCE_PLANS = (plans || []).map(p => ({
      PlanID: String(p.id),
      MachineID: String(p.machine_id),
      MaintenanceType: p.priority || 'Preventive',
      PlannedDate: p.planned_date,
      Status: p.status,
      Recommendation: p.recommendation,
      CreatedBy: 'Sistem'
    }));

    DEMO_MAINTENANCE_LOGS = (maintRecords || []).map(r => ({
      LogID: String(r.id),
      MachineID: String(r.machine_id),
      MaintenanceType: r.maintenance_type,
      Duration: r.duration_hours,
      Description: r.description,
      MaintenanceDate: r.maintenance_date,
      TechnicianID: String(r.technician_id)
    }));

    DEMO_WORK_ORDERS = (workOrders || []).map(w => ({
      WorkOrderID: w.id,
      MachineID: String(w.machine_id),
      MachineName: w.machine_name,
      AssignedTo: w.technician,
      Priority: w.priority,
      PlannedDate: w.date,
      Status: w.status
    }));

    DEMO_PRODUCTION_RECORDS = (prodData || []).map(p => ({
      MachineID: String(p.machine_id),
      ProductionDate: p.production_date,
      RuntimeHours: p.runtime_hours,
      CapacityUtilizationRate: p.capacity_usage,
      ProductionQuantity: p.production_quantity
    }));

    DEMO_AUDIT_LOG = (auditLog || []).map(a => ({
      UserName: a.user_name,
      Action: a.action,
      Timestamp: a.created_at
    }));

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
    const records = DEMO_PRODUCTION_RECORDS.filter(r => r.MachineID === m.MachineID);
    const last3 = records.slice(-3);
    const avgUtil = last3.length ? last3.reduce((s, r) => s + r.CapacityUtilizationRate, 0) / last3.length : 50;
    const lastMaint = new Date(m.LastMaintenanceDate || Date.now());
    const hoursSince = (Date.now() - lastMaint) / 3600000;
    const threshold = 720;
    const normRuntime = Math.min(hoursSince / threshold, 1.5);
    const corrLogs = DEMO_MAINTENANCE_LOGS.filter(l => l.MachineID === m.MachineID && l.MaintenanceType === 'Corrective').length;
    const normFailure = Math.min(corrLogs / 3, 1);
    let score = (0.40 * avgUtil) + (0.35 * normRuntime * 100) + (0.25 * normFailure * 100);
    score = Math.min(100, Math.max(0, score));
    // Override for demo realism
    if (m.MachineID === 'MCH-001') score = 91;
    if (m.MachineID === 'MCH-006') score = 88;
    if (m.MachineID === 'MCH-004') score = 78;
    if (m.MachineID === 'MCH-002') score = 65;
    if (m.MachineID === 'MCH-003') score = 45;
    if (m.MachineID === 'MCH-005') score = 38;
    if (m.MachineID === 'MCH-007') score = 52;
    if (m.MachineID === 'MCH-008') score = 22;
    scores[m.MachineID] = +score.toFixed(1);
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
function getUserByEmail(email) { return DEMO_USERS.find(u => u.Email === email); }
function getUserById(id) { return DEMO_USERS.find(u => u.UserID === id); }
function getMachineById(id) { return DEMO_MACHINES.find(m => m.MachineID === id); }
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
