# PM-DSS: Production Intensity-Based Intelligent Machine Maintenance Planning System

## 1. System Overview

The PM-DSS (Production Maintenance Decision Support System) is a specialized Information System designed to support managerial decision-making within Fast-Moving Consumer Goods (FMCG) production facilities. 

In high-volume manufacturing, equipment breakdowns lead to significant financial losses. Traditional maintenance is often either reactive (waiting for a breakdown) or strictly calendar-based (maintaining equipment regardless of how heavily it was used). This system solves that problem by acting as a **Decision Support System (DSS)** that connects real-world production intensity data directly to maintenance planning. By tracking how hard a machine is working and calculating dynamic risk scores, the system provides managers with actionable information to schedule maintenance precisely when needed, optimizing both production uptime and maintenance costs.

---

## 2. System Modules

### Data Acquisition and Integration
*   **What it does:** Collects raw operational data from the factory floor.
*   **Inputs:** Production volumes, shift durations, and machine operating hours entered by production staff.
*   **Outputs:** Structured historical production records and machine utilization metrics.
*   **Who uses it:** Production Managers use this module to input data; the system uses it as the foundational data for all calculations.

### Data Processing and Risk Assessment
*   **What it does:** Analyzes raw data to evaluate the current health and failure probability of each machine.
*   **Inputs:** Machine criticality levels, historical maintenance logs, and recent production utilization rates.
*   **Outputs:** A dynamic "Risk Score" (0-100) for every machine.
*   **Who uses it:** The system uses this internally to generate automated plans. Management uses the risk score to prioritize asset allocation.

### Maintenance Planning and Scheduling
*   **What it does:** Translates high risk scores into actionable plans and assigns tasks to personnel.
*   **Inputs:** Machine Risk Scores, technician availability, and current maintenance backlog.
*   **Outputs:** Proposed Maintenance Plans and actionable Work Orders.
*   **Who uses it:** Maintenance Managers use this to approve schedules; Technicians use it to know what work needs to be done.

### Alert and Notification Management
*   **What it does:** Monitors system parameters and proactively warns users when thresholds are breached.
*   **Inputs:** Live Risk Scores, declining OEE (Overall Equipment Effectiveness) trends, and predefined warning thresholds.
*   **Outputs:** Visual alerts, notifications, and status changes on dashboards.
*   **Who uses it:** Production and Maintenance Managers use this to react quickly to emerging anomalies before they cause breakdowns.

### Reporting and Dashboard
*   **What it does:** Aggregates and visualizes system data into comprehensive summaries for quick interpretation.
*   **Inputs:** All transactional data (Work Orders, Production Records, Maintenance Logs).
*   **Outputs:** Key Performance Indicators (KPIs), trend graphs, and risk grid visualizations.
*   **Who uses it:** Senior Management and all Managers use these dashboards to make strategic and tactical decisions regarding factory performance.

### User Management and Security
*   **What it does:** Controls who can access the system and what information they can view or modify.
*   **Inputs:** User credentials, role assignments, and department data.
*   **Outputs:** Authenticated sessions, access tokens, and audit logs of system activity.
*   **Who uses it:** System Administrators use this to maintain data integrity and organizational hierarchy.

---

## 3. Pages and Their Purpose

*   **Dashboard (Role-Based)**
    *   **Shows:** A customized view of KPIs, active alerts, and pending tasks tailored to the user's role.
    *   **Actions:** Users can click to view detailed reports or acknowledge urgent alerts.
    *   **System Impact:** Reads data from almost all modules to provide a real-time snapshot of factory status.

*   **Production Data Entry**
    *   **Shows:** Forms for recording shift performance.
    *   **Actions:** Users input machine IDs, shift dates, and production volumes.
    *   **System Impact:** Writes new Production Records to the database, which immediately triggers the Data Processing module to recalculate Capacity Utilization and Risk Scores.

*   **Maintenance Plans**
    *   **Shows:** A list of system-generated recommendations for preventive maintenance.
    *   **Actions:** Managers can 'Approve' or 'Postpone' these plans.
    *   **System Impact:** Approving a plan updates its status and signals the system to generate a corresponding Work Order for a technician.

*   **Work Orders**
    *   **Shows:** A list of active, pending, or completed maintenance tasks.
    *   **Actions:** Managers can create new work orders or reassign existing ones.
    *   **System Impact:** Writes new Work Order records. Changes here dictate what tasks appear on the Technicians' screens.

*   **Maintenance Log Entry**
    *   **Shows:** A form for technicians to document completed work.
    *   **Actions:** Technicians log the duration of the repair, parts used, and the final outcome.
    *   **System Impact:** Closes the active Work Order, resets the machine's Risk Score, and feeds data into the MTTR (Mean Time To Repair) KPI calculations.

*   **Alert Management**
    *   **Shows:** A comprehensive list of all system warnings.
    *   **Actions:** Managers can review and 'Acknowledge' alerts.
    *   **System Impact:** Updates the alert status, removing it from the active dashboard view and logging the acknowledgement time for accountability.

*   **Reports / Analytics**
    *   **Shows:** Long-term historical trends and generated PDF summaries.
    *   **Actions:** Users can view charts or download reports.
    *   **System Impact:** Primarily a read-only operation that aggregates vast amounts of historical data for strategic review.

*   **User Management & Audit Log**
    *   **Shows:** Lists of user accounts and a chronological log of all system actions.
    *   **Actions:** Admins can add/deactivate users and review who did what.
    *   **System Impact:** Modifies the User data store and reads the Audit data store to ensure system security.

*   **Alert Configuration (Settings)**
    *   **Shows:** Threshold settings for various KPIs.
    *   **Actions:** Managers define at what numerical value a warning should be triggered.
    *   **System Impact:** Updates the business logic parameters used by the Alert and Notification Management module.

---

## 4. User Roles and Information Access

### Maintenance Technician
*   **Information Needed:** Specific, tactical details about what machine is broken, where it is, and what needs to be fixed (Work Orders).
*   **Decisions Made:** Decides the specific technical intervention required to repair the machine.
*   **Data Produced:** Maintenance Logs detailing how long the repair took and what actions were performed.

### Production Manager
*   **Information Needed:** Real-time visibility into machine availability, OEE trends, and alerts that might stop production.
*   **Decisions Made:** Decides whether to push a machine harder to meet quotas or release it to maintenance to avoid a critical failure.
*   **Data Produced:** Production shift records (volumes and running hours).

### Maintenance Manager
*   **Information Needed:** Fleet-wide risk scores, MTBF/MTTR metrics, and the status of all ongoing Work Orders.
*   **Decisions Made:** Decides which maintenance plans to approve, how to prioritize the backlog, and which technician to assign to a critical failure.
*   **Data Produced:** Approved Maintenance Plans and new Work Orders.

### Senior Management
*   **Information Needed:** High-level, aggregated information. They need to see Fleet OEE, total downtime costs, and top risk assets.
*   **Decisions Made:** Strategic decisions regarding capital expenditures (e.g., "Do we buy a new machine or keep repairing this old one?").
*   **Data Produced:** Generally produces no direct transactional data; acts as an information consumer.

### System Admin
*   **Information Needed:** System health metrics, user access requests, and audit logs.
*   **Decisions Made:** Decides access levels and system configuration parameters.
*   **Data Produced:** User accounts and system configuration settings.

---

## 5. Information Flows

The PM-DSS relies on continuous feedback loops to function effectively. Here are three critical information flows:

*   **Flow 1: Production to Risk Generation**
    *   Production Manager enters shift data → System calculates Capacity Utilization → System updates the Machine Risk Score → If the score crosses a threshold, the System triggers an Alert → Maintenance Manager receives the alert on their dashboard.

*   **Flow 2: Automated Planning to Execution**
    *   System detects a high Risk Score → System automatically generates a proposed Maintenance Plan → Maintenance Manager reviews and approves the plan → System converts the plan into an actionable Work Order → Technician receives the Work Order on their screen.

*   **Flow 3: Maintenance Execution to Metric Recalculation (Feedback Loop)**
    *   Technician finishes a repair and submits a Maintenance Log → System marks the Work Order as 'Completed' → System resets the Machine's Risk Score to a safe level → System uses the repair duration to recalculate the facility's MTTR (Mean Time To Repair) → Dashboards update to reflect improved metrics.

---

## 6. Key Performance Indicators (KPIs)

*   **OEE (Overall Equipment Effectiveness)**
    *   **What it measures:** The gold standard for measuring manufacturing productivity. It indicates the percentage of manufacturing time that is truly productive.
    *   **Calculation (Conceptual):** Availability × Performance × Quality.
    *   **Decision Supported:** Helps management identify bottlenecks and decide if process improvements are needed on the factory floor.

*   **MTBF (Mean Time Between Failures)**
    *   **What it measures:** The average time a machine operates seamlessly before breaking down.
    *   **Calculation (Conceptual):** Total operational hours divided by the number of breakdowns.
    *   **Decision Supported:** Helps the Maintenance Manager decide the optimal frequency for preventive maintenance. A dropping MTBF indicates a deteriorating machine.

*   **MTTR (Mean Time To Repair)**
    *   **What it measures:** The average time it takes to fix a machine and return it to production.
    *   **Calculation (Conceptual):** Total downtime spent on repairs divided by the number of repairs.
    *   **Decision Supported:** Helps evaluate the efficiency of the maintenance team. High MTTR might lead to decisions regarding better technician training or stocking spare parts closer to the machines.

*   **Risk Score**
    *   **What it measures:** A predictive metric indicating the likelihood of an imminent machine failure.
    *   **Calculation (Conceptual):** A weighted algorithm combining production intensity (how hard it worked recently), machine age, and historical breakdown frequency.
    *   **Decision Supported:** Allows managers to shift from reactive maintenance to predictive maintenance, prioritizing machines with the highest risk.

*   **Capacity Utilization Rate**
    *   **What it measures:** How much of a machine's potential output is actually being realized.
    *   **Calculation (Conceptual):** Actual production volume divided by maximum possible production volume in a given timeframe.
    *   **Decision Supported:** Supports production planning; if utilization is too high, it increases wear-and-tear; if too low, the factory is losing money on idle assets.

---

## 7. Data Stores

To support its operations, the system relies on several core tables (entities) to store real-world information:

*   **Machine:** Holds the static and slowly changing facts about physical factory equipment, such as its name, physical location, maximum production capacity, and its baseline criticality to the overall operation.
*   **Production Record:** The historical ledger of manufacturing output. It records exactly how much product was made on a specific machine during a specific shift, and how long the machine ran.
*   **Maintenance Plan:** The "future" table. It stores system-generated proposals for upcoming maintenance work that has not yet been approved or scheduled.
*   **Work Order:** The "present" table. It holds the actual task tickets assigned to technicians, including priority levels and current status (e.g., Open, In Progress).
*   **Maintenance Log:** The "historical" table for repairs. It stores the permanent record of what was actually done to a machine, who did it, what type of maintenance it was, and how long it took.
*   **Alert:** A repository of all system-generated warnings, storing what the warning was, when it triggered, and whether a manager has acknowledged it.
*   **User:** The personnel directory, storing login credentials, names, departments, and assigned roles (which dictate their access rights within the system).
