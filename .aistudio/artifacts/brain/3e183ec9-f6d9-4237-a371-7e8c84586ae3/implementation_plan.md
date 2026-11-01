# Master Production Report R06 - Digital Replica & Management System

A production filling and monitoring system replicating the physical **Master Production Report R06** paper format. The system features multi-user authentication with Role-Based Access Control (RBAC), dynamic delay calculations, a Master Data management section for department explanations, searchable report records, and pixel-accurate PDF export compatible with both desktop and mobile devices.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following decisions during Phase 1 clarification:
> - **Master File Data**: Pre-populate standard industrial departments (Production, Maintenance, Electrical, Mechanical, Quality, Tooling) with their corresponding explanations, while providing a Master File management section for full customization.
> - **Mobile & PC Experience**: Provide a responsive, touch-friendly input mode on mobile devices paired with an exact 1:1 paper replica layout for visual inspection and PDF generation.
> - **Persistence**: Use Firebase Firestore for persistent cloud data synchronization across users and sessions, paired with robust offline synchronization.

- **Confirmed Decision 1**: Pre-configured user credentials (`PRODUCTION1` through `PRODUCTION5`, `SUPERUSER` with password `1234`), with Super User ability to create new users and assign Read-Only or Write permissions.
- **Confirmed Decision 2**: Automatic underlining for selected machine line (`T1`, `T2`, `T3`, `T4`, `T5`, `C1`, `C2`, `PURLIN`), shift (`Day`, `Night`), product type (`Pipe`, `Bar`), and saw blade type (`HSS`, `TCT`, `PT4–PT7`).
- **Confirmed Decision 3**: Automated calculations for delay duration (From/To $\rightarrow$ Minutes) and cumulative Total Downtime.

---

## 1. Overview & Core Concept

- **What It Does**: Digitizes the physical "Master Production Report R06" paper logging sheet. Factory floor operators and supervisors can quickly log shifts, coil consumption, product bundles, damage metrics, equipment delays, and saw blade cuts. Super Users can manage users, control access permissions (read-only vs write), configure delay categories, and inspect historical reports.
- **Target Audience / Persona**:
  - *Mill Operators & Shift-In-Charge*: Rapidly fill shift logs during or after mill runs without repetitive manual math.
  - *Production Engineers & General Managers*: Review historical logs, filter downtime by department, audit damage metrics, and print or download official archival PDFs.
  - *Super User / System Admin*: Manage team accounts, set read/write permissions, and maintain delay explanation taxonomies.
- **Key Value**: Eliminates paperwork loss and manual downtime calculation errors while preserving the exact layout and signature audit fields familiar to shop-floor staff.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Authentication Screen**:
   - Clean industrial authentication card with username and password.
   - Quick-switch selector or credential input supporting pre-loaded users (`PRODUCTION1`–`PRODUCTION5`, `SUPERUSER`).
   - Role badge display (Super User vs Production Operator) upon authentication.

2. **Dashboard & Report History View**:
   - Top action bar featuring a search input, date range filters, machine line filter, and a prominent "+ New Production Report" button.
   - Comprehensive records table displaying: Date, Shift, Line, Product, Operator, Total Bundles, Total Downtime, Prepared By, and Actions.
   - Action controls for each record: **View / Edit** (respects write permissions) and **Download PDF**.
   - Accessible navigation tab for **Master File** (Department & Explanations) and **User Management** (exclusive to Super User).

3. **Master Production Report R06 Entry View (Replica Form)**:
   - **Header Card / Sheet Top**:
     - Date picker (calendar modal or native input).
     - Production Line selector (`T1`, `T2`, `T3`, `T4`, `T5`, `C1`, `C2`, `PURLIN`) with distinct underline indicator.
     - Operator name, Operational Time span, and Size fields.
     - Shift toggle (`Day` / `Night`) with active underline.
     - Avg Mill Speed and Shift Duration text inputs.
     - Product toggle (`Pipe` / `Bar`) with active underline.
   - **Table 1: Production Details**:
     - Multi-column grid matching the paper format: Thickness & Length, No. of Bundles & Bars, Loose Bars, RM Consumption (No. of Coils) for 2 to 3 size specs.
   - **Table 2: Damage Details**:
     - Synchronized columns for Welded Bars, Scrap Bars, Print Issue / Zn Issue, and Black Patch / White Patch.
   - **Table 3: Delays & Downtime**:
     - Dynamic rows with Time From, Time To, auto-computed Duration in minutes/hours.
     - Cascading Department dropdown (e.g. *Production*, *Mechanical*, *Electrical*).
     - Dependent Explanation dropdown populated exclusively with reasons registered to the selected department.
     - Live auto-calculated **Total Downtime** callout.
   - **Table 4: Saw Cutter Details & Remarks**:
     - Blade type (`HSS` / `TCT`) and blade code (`PT4`, `PT5`, `PT6`, `PT7`), Serial Number, Total Cuts, Total Weight (MT).
     - Multiline Remarks & Suggestions box.
   - **Sign-off Footer**:
     - Prepared By (Shift In Charge), Issue No, Reviewed by (MD), Checked By (Production Engineer), Date of Issue, Approved by (GM).
   - **Actions**:
     - "Submit Report" button (with real-time validation and permission verification).
     - "Download as PDF" button (renders high-fidelity printable document replica).
     - "Back to Reports" navigation.

4. **Master File Management**:
   - Manage Departments: Add new department names, edit or remove existing ones.
   - Manage Explanations: Add specific delay reasons mapped directly to individual departments (e.g. Production $\rightarrow$ "Roll Change", "Limit switch alarm", "Scrap Packing").

5. **User Management (Super User only)**:
   - Table of all users (`PRODUCTION1`–`PRODUCTION5`, `SUPERUSER`, and custom created accounts).
   - Toggle switches for **Form Access** (`Read-Only` vs `Read & Write`).
   - Modal to create new users with custom username, initial password, and assigned permission level.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density industrial technical sheet aesthetic. Clean off-white/slate grid layout with crisp tabular boundaries, sharp borders, and tactile selection states.
- **Color Palette**:
  - Dominant Canvas: Industrial off-white (`#F8FAFC`) with pure white sheet surface (`#FFFFFF`).
  - Structural Borders & Grids: Technical slate hairline dividers (`#CBD5E1` and `#94A3B8`).
  - Active Underline / Primary Accent: Rich industrial cobalt (`#1E40AF` / `#2563EB`) and deep charcoal (`#0F172A`).
  - Status Indicators: Subtle emerald for verified submissions (`#059669`) and amber for delay notifications (`#D97706`).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` for crisp titles and section dividers.
  - Tabular & Numerical Data: `font-mono` / `tabular-nums` (`JetBrains Mono` / `IBM Plex Mono`) for millimeter sizes, coil counts, times, and mill speed.
  - Underline Motif: Thick bottom border (`border-b-2 border-slate-900`) mirroring handwritten pen underlines on physical industrial forms.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Mode View (Paper Replica + Responsive Form)**
  - *Chosen Approach*: On wide screens (PC/tablets), render the report directly within the authentic paper grid structure with in-cell inputs. On mobile viewports, present a clean stacked accordion or sectioned flow, while retaining the exact paper grid for the PDF generation canvas.
  - *Why*: Direct grid editing on phone screens can cause excessive horizontal scrolling; providing responsive entry controls while preserving the exact layout in PDF export guarantees high usability across all devices.
- **Decision 2: Time & Delay Calculation Engine**
  - *Chosen Approach*: Parse time inputs (`HH:mm` or `08:00 AM/PM`), calculate the precise delta in minutes accounting for midnight crossovers (e.g., `08:00 PM` to `06:00 AM`), and format both as `XX Min` / `XXH YYM` and total cumulative downtime.
  - *Why*: Eliminates human error in shift downtime calculations.
- **Decision 3: Firebase Integration with Graceful Local Sync**
  - *Chosen Approach*: Configure Firebase Firestore using the mandatory AI Studio Firebase setup workflow (`show_aistudio_ui` $\rightarrow$ `GetFirebaseTos` $\rightarrow$ `ProvisionFirebase`). Back this with local cache persistence so operators can continue testing and logging without disruption.
- **Decision 4: High-Fidelity PDF Export**
  - *Chosen Approach*: Build a dedicated Print/PDF renderer component replicating the exact dimensions, borders, stamps, and layout of "Master Production Report R06", using `window.print` styling and client-side PDF capture.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App Container                             │
│                  (Auth Context & RBAC Access Guard)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────┐                               ┌────────────────────┐
│   Login Screen    │                               │  Main Application  │
│  - User Select    │                               │     Dashboard      │
│  - Password Check │                               └──────────┬─────────┘
└───────────────────┘                                          │
                                    ┌──────────────────────────┴─────────────────────────┐
                                    ▼                          ▼                         ▼
                         ┌────────────────────┐     ┌────────────────────┐    ┌────────────────────┐
                         │ Submitted Reports  │     │ Master File Center │    │  User Management   │
                         │    Data Table      │     │ (Dept & Reasons)   │    │  (Super User Only) │
                         │ - Search & Filter  │     └────────────────────┘    └────────────────────┘
                         │ - View/Edit/PDF    │
                         └──────────┬─────────┘
                                    │
                                    ▼
                         ┌───────────────────────────────────────────────┐
                         │       Master Production Report R06 Form       │
                         │ ┌───────────────────────────────────────────┐ │
                         │ │ Header (Line, Date, Shift, Product)       │ │
                         │ ├───────────────────────────────────────────┤ │
                         │ │ Table 1: Production Details               │ │
                         │ ├───────────────────────────────────────────┤ │
                         │ │ Table 2: Damage Details                   │ │
                         │ ├───────────────────────────────────────────┤ │
                         │ │ Table 3: Delays & Downtime (Auto-Calc)    │ │
                         │ ├───────────────────────────────────────────┤ │
                         │ │ Table 4: Saw Cutter Details & Remarks     │ │
                         │ ├───────────────────────────────────────────┤ │
                         │ │ Footer: Sign-offs & Authorizations        │ │
                         │ └───────────────────────────────────────────┘ │
                         │ ┌───────────────────────────────────────────┐ │
                         │ │ Action Bar: Submit Report / PDF Download  │ │
                         │ └───────────────────────────────────────────┘ │
                         └───────────────────────────────────────────────┘
```

### Data Models

```typescript
interface UserProfile {
  id: string;
  username: string; // e.g. "PRODUCTION1", "SUPERUSER"
  passwordHash: string; // "1234" (encrypted/hashed)
  role: 'super' | 'production';
  formAccess: 'read' | 'write';
  createdAt: string;
}

interface DelayEntry {
  id: string;
  fromTime: string; // e.g. "08:00"
  toTime: string;   // e.g. "08:10"
  durationMinutes: number; // e.g. 10
  department: string;      // e.g. "Production"
  explanation: string;     // e.g. "Machine Starting"
}

interface ProductionSizeColumn {
  sizeLabel: string; // e.g. "2 inch", "3 x 1 1/2"
  thickness: string; // e.g. "2MM"
  length: string;    // e.g. "5.8M"
  bundles: string;   // e.g. "12"
  bars: string;      // e.g. "444"
  looseBars: string; // e.g. "15"
  coils: string;     // e.g. "09"
}

interface DamageSizeColumn {
  sizeLabel: string;
  weldedBars: string;
  scrapBars: string;
  printZnIssue: string;
  blackWhitePatch: string;
}

interface ProductionReport {
  id: string;
  reportNumber: string; // e.g. "R06-20261101-01"
  date: string;         // YYYY-MM-DD
  productionLine: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'C1' | 'C2' | 'PURLIN';
  operator: string;
  operationalTime: string;
  sizeDescription: string;
  shift: 'Day' | 'Night';
  avgMillSpeed: string;
  shiftDuration: string;
  product: 'Pipe' | 'Bar';
  productionColumns: ProductionSizeColumn[];
  damageColumns: DamageSizeColumn[];
  delays: DelayEntry[];
  totalDowntimeMinutes: number;
  sawCutter: {
    bladeType: 'HSS' | 'TCT';
    bladeCode: 'PT4' | 'PT5' | 'PT6' | 'PT7' | string;
    serialNumber: string;
    totalNoOfCuts: string;
    totalWeightMt: string;
  };
  remarks: string;
  signOff: {
    preparedByName: string;
    issueNo: string;
    reviewedBy: string;
    checkedByName: string;
    dateOfIssue: string;
    approvedBy: string;
  };
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
}

interface DepartmentCategory {
  id: string;
  name: string; // e.g. "Production", "Maintenance", "Electrical"
  explanations: string[]; // e.g. ["Machine Starting", "Roll Change", ...]
}
```

---

## 5. Implementation Phases

1. **Step 1 - Firebase Setup UI Flow**: Initiate `show_aistudio_ui` for Firebase provisioning as requested by the user, verify terms, and generate `firebase-blueprint.json` and security rules.
2. **Step 2 - Domain Core & State Management**: Create initial user registry (`PRODUCTION1`–`5`, `SUPERUSER`), pre-populate Master File department/explanation mappings, and implement local-first caching with Firestore syncing.
3. **Step 3 - Authentication & Dashboard View**: Build the login interface with role detection, and the submitted reports data table with search, line filters, and access-controlled action triggers.
4. **Step 4 - Master Production Report R06 Replica**: Construct the physical form replica with interactive line/shift/product underline selectors, synchronized production/damage grids, cascading delay dropdowns, and automatic downtime computation.
5. **Step 5 - Master File & User Management Screens**: Create modal/views for adding/editing departments and explanations, and for Super User management of user roles and write permissions.
6. **Step 6 - PDF Generator & Print Styles**: Implement the pixel-accurate export engine ensuring downloaded PDFs exactly match the physical report card.
7. **Step 7 - Verification & Polish**: Ensure seamless responsiveness across PC and mobile phones, test all calculations, and run TypeScript compilation.
