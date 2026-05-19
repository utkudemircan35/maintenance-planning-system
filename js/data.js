// PM-DSS Dynamic Data via Supabase

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

async function loadData() {
  try {
    const [
      { data: users },
      { data: machines },
      { data: prodData },
      { data: maintRecords },
      { data: plans },
      { data: alerts },
      { data: workOrders }
    ] = await Promise.all([
      supabase.from('technicians').select('*'),
      supabase.from('machines').select('*'),
      supabase.from('production_data').select('*'),
      supabase.from('maintenance_records').select('*'),
      supabase.from('maintenance_schedules').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('work_orders').select('*')
    ]);

    if (users) DEMO_USERS = users;
    if (machines) DEMO_MACHINES = machines;
    if (prodData) DEMO_PRODUCTION_RECORDS = prodData;
    if (maintRecords) DEMO_MAINTENANCE_LOGS = maintRecords;
    if (plans) DEMO_MAINTENANCE_PLANS = plans;
    if (alerts) DEMO_ALERTS = alerts;
    if (workOrders) DEMO_WORK_ORDERS = workOrders;

    RISK_SCORES = calculateRiskScores();
    OEE_TREND = generateOEEData();
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
  }
}

// Risk scores per machine
function calculateRiskScores() {
  const scores = {};
  DEMO_MACHINES.forEach(m => {
    const records = DEMO_PRODUCTION_RECORDS.filter(r => r.MachineID === m.MachineID);
    const last3 = records.slice(-3);
    const avgUtil = last3.length ? last3.reduce((s,r) => s + r.CapacityUtilizationRate, 0) / last3.length : 50;
    const lastMaint = new Date(m.LastMaintenanceDate || Date.now());
    const hoursSince = (Date.now() - lastMaint) / 3600000;
    const threshold = 720;
    const normRuntime = Math.min(hoursSince / threshold, 1.5);
    const corrLogs = DEMO_MAINTENANCE_LOGS.filter(l => l.MachineID === m.MachineID && l.MaintenanceType === 'Corrective').length;
    const normFailure = Math.min(corrLogs / 3, 1);
    let score = (0.40 * avgUtil) + (0.35 * normRuntime * 100) + (0.25 * normFailure * 100);
    score = Math.min(100, Math.max(0, score));
    scores[m.MachineID] = +score.toFixed(1);
  });
  return scores;
}

// OEE data (30 days)
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

// Helper functions
function getUserByEmail(email) { return DEMO_USERS.find(u => u.Email === email); }
function getUserById(id) { return DEMO_USERS.find(u => u.UserID === id); }
function getMachineById(id) { return DEMO_MACHINES.find(m => m.MachineID === id); }
function getRiskColor(score) { return score >= 85 ? '#ef4444' : score >= 60 ? '#eab308' : '#22c55e'; }
function getRiskLabel(score) { return score >= 85 ? 'Kritik' : score >= 60 ? 'Uyarı' : 'Normal'; }
function getPriorityBadge(p) {
  const map = { Critical:'danger', High:'warning', Medium:'info', Low:'secondary' };
  return map[p] || 'secondary';
}
function getStatusBadge(s) {
  const map = { Open:'primary', 'In Progress':'warning', Completed:'success', Cancelled:'secondary', Pending:'info', Approved:'success', Postponed:'dark' };
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
