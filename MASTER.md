Sen kıdemli bir full stack web geliştiricisi ve UX tasarımcısısın. FMCG üretim tesisleri için bir Karar Destek Bilgi Sistemi (DSS) geliştirmeni istiyorum.

Sistem adı: Production Intensity-Based Intelligent Machine Maintenance Planning Information System (PM-DSS)

---

## AMAÇ

FMCG üretim tesislerinde makine bakım planlamasını sabit takvim yerine gerçek üretim yoğunluğu verilerine (üretim hacmi, çalışma saati, kapasite kullanım oranı) göre dinamik olarak optimize eden, rol bazlı bir web uygulaması geliştir.

---

## KULLANICI ROLLERİ VE YETKİLERİ

Sistem 5 kullanıcı rolü içerir. Her rol yalnızca kendi ekranlarına erişebilir (RBAC):

1. **Maintenance Technician (Teknisyen)**
   - Üzerine atanan iş emirlerini görür (mobil uyumlu)
   - Bakım log kaydı girer (aksiyon, süre, sonuç)
   - Alert bildirimlerini onaylar
   - Plan oluşturamaz, kullanıcı yönetemez

2. **Production Manager (Üretim Müdürü)**
   - Dashboard: OEE, Risk Score, aktif alertler, bekleyen iş emirleri
   - Üretim verisi girişi (vardiya bazlı)
   - Bakım planını onaylar / modifiye eder / erteler
   - İş emri oluşturur ve teknisyene atar
   - Raporları görüntüler ve indirir

3. **Maintenance Manager (Bakım Müdürü)**
   - Tüm iş emirleri kuyruğunu yönetir
   - MTBF, MTTR, OEE KPI'larını izler
   - Kritik alertleri escalate eder
   - Teknisyen performansını görür
   - Alert eşik değerlerini yapılandırır

4. **Senior Management**
   - Yalnızca okuma yetkisi
   - Executive dashboard: Fleet OEE, toplam downtime, en riskli 5 makine
   - PDF rapor indirir
   - Drill-down: makine bazlı detay

5. **System Admin**
   - Kullanıcı hesapları oluşturur / düzenler
   - Rol ataması yapar
   - Alert eşiklerini yapılandırır
   - Audit log'a erişir

---

## VERİTABANI TABLOLARI

Aşağıdaki 7 tablo ile çalış. Tüm tablolar birbiriyle foreign key ile ilişkilidir:

### MACHINE
- MachineID (PK, örn: MCH-001)
- MachineName, Location, Manufacturer
- InstallationDate, NominalCapacity (birim/saat)
- OperationalStatus: Active | Under Maintenance | Idle
- CriticalityLevel: Low | Medium | High | Critical
- LastMaintenanceDate

### PRODUCTION_RECORD
- RecordID (PK, örn: PR-2024-00001)
- MachineID (FK), RecordedBy (FK → USER)
- ShiftDate, ShiftType: Morning | Afternoon | Night
- ProductionVolume, CapacityUtilizationRate (0-100%)
- RuntimeHours, EntryTimestamp

### MAINTENANCE_PLAN
- PlanID (PK, örn: MP-2024-00001)
- MachineID (FK), ApprovedBy (FK → USER)
- RecommendedDate, MaintenanceType: Preventive | Corrective | Predictive
- RiskScore (0-100), PlanStatus: Pending | Approved | Postponed | Cancelled
- GeneratedBy: System | UserID
- ApprovalTimestamp

### WORK_ORDER
- WOID (PK, örn: WO-2024-00001)
- PlanID (FK), MachineID (FK)
- AssignedTechnicianID (FK → USER), CreatedBy (FK → USER)
- PriorityLevel: Low | Medium | High | Critical
- ScheduledDate, Status: Open | In Progress | Completed | Cancelled
- CreatedTimestamp

### MAINTENANCE_LOG
- LogID (PK, örn: ML-2024-00001)
- WOID (FK), MachineID (FK), TechnicianID (FK → USER)
- InterventionDate, MaintenanceType
- DurationHours, ActionsPerformed (metin)
- Outcome: Resolved | Partially Resolved | Escalated
- CompletionTimestamp

### ALERT
- AlertID (PK, örn: ALT-2024-00001)
- MachineID (FK)
- AlertType: Risk Threshold Exceeded | Overdue Maintenance | Anomaly Detected
- SeverityLevel: Low | Medium | High | Critical
- TriggerValue, ThresholdValue
- AlertTimestamp, AcknowledgedBy (FK → USER), AcknowledgementTimestamp

### USER
- UserID (PK, örn: USR-001)
- FullName, Role (Technician | Production Manager | Maintenance Manager | Senior Management | Admin)
- Department, Email, Phone
- AccountStatus: Active | Inactive | Suspended
- CreatedTimestamp

---

## RİSK SKORU HESAPLAMA MANTIĞI

Sistem her vardiyanın ardından her makine için risk skoru hesaplar:

RiskScore = (0.40 × CapacityUtilizationRate) + (0.35 × NormalizedRuntimeHours) + (0.25 × HistoricalFailureFrequency)

- CapacityUtilizationRate: son 3 vardiyanın ortalaması
- NormalizedRuntimeHours: son bakımdan bu yana geçen toplam saat / makine bakım eşiği
- HistoricalFailureFrequency: son 90 günde corrective log sayısı (normalize edilmiş)

**Threshold Kuralları:**
- RiskScore < 60 → Yeşil, eylem yok
- 60 ≤ RiskScore < 85 → Sarı, bakım planı önerisi oluştur
- RiskScore ≥ 85 → Kırmızı, otomatik SYSTEM_GENERATED_PLAN + ALERT tetikle

---

## ALERT GÖNDERIM KURALLARI

- Low / Medium severity → Yalnızca dashboard bildirimi
- High severity → Dashboard + Email (Production Manager)
- Critical severity → Dashboard + Email + SMS (Production Manager + Maintenance Manager)

---

## UYGULAMA EKRANLARI

### Giriş (Tüm Roller)
- Login sayfası: email + şifre
- Rol tespitine göre otomatik yönlendirme

### Production Manager Dashboard
- KPI kartları: OEE (%), MTBF (saat), Aktif Alert sayısı, Bekleyen İş Emri sayısı
- Makine risk skoru ısı haritası (makine grid, renk kodlu: yeşil/sarı/kırmızı)
- OEE trend grafiği (son 30 gün, çizgi grafik)
- Bekleyen bakım planları listesi (Onayla / Modifiye Et / Ertele butonları)
- Üretim verisi giriş formu: MachineID seç, vardiyanı seç, ProductionVolume, RuntimeHours gir

### Maintenance Technician (Mobil Uyumlu)
- Üzerime Atanan İş Emirleri listesi (priority badge renk kodlu)
- İş Emri Detay: makine konumu, bakım tipi, son bakım tarihi, talimatlar
- Bakım Log Formu: WOID otomatik, MaintenanceType, DurationHours, ActionsPerformed, Outcome seç
- Alert bildirimleri: Onayla butonu

### Maintenance Manager Dashboard
- Tüm açık iş emirleri tablosu (filtrele: priority, status, makine, teknisyen)
- KPI paneli: MTBF, MTTR, Ortalama Risk Skoru, Aylık Downtime
- MTBF/MTTR çift eksenli trend grafiği (90 gün)
- Teknisyen performans tablosu: tamamlanan WO, Ortalama MTTR, completion rate %
- Alert yönetimi: escalate, acknowledge, threshold ayarla

### Senior Management Executive Dashboard
- OEE performans göstergesi (gauge chart)
- En riskli 5 makine (Risk Score sıralaması)
- Maliyet vs Downtime scatter grafiği
- Toplam aylık downtime, toplam bakım sayısı
- PDF rapor indir butonu

### System Admin
- Kullanıcı listesi: CRUD işlemleri, rol atama
- Alert eşik yapılandırması: her makine tipi için yellow/red threshold
- Audit log görüntüleme: kullanıcı, aksiyon, timestamp

---

## DEMO VERİ

Gerçekçi demo verisi oluştur:
- 8 makine (farklı CriticalityLevel ve Location)
- 3 farklı kullanıcı tipi için birer demo hesap
- Son 30 günlük üretim kayıtları (bazı makineler yüksek kullanım oranına sahip olsun)
- Birkaç onay bekleyen bakım planı, açık iş emri ve aktif alert
- Risk skoru 85+ olan en az 2 kritik makine

Demo giriş bilgileri ekrana küçük bir yardım notu olarak ekle.

---

## TEKNİK GEREKSINIMLER

- **Frontend:** Modern web arayüzü, responsive (mobil öncelikli)
- **Renk paleti:** 
  - Ana renk: Koyu mavi/lacivert (endüstriyel görünüm)
  - Vurgu: Teal/yeşil 
  - Alert renkleri: Yeşil (#22c55e) / Sarı (#eab308) / Kırmızı (#ef4444) / Gri
  - Yüzey: Açık gri arka plan, beyaz kartlar
- **Grafikler:** OEE trend çizgi grafik, risk ısı haritası, MTBF/MTTR dual-axis, gauge chart
- **Navigasyon:** Sol sidebar (rol bazlı menü), üst bar (kullanıcı adı, bildirim zili, çıkış)
- **Dil:** Türkçe arayüz, İngilizce teknik terimler (OEE, MTBF, MTTR, Risk Score vs.)
- **Veri bağlantısı:** Supabase PostgreSQL veritabanı kullan
- **Yayın:** Vercel'e deploy edilecek

---

## KPI EŞİK DEĞERLERİ (Dashboard Renk Kodları)

| KPI | Yeşil | Sarı | Kırmızı |
|---|---|---|---|
| OEE | ≥ %85 | %75–84 | < %75 |
| MTBF | ≥ 720 saat | 360–720 saat | < 360 saat |
| MTTR | ≤ 2 saat | 2–4 saat | > 4 saat |
| Risk Score | < 60 | 60–84 | ≥ 85 |
| Aktif Alert (Critical) | 0 | 1–2 | 3+ |

---

## ÖNEMLİ KISITLAR

Bu sistemin kapsamı DIŞINDA olan özellikler (geliştirme):
- Yedek parça stok yönetimi
- Bakım ekibi vardiya çizelgeleme
- Kalite kontrol / ürün kusur takibi
- IoT sensör entegrasyonu (opsiyonel, sonraya bırak)

---

Eksik bir bilgi yoksa direkt geliştirmeye başla. Önce veritabanı şemasını oluştur, ardından her rolün arayüzünü geliştir. Her sayfayı bitirince bir sonrakine geç ve GitHub'a push et.