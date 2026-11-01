import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { MasterDepartment, ProductionReport, UserProfile } from './types';
import { INITIAL_DEPARTMENTS, INITIAL_SAMPLE_REPORTS, INITIAL_USERS } from './data/defaultMasterData';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Firestore Error Handler conforming to the Firebase skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Error caught:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.info('Firestore ping note (offline or initial check):', error);
    return false;
  }
}

// Local Storage Fallback Keys
const STORAGE_KEYS = {
  USERS: 'mpr_r06_users_v1',
  REPORTS: 'mpr_r06_reports_v1',
  DEPARTMENTS: 'mpr_r06_departments_v1',
};

// -------------------------------------------------------------
// Data Services with Cloud Sync & Local Persistence
// -------------------------------------------------------------

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    if (!querySnapshot.empty) {
      const cloudUsers = querySnapshot.docs.map((d) => d.data() as UserProfile);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudUsers));
      return cloudUsers;
    }
  } catch (e) {
    console.warn('Could not read users from Firestore, using local cache:', e);
  }

  const cached = localStorage.getItem(STORAGE_KEYS.USERS);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // Fallback system accounts required by brief
  const seedUsers = INITIAL_USERS.length > 0 ? INITIAL_USERS : [
    { id: 'user-prod-1', username: 'PRODUCTION1', password: '1234', role: 'production', formAccess: 'write', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'user-prod-2', username: 'PRODUCTION2', password: '1234', role: 'production', formAccess: 'write', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'user-prod-3', username: 'PRODUCTION3', password: '1234', role: 'production', formAccess: 'write', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'user-prod-4', username: 'PRODUCTION4', password: '1234', role: 'production', formAccess: 'read', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'user-prod-5', username: 'PRODUCTION5', password: '1234', role: 'production', formAccess: 'write', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'user-super', username: 'SUPERUSER', password: '1234', role: 'super', formAccess: 'write', createdAt: '2026-10-01T00:00:00Z' },
  ] as UserProfile[];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  // Background seed to Firestore
  seedUsers.forEach((user) => {
    setDoc(doc(db, 'users', user.id), user).catch(() => {});
  });
  return seedUsers;
}

export async function saveUser(user: UserProfile): Promise<void> {
  const current = await fetchUsers();
  const index = current.findIndex((u) => u.id === user.id);
  let updated: UserProfile[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = user;
  } else {
    updated = [user, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (e) {
    console.warn('Could not write user to Firestore, cached locally:', e);
  }
}

export async function fetchReports(): Promise<ProductionReport[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'reports'));
    if (!querySnapshot.empty) {
      const cloudReports = querySnapshot.docs.map((d) => d.data() as ProductionReport);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(cloudReports));
      return cloudReports;
    }
  } catch (e) {
    console.warn('Could not read reports from Firestore, using local cache:', e);
  }

  const cached = localStorage.getItem(STORAGE_KEYS.REPORTS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // Initialize with initial sample report from the user's PDF
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_SAMPLE_REPORTS));
  INITIAL_SAMPLE_REPORTS.forEach((rep) => {
    setDoc(doc(db, 'reports', rep.id), rep).catch(() => {});
  });
  return INITIAL_SAMPLE_REPORTS;
}

export async function saveReport(report: ProductionReport): Promise<void> {
  const current = await fetchReports();
  const index = current.findIndex((r) => r.id === report.id);
  let updated: ProductionReport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = report;
  } else {
    updated = [report, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (e) {
    console.warn('Could not write report to Firestore, saved locally:', e);
  }
}

export async function removeReport(reportId: string): Promise<void> {
  const current = await fetchReports();
  const updated = current.filter((r) => r.id !== reportId);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));

  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (e) {
    console.warn('Could not delete report from Firestore, removed locally:', e);
  }
}

export async function fetchDepartments(): Promise<MasterDepartment[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'departments'));
    if (!querySnapshot.empty) {
      const cloudDepts = querySnapshot.docs.map((d) => d.data() as MasterDepartment);
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(cloudDepts));
      return cloudDepts;
    }
  } catch (e) {
    console.warn('Could not read departments from Firestore, using local cache:', e);
  }

  const cached = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
  INITIAL_DEPARTMENTS.forEach((dept) => {
    setDoc(doc(db, 'departments', dept.id), dept).catch(() => {});
  });
  return INITIAL_DEPARTMENTS;
}

export async function saveDepartment(dept: MasterDepartment): Promise<void> {
  const current = await fetchDepartments();
  const index = current.findIndex((d) => d.id === dept.id);
  let updated: MasterDepartment[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = dept;
  } else {
    updated = [...current, dept];
  }
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'departments', dept.id), dept);
  } catch (e) {
    console.warn('Could not write department to Firestore, saved locally:', e);
  }
}

export async function deleteDepartment(deptId: string): Promise<void> {
  const current = await fetchDepartments();
  const updated = current.filter((d) => d.id !== deptId);
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(updated));

  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (e) {
    console.warn('Could not delete department from Firestore, removed locally:', e);
  }
}
