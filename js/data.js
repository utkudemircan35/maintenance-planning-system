// PM-DSS Demo Data
const DEMO_USERS = [
  { UserID:'USR-001', FullName:'Ahmet Yılmaz', Role:'Admin', Department:'IT', Email:'admin@pmdss.com', Phone:'+905551110001', Password:'admin123', AccountStatus:'Active', CreatedTimestamp:'2024-01-15T08:00:00Z' },
  { UserID:'USR-002', FullName:'Mehmet Kaya', Role:'Production Manager', Department:'Üretim', Email:'uretim@pmdss.com', Phone:'+905551110002', Password:'uretim123', AccountStatus:'Active', CreatedTimestamp:'2024-01-15T08:00:00Z' },
  { UserID:'USR-003', FullName:'Ayşe Demir', Role:'Maintenance Manager', Department:'Bakım', Email:'bakim@pmdss.com', Phone:'+905551110003', Password:'bakim123', AccountStatus:'Active', CreatedTimestamp:'2024-01-15T08:00:00Z' },
  { UserID:'USR-004', FullName:'Ali Öztürk', Role:'Technician', Department:'Bakım', Email:'teknisyen@pmdss.com', Phone:'+905551110004', Password:'teknisyen123', AccountStatus:'Active', CreatedTimestamp:'2024-01-16T08:00:00Z' },
  { UserID:'USR-005', FullName:'Fatma Çelik', Role:'Senior Management', Department:'Yönetim', Email:'yonetim@pmdss.com', Phone:'+905551110005', Password:'yonetim123', AccountStatus:'Active', CreatedTimestamp:'2024-01-15T08:00:00Z' },
  { UserID:'USR-006', FullName:'Can Arslan', Role:'Technician', Department:'Bakım', Email:'can@pmdss.com', Phone:'+905551110006', Password:'can123', AccountStatus:'Active', CreatedTimestamp:'2024-02-01T08:00:00Z' },
  { UserID:'USR-007', FullName:'Zeynep Koç', Role:'Technician', Department:'Bakım', Email:'zeynep@pmdss.com', Phone:'+905551110007', Password:'zeynep123', AccountStatus:'Inactive', CreatedTimestamp:'2024-02-10T08:00:00Z' }
];

const DEMO_MACHINES = [
  { MachineID:'MCH-001', MachineName:'Dolum Makinesi A1', Location:'Hat-1', Manufacturer:'Krones AG', InstallationDate:'2020-03-15', NominalCapacity:1200, OperationalStatus:'Active', CriticalityLevel:'Critical', LastMaintenanceDate:'2024-11-20' },
  { MachineID:'MCH-002', MachineName:'Paketleme Robotu B1', Location:'Hat-1', Manufacturer:'ABB Robotics', InstallationDate:'2021-06-10', NominalCapacity:800, OperationalStatus:'Active', CriticalityLevel:'High', LastMaintenanceDate:'2024-12-01' },
  { MachineID:'MCH-003', MachineName:'Etiketleme Makinesi C1', Location:'Hat-2', Manufacturer:'Herma GmbH', InstallationDate:'2019-11-22', NominalCapacity:2000, OperationalStatus:'Active', CriticalityLevel:'Medium', LastMaintenanceDate:'2024-12-10' },
  { MachineID:'MCH-004', MachineName:'Karıştırıcı D1', Location:'Üretim Alanı', Manufacturer:'Tetra Pak', InstallationDate:'2018-05-08', NominalCapacity:500, OperationalStatus:'Under Maintenance', CriticalityLevel:'High', LastMaintenanceDate:'2024-11-05' },
  { MachineID:'MCH-005', MachineName:'Konveyör Sistemi E1', Location:'Hat-1', Manufacturer:'Siemens', InstallationDate:'2020-09-01', NominalCapacity:3000, OperationalStatus:'Active', CriticalityLevel:'Low', LastMaintenanceDate:'2024-12-15' },
  { MachineID:'MCH-006', MachineName:'Dolum Makinesi A2', Location:'Hat-2', Manufacturer:'Krones AG', InstallationDate:'2022-01-20', NominalCapacity:1200, OperationalStatus:'Active', CriticalityLevel:'Critical', LastMaintenanceDate:'2024-10-28' },
  { MachineID:'MCH-007', MachineName:'Shrink Ambalaj F1', Location:'Hat-3', Manufacturer:'ULMA Packaging', InstallationDate:'2021-04-12', NominalCapacity:900, OperationalStatus:'Active', CriticalityLevel:'Medium', LastMaintenanceDate:'2024-12-05' },
  { MachineID:'MCH-008', MachineName:'Palet Sarma G1', Location:'Depo', Manufacturer:'Robopac', InstallationDate:'2023-02-28', NominalCapacity:150, OperationalStatus:'Idle', CriticalityLevel:'Low', LastMaintenanceDate:'2024-12-20' }
];

// Generate 30 days of production records
function generateProductionRecords() {
  const records = [];
  const shifts = ['Morning','Afternoon','Night'];
  let counter = 1;
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    DEMO_MACHINES.forEach(m => {
      if (m.OperationalStatus === 'Idle' && d < 10) return;
      const shift = shifts[Math.floor(Math.random() * 3)];
      const utilBase = m.MachineID === 'MCH-001' ? 92 : m.MachineID === 'MCH-006' ? 90 : m.MachineID === 'MCH-004' ? 88 : 60 + Math.random() * 25;
      const util = Math.min(100, Math.max(30, utilBase + (Math.random() - 0.5) * 15));
      const runtime = +(util / 100 * 8 + Math.random()).toFixed(1);
      const volume = Math.round(m.NominalCapacity * (util / 100) * (runtime / 8));
      records.push({
        RecordID: `PR-2024-${String(counter++).padStart(5,'0')}`,
        MachineID: m.MachineID,
        RecordedBy: 'USR-002',
        ShiftDate: dateStr,
        ShiftType: shift,
        ProductionVolume: volume,
        CapacityUtilizationRate: +util.toFixed(1),
        RuntimeHours: runtime,
        EntryTimestamp: dateStr + 'T16:00:00Z'
      });
    });
  }
  return records;
}

const DEMO_PRODUCTION_RECORDS = generateProductionRecords();

const DEMO_MAINTENANCE_PLANS = [
  { PlanID:'MP-2024-00001', MachineID:'MCH-001', ApprovedBy:null, RecommendedDate:'2025-01-05', MaintenanceType:'Preventive', RiskScore:91, PlanStatus:'Pending', GeneratedBy:'System', ApprovalTimestamp:null },
  { PlanID:'MP-2024-00002', MachineID:'MCH-006', ApprovedBy:null, RecommendedDate:'2025-01-03', MaintenanceType:'Predictive', RiskScore:88, PlanStatus:'Pending', GeneratedBy:'System', ApprovalTimestamp:null },
  { PlanID:'MP-2024-00003', MachineID:'MCH-004', ApprovedBy:'USR-002', RecommendedDate:'2024-12-28', MaintenanceType:'Corrective', RiskScore:78, PlanStatus:'Approved', GeneratedBy:'USR-002', ApprovalTimestamp:'2024-12-26T10:00:00Z' },
  { PlanID:'MP-2024-00004', MachineID:'MCH-002', ApprovedBy:null, RecommendedDate:'2025-01-10', MaintenanceType:'Preventive', RiskScore:65, PlanStatus:'Pending', GeneratedBy:'System', ApprovalTimestamp:null },
  { PlanID:'MP-2024-00005', MachineID:'MCH-003', ApprovedBy:'USR-002', RecommendedDate:'2024-12-20', MaintenanceType:'Preventive', RiskScore:45, PlanStatus:'Approved', GeneratedBy:'System', ApprovalTimestamp:'2024-12-18T14:00:00Z' },
  { PlanID:'MP-2024-00006', MachineID:'MCH-007', ApprovedBy:null, RecommendedDate:'2025-01-08', MaintenanceType:'Preventive', RiskScore:52, PlanStatus:'Postponed', GeneratedBy:'System', ApprovalTimestamp:null }
];

const DEMO_WORK_ORDERS = [
  { WOID:'WO-2024-00001', PlanID:'MP-2024-00001', MachineID:'MCH-001', AssignedTechnicianID:'USR-004', CreatedBy:'USR-002', PriorityLevel:'Critical', ScheduledDate:'2025-01-05', Status:'Open', CreatedTimestamp:'2024-12-30T09:00:00Z' },
  { WOID:'WO-2024-00002', PlanID:'MP-2024-00002', MachineID:'MCH-006', AssignedTechnicianID:'USR-006', CreatedBy:'USR-002', PriorityLevel:'High', ScheduledDate:'2025-01-03', Status:'Open', CreatedTimestamp:'2024-12-30T09:30:00Z' },
  { WOID:'WO-2024-00003', PlanID:'MP-2024-00003', MachineID:'MCH-004', AssignedTechnicianID:'USR-004', CreatedBy:'USR-002', PriorityLevel:'High', ScheduledDate:'2024-12-28', Status:'In Progress', CreatedTimestamp:'2024-12-26T11:00:00Z' },
  { WOID:'WO-2024-00004', PlanID:'MP-2024-00004', MachineID:'MCH-002', AssignedTechnicianID:'USR-006', CreatedBy:'USR-003', PriorityLevel:'Medium', ScheduledDate:'2025-01-10', Status:'Open', CreatedTimestamp:'2024-12-31T08:00:00Z' },
  { WOID:'WO-2024-00005', PlanID:'MP-2024-00005', MachineID:'MCH-003', AssignedTechnicianID:'USR-004', CreatedBy:'USR-002', PriorityLevel:'Low', ScheduledDate:'2024-12-20', Status:'Completed', CreatedTimestamp:'2024-12-18T15:00:00Z' },
  { WOID:'WO-2024-00006', PlanID:null, MachineID:'MCH-005', AssignedTechnicianID:'USR-007', CreatedBy:'USR-003', PriorityLevel:'Low', ScheduledDate:'2025-01-12', Status:'Open', CreatedTimestamp:'2025-01-02T10:00:00Z' }
];

const DEMO_MAINTENANCE_LOGS = [
  { LogID:'ML-2024-00001', WOID:'WO-2024-00005', MachineID:'MCH-003', TechnicianID:'USR-004', InterventionDate:'2024-12-20', MaintenanceType:'Preventive', DurationHours:1.5, ActionsPerformed:'Rulman değişimi ve yağlama yapıldı. Kayış gerginliği kontrol edildi.', Outcome:'Resolved', CompletionTimestamp:'2024-12-20T11:30:00Z' },
  { LogID:'ML-2024-00002', WOID:'WO-2024-00003', MachineID:'MCH-004', TechnicianID:'USR-004', InterventionDate:'2024-12-28', MaintenanceType:'Corrective', DurationHours:3.0, ActionsPerformed:'Motor arızası tespit edildi. Sargı değişimi başlatıldı, yedek parça bekleniyor.', Outcome:'Partially Resolved', CompletionTimestamp:'2024-12-28T15:00:00Z' },
  { LogID:'ML-2024-00003', WOID:null, MachineID:'MCH-001', TechnicianID:'USR-006', InterventionDate:'2024-11-20', MaintenanceType:'Preventive', DurationHours:2.0, ActionsPerformed:'Genel bakım: filtre değişimi, sensör kalibrasyonu, conta kontrolü.', Outcome:'Resolved', CompletionTimestamp:'2024-11-20T14:00:00Z' },
  { LogID:'ML-2024-00004', WOID:null, MachineID:'MCH-006', TechnicianID:'USR-004', InterventionDate:'2024-10-28', MaintenanceType:'Corrective', DurationHours:4.5, ActionsPerformed:'Valf sızıntısı giderildi. Basınç hattı test edildi.', Outcome:'Resolved', CompletionTimestamp:'2024-10-28T16:30:00Z' },
  { LogID:'ML-2024-00005', WOID:null, MachineID:'MCH-002', TechnicianID:'USR-006', InterventionDate:'2024-12-01', MaintenanceType:'Preventive', DurationHours:1.0, ActionsPerformed:'Robot kol kalibrasyonu ve yazılım güncellemesi.', Outcome:'Resolved', CompletionTimestamp:'2024-12-01T10:00:00Z' }
];

const DEMO_ALERTS = [
  { AlertID:'ALT-2024-00001', MachineID:'MCH-001', AlertType:'Risk Threshold Exceeded', SeverityLevel:'Critical', TriggerValue:91, ThresholdValue:85, AlertTimestamp:'2024-12-30T08:00:00Z', AcknowledgedBy:null, AcknowledgementTimestamp:null },
  { AlertID:'ALT-2024-00002', MachineID:'MCH-006', AlertType:'Risk Threshold Exceeded', SeverityLevel:'Critical', TriggerValue:88, ThresholdValue:85, AlertTimestamp:'2024-12-30T08:05:00Z', AcknowledgedBy:null, AcknowledgementTimestamp:null },
  { AlertID:'ALT-2024-00003', MachineID:'MCH-004', AlertType:'Overdue Maintenance', SeverityLevel:'High', TriggerValue:null, ThresholdValue:null, AlertTimestamp:'2024-12-25T06:00:00Z', AcknowledgedBy:'USR-003', AcknowledgementTimestamp:'2024-12-25T09:00:00Z' },
  { AlertID:'ALT-2024-00004', MachineID:'MCH-002', AlertType:'Risk Threshold Exceeded', SeverityLevel:'Medium', TriggerValue:65, ThresholdValue:60, AlertTimestamp:'2024-12-31T07:00:00Z', AcknowledgedBy:null, AcknowledgementTimestamp:null },
  { AlertID:'ALT-2024-00005', MachineID:'MCH-007', AlertType:'Anomaly Detected', SeverityLevel:'Low', TriggerValue:52, ThresholdValue:60, AlertTimestamp:'2025-01-01T12:00:00Z', AcknowledgedBy:null, AcknowledgementTimestamp:null }
];

const DEMO_AUDIT_LOG = [
  { id:1, userId:'USR-001', action:'Kullanıcı oluşturuldu: USR-007', timestamp:'2024-02-10T08:00:00Z' },
  { id:2, userId:'USR-002', action:'Bakım planı onaylandı: MP-2024-00003', timestamp:'2024-12-26T10:00:00Z' },
  { id:3, userId:'USR-002', action:'İş emri oluşturuldu: WO-2024-00001', timestamp:'2024-12-30T09:00:00Z' },
  { id:4, userId:'USR-003', action:'Alert onaylandı: ALT-2024-00003', timestamp:'2024-12-25T09:00:00Z' },
  { id:5, userId:'USR-004', action:'Bakım log kaydı: ML-2024-00002', timestamp:'2024-12-28T15:00:00Z' },
  { id:6, userId:'USR-002', action:'Üretim verisi girildi: MCH-001', timestamp:'2025-01-02T16:00:00Z' },
  { id:7, userId:'USR-001', action:'Alert eşiği güncellendi: Critical → 85', timestamp:'2025-01-02T11:00:00Z' }
];

// Risk scores per machine (pre-calculated)
function calculateRiskScores() {
  const scores = {};
  DEMO_MACHINES.forEach(m => {
    const records = DEMO_PRODUCTION_RECORDS.filter(r => r.MachineID === m.MachineID);
    const last3 = records.slice(-3);
    const avgUtil = last3.length ? last3.reduce((s,r) => s + r.CapacityUtilizationRate, 0) / last3.length : 50;
    const lastMaint = new Date(m.LastMaintenanceDate);
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

const RISK_SCORES = calculateRiskScores();

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

const OEE_TREND = generateOEEData();

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
