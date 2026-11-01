export type MachineLine = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'C1' | 'C2' | 'PURLIN';
export type ShiftType = 'Day' | 'Night';
export type ProductType = 'Pipe' | 'Bar';
export type BladeType = 'HSS' | 'TCT';
export type BladeCode = 'PT4' | 'PT5' | 'PT6' | 'PT7' | string;
export type UserRole = 'super' | 'production';
export type FormAccess = 'read' | 'write';

export interface UserProfile {
  id: string;
  username: string;
  password: string; // "1234"
  role: UserRole;
  formAccess: FormAccess; // read-only or write
  createdAt: string;
}

export interface ProductionColumnData {
  sizeHeader: string; // e.g. "2inch", "3 x 1 1/2"
  thickness: string;  // e.g. "2MM"
  length: string;     // e.g. "5.8M"
  bundles: string;    // e.g. "12"
  bars: string;       // e.g. "444"
  looseBars: string;  // e.g. "15"
  coils: string;      // e.g. "09"
}

export interface DamageColumnData {
  weldedBars: string;      // e.g. "02"
  scrapBars: string;       // e.g. "02"
  printZnIssue: string;    // e.g. "N/A"
  blackWhitePatch: string; // e.g. "N/A"
}

export interface DelayRow {
  id: string;
  fromTime: string;        // e.g. "08:00"
  toTime: string;          // e.g. "08:10"
  durationMinutes: number; // e.g. 10
  department: string;      // e.g. "Production"
  explanation: string;     // e.g. "Machine Starting"
  remark?: string;         // e.g. "Line tension adjusted"
}

export interface SawCutterData {
  bladeType: BladeType;
  bladeCode: BladeCode;
  serialNumber: string;
  totalNoOfCuts: string;
  totalWeightMt: string;
}

export interface SignOffData {
  preparedByName: string;
  shiftInChargeOption?: string; // "Raguwaran" | "Keshees Ram" | "Parasuram"
  issueNo: string;
  reviewedBy: string;
  checkedByName: string;
  dateOfIssue: string;
  approvedBy: string;
}

export interface EditAuditRecord {
  editedBy: string;
  editedAt: string;
}

export interface ProductionReport {
  id: string;
  reportNumber: string; // e.g. "R06-20261030-01"
  date: string;         // YYYY-MM-DD
  productionLine: MachineLine;
  operator: string;
  operationalTime: string; // e.g. "08:00PM - 06:00AM"
  size: string;            // e.g. "2 inch and 3 x 1 1/2"
  shift: ShiftType;
  avgMillSpeed: string;    // e.g. "37.2 m/min"
  shiftDuration: string;   // e.g. "10 Hours"
  product: ProductType;
  productionColumns: ProductionColumnData[];
  damageColumns: DamageColumnData[];
  delays: DelayRow[];
  totalDowntimeMinutes: number; // sum of durations
  sawCutter: SawCutterData;
  remarks: string;
  signOff: SignOffData;
  submittedBy: string;   // User who initially submitted the report
  submittedAt: string;   // Date & time of initial submission
  lastEditedBy?: string; // User who last modified the report
  lastEditedAt?: string; // Date & time of last modification
  editHistory?: EditAuditRecord[]; // Complete audit history
  updatedAt: string;
}

export interface MasterDepartment {
  id: string;
  name: string;
  explanations: string[];
}
