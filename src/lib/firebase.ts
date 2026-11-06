import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch,
  deleteField
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import firebaseConfigData from "../../firebase-applet-config.json";
import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan,
  GuruUser
} from "../types";

// Firebase Configuration dynamically resolved from Environment Variables
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>);
const firebaseConfig = {
  apiKey: env.VITE_PENGATURAN_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: env.VITE_PENGATURAN_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: env.VITE_PENGATURAN_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: env.VITE_PENGATURAN_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: env.VITE_PENGATURAN_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: env.VITE_PENGATURAN_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Use explicit firestoreDatabaseId with auto detect long polling for iframe stability
const dbId = env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "(default)";

export function isRemixInstance(): boolean {
  return false;
}

function isIsolatedRemix(): boolean {
  return false;
}

export function checkDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, dbId);
} catch {
  firestoreInstance = getFirestore(app, dbId);
}

export const firestore = firestoreInstance;

// Collections references
export const COLLECTIONS = {
  SISWA: "data_siswa",
  MAPEL: "mapel",
  JADWAL: "jadwal",
  LOG_ABSENSI: "log_absensi",
  DATA_NILAI: "data_nilai",
  JURNAL_AGENDA: "jurnal_agenda",
  SISWA_BIMBINGAN: "siswa_bimbingan",
  BIMBINGAN_WALI: "bimbingan_wali",
  PENGATURAN: "pengaturan",
  USERS: "users"
};

// ============================================================================
// Multi-Teacher Active Workspace Tracking & Isolation Helpers
// ============================================================================
let currentActiveUserId: string = (typeof window !== "undefined" ? localStorage.getItem("edadmin_active_uid") : null) || "";

export function setActiveUserId(uid: string) {
  currentActiveUserId = uid;
  if (typeof window !== "undefined") {
    if (uid) {
      localStorage.setItem("edadmin_active_uid", uid);
    } else {
      localStorage.removeItem("edadmin_active_uid");
    }
  }
}

export function getActiveUserId(): string {
  return currentActiveUserId;
}

export function getScopedStorageKey(collectionName: string, userId?: string): string {
  const uid = userId !== undefined ? userId : currentActiveUserId;
  return uid ? `edadmin_teacher_${uid}_${collectionName}` : `edadmin_remix_db_${collectionName}`;
}

/**
 * Mode tamu (uid diawali "tamu_") dan sesi tanpa Firebase Auth hanya memakai localStorage.
 * Firestore Rules menolak akses tanpa autentikasi, jadi kita tidak mencoba menulis ke cloud.
 */
export function isGuestUid(uid?: string | null): boolean {
  return !!uid && uid.startsWith("tamu_");
}

export function isCloudSyncEnabled(userId?: string): boolean {
  const uid = userId !== undefined ? userId : currentActiveUserId;
  if (!uid || isGuestUid(uid) || uid === "superadmin_master") return false;
  return !!auth.currentUser;
}

/** Batas resmi Firestore: maksimal 500 operasi per batch. */
const FIRESTORE_BATCH_LIMIT = 450;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getMigrationFlagKey(collectionName: string, uid: string): string {
  return `edadmin_cloud_synced_${uid}_${collectionName}`;
}

export function getFirestoreColRef(collectionName: string, userId?: string) {
  const uid = userId !== undefined ? userId : currentActiveUserId;
  if (uid) {
    return collection(firestore, "users", uid, collectionName);
  }
  return collection(firestore, collectionName);
}

export function getFirestoreDocRef(collectionName: string, docId: string, userId?: string) {
  const uid = userId !== undefined ? userId : currentActiveUserId;
  if (uid) {
    return doc(firestore, "users", uid, collectionName, docId);
  }
  return doc(firestore, collectionName, docId);
}

// Helpers for isolated local storage fallback
export function getRemixStorage<T>(collectionName: string, userId?: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getScopedStorageKey(collectionName, userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setRemixStorage<T>(collectionName: string, data: T[], userId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(collectionName, userId);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_${collectionName}`, { detail: data }));
  } catch (e) {
    console.error("Error writing remix database storage:", e);
  }
}

// Generic Realtime Subscription with teacher isolation & offline fallback
export function subscribeCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  userId?: string
) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;

  // 1. Initial immediate emission from local cache to prevent blank flicker
  const initialCached = getRemixStorage<T>(collectionName, targetUid);
  if (initialCached.length > 0) {
    callback(initialCached);
  }

  // 2. Mode lokal (tamu / belum login): tidak ada sinkronisasi cloud
  if (!isCloudSyncEnabled(targetUid)) {
    if (initialCached.length === 0) callback([]);
    const handler = (e: Event) => callback(((e as CustomEvent).detail as T[]) || []);
    if (typeof window !== "undefined") {
      window.addEventListener(`edadmin_remix_db_update_${collectionName}`, handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`edadmin_remix_db_update_${collectionName}`, handler);
      }
    };
  }

  // 3. Real-time subscription to Cloud Firestore (per-user subcollection)
  const colRef = getFirestoreColRef(collectionName, targetUid);
  const migrationKey = getMigrationFlagKey(collectionName, targetUid);
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });

      const alreadySynced = typeof window !== "undefined" && localStorage.getItem(migrationKey) === "1";

      // Auto-migrate satu kali saja: data lokal lama didorong ke Firestore bila cloud masih kosong.
      // Setelah pernah tersinkron, cloud adalah sumber kebenaran sehingga data yang dihapus
      // di perangkat lain tidak "hidup kembali" dari cache lokal yang usang.
      if (items.length === 0 && initialCached.length > 0 && !alreadySynced && !snapshot.metadata.fromCache) {
        batchSaveDocuments(collectionName, initialCached as any[], targetUid)
          .then(() => {
            if (typeof window !== "undefined") localStorage.setItem(migrationKey, "1");
          })
          .catch((err) => {
            console.warn(`Auto-migration notice on ${collectionName}:`, err);
          });
        callback(initialCached);
        return;
      }

      if (!snapshot.metadata.fromCache && typeof window !== "undefined") {
        localStorage.setItem(migrationKey, "1");
      }

      // Sync local cache
      setRemixStorage(collectionName, items, targetUid);
      callback(items);
    },
    (error) => {
      console.warn(`Firestore subscription notice on ${collectionName}:`, error?.message || error);
      callback(getRemixStorage<T>(collectionName, targetUid));
    }
  );
}

// Single Document Save/Update with authorization guard & user scoping
export async function saveDocument(collectionName: string, id: string, data: Record<string, any>, userId?: string) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;

  // Update local cache immediately for zero latency
  const current = getRemixStorage<any>(collectionName, targetUid);
  const idx = current.findIndex((item) => item.id === id);
  const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...data, id, updatedAt: Date.now() };
  if (idx >= 0) {
    current[idx] = updatedItem;
  } else {
    current.push(updatedItem);
  }
  setRemixStorage(collectionName, current, targetUid);
  if (!isCloudSyncEnabled(targetUid)) return;

  try {
    const docRef = getFirestoreDocRef(collectionName, id, targetUid);
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  } catch (err: any) {
    console.error(`Error saving document in ${collectionName}:`, err);
    throw err;
  }
}

// Single Document Delete with authorization guard & user scoping
export async function deleteDocument(collectionName: string, id: string, userId?: string) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;

  const current = getRemixStorage<any>(collectionName, targetUid);
  if (current && current.length > 0) {
    const filtered = current.filter((item) => item.id !== id);
    setRemixStorage(collectionName, filtered, targetUid);
  }
  if (!isCloudSyncEnabled(targetUid)) return;

  try {
    const docRef = getFirestoreDocRef(collectionName, id, targetUid);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error(`Error deleting document in ${collectionName}:`, err);
    if (err?.code === "not-found" || err?.message?.includes("not found")) {
      return;
    }
    throw err;
  }
}

// Batch Save Documents with authorization guard & user scoping
export async function batchSaveDocuments(
  collectionName: string, 
  items: Array<{ id: string; [key: string]: any }>,
  userId?: string
) {
  if (!items || items.length === 0) return;
  const targetUid = userId !== undefined ? userId : currentActiveUserId;

  // Update local cache immediately for zero latency
  const current = getRemixStorage<any>(collectionName, targetUid);
  items.forEach((item) => {
    const idx = current.findIndex((existing) => existing.id === item.id);
    const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...item, updatedAt: Date.now() };
    if (idx >= 0) {
      current[idx] = updatedItem;
    } else {
      current.push(updatedItem);
    }
  });
  setRemixStorage(collectionName, current, targetUid);
  if (!isCloudSyncEnabled(targetUid)) return;

  try {
    // Pecah per 450 dokumen agar tidak melewati batas 500 operasi per batch Firestore
    for (const chunk of chunkArray(items, FIRESTORE_BATCH_LIMIT)) {
      const batch = writeBatch(firestore);
      chunk.forEach((item) => {
        const docRef = getFirestoreDocRef(collectionName, item.id, targetUid);
        batch.set(docRef, { ...item, updatedAt: Date.now() }, { merge: true });
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.error(`Error batch saving documents in ${collectionName}:`, err);
    throw err;
  }
}

// Batch Delete Documents with authorization guard & user scoping
export async function batchDeleteDocuments(collectionName: string, ids: string[], userId?: string) {
  if (!ids || ids.length === 0) return;
  const targetUid = userId !== undefined ? userId : currentActiveUserId;

  const current = getRemixStorage<any>(collectionName, targetUid);
  if (current && current.length > 0) {
    const idSet = new Set(ids);
    const filtered = current.filter((item) => !idSet.has(item.id));
    setRemixStorage(collectionName, filtered, targetUid);
  }
  if (!isCloudSyncEnabled(targetUid)) return;

  try {
    for (const chunk of chunkArray(ids, FIRESTORE_BATCH_LIMIT)) {
      const batch = writeBatch(firestore);
      chunk.forEach((id) => {
        const docRef = getFirestoreDocRef(collectionName, id, targetUid);
        batch.delete(docRef);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.error(`Error batch deleting documents in ${collectionName}:`, err);
    throw err;
  }
}

export function checkPengaturanDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

// Pengaturan helper per-guru (Doc ID: "config")
export async function savePengaturan(config: Pengaturan, userId?: string) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;
  const cacheKey = targetUid ? `edadmin_teacher_${targetUid}_pengaturan` : "edadmin_pengaturan_isolated";

  if (typeof window !== "undefined") {
    localStorage.setItem(cacheKey, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("edadmin_remix_db_update_pengaturan", { detail: config }));
  }
  if (!isCloudSyncEnabled(targetUid)) return;

  try {
    const docRef = getFirestoreDocRef(COLLECTIONS.PENGATURAN, "config", targetUid);
    // Field `password` lama (plaintext) tidak boleh tersimpan di Firestore: hapus bila masih ada.
    const { password: _legacyPassword, ...safeConfig } = config;
    await setDoc(docRef, { ...safeConfig, password: deleteField(), updatedAt: Date.now() }, { merge: true });
  } catch (err: any) {
    console.error("Error saving pengaturan:", err);
    throw err;
  }
}

export function subscribePengaturan(callback: (config: Pengaturan) => void, userId?: string) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;
  const cacheKey = targetUid ? `edadmin_teacher_${targetUid}_pengaturan` : "edadmin_pengaturan_isolated";

  let cachedConfig: Pengaturan | null = null;
  if (typeof window !== "undefined") {
    const rawCached = localStorage.getItem(cacheKey) || localStorage.getItem("edadmin_pengaturan_isolated");
    if (rawCached) {
      try {
        cachedConfig = JSON.parse(rawCached);
        if (cachedConfig) {
          callback(cachedConfig);
        }
      } catch (e) {
        console.warn("Could not parse isolated local pengaturan cache:", e);
      }
    }
  }

  if (!isCloudSyncEnabled(targetUid)) {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Pengaturan | undefined;
      if (detail) callback(detail);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("edadmin_remix_db_update_pengaturan", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("edadmin_remix_db_update_pengaturan", handler);
      }
    };
  }

  const docRef = getFirestoreDocRef(COLLECTIONS.PENGATURAN, "config", targetUid);
  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Pengaturan;
        callback(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } else {
        if (cachedConfig && (cachedConfig.Nama_Guru || cachedConfig.Nama_Sekolah)) {
          setDoc(docRef, { ...cachedConfig, updatedAt: Date.now() }, { merge: true }).catch((err) => {
            console.warn("Auto-sync local pengaturan to Firestore notice:", err);
          });
        }
      }
    },
    (error) => {
      console.warn("Firestore pengaturan subscription notice:", error?.message || error);
      if (cachedConfig) callback(cachedConfig);
    }
  );
}

// ============================================================================
// Teacher Authentication & User Management (Firebase Auth & Scoped Profiles)
// ============================================================================

export async function saveTeacherProfile(userId: string, data: Partial<GuruUser>): Promise<void> {
  if (typeof window !== "undefined") {
    let previous: Partial<GuruUser> = {};
    try {
      previous = JSON.parse(localStorage.getItem(`edadmin_profile_${userId}`) || "{}");
    } catch {}
    localStorage.setItem(`edadmin_profile_${userId}`, JSON.stringify({ ...previous, ...data }));
  }
  if (isGuestUid(userId) || !auth.currentUser) return;
  try {
    const userDocRef = doc(firestore, "users", userId);
    await setDoc(userDocRef, { ...data, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn("Notice: Could not save teacher profile in firestore users collection:", err);
  }
}

export async function getTeacherProfile(userId: string): Promise<GuruUser | null> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as GuruUser;
    }
  } catch (err) {
    console.warn("Notice reading teacher profile from firestore:", err);
  }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`edadmin_profile_${userId}`);
    if (raw) {
      try {
        return JSON.parse(raw) as GuruUser;
      } catch {}
    }
  }
  return null;
}

// ============================================================================
// Superadmin Master Authorization & Role Helpers
// ----------------------------------------------------------------------------
// Mendukung dua mode:
// 1. Mode Standalone / Offline: Login menggunakan Master Passkey lokal ("superadmin2026").
//    Sangat cocok untuk penggunaan mandiri tanpa perlu menghubungkan backend Firebase.
// 2. Mode Cloud: Login menggunakan Google atau Email terverifikasi via Firebase Auth.
// ============================================================================
export const DEFAULT_SUPERADMIN_PASSKEY = "superadmin2026";

export function getSuperAdminPasskey(): string {
  if (typeof window === "undefined") return DEFAULT_SUPERADMIN_PASSKEY;
  return localStorage.getItem("edadmin_superadmin_passkey") || DEFAULT_SUPERADMIN_PASSKEY;
}

export function setSuperAdminPasskey(newKey: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("edadmin_superadmin_passkey", newKey);
  }
}

const SUPERADMIN_EMAILS = [
  "ahmadrifkyridha@gmail.com",
  "superadmin@edufutura.ai",
  "admin@edufutura.ai"
];

export function isSuperadminEmail(email?: string | null, emailVerified: boolean = true): boolean {
  if (!email || !emailVerified) return false;
  return SUPERADMIN_EMAILS.includes(email.toLowerCase().trim());
}

function resolveRole(firebaseUser: FirebaseUser, profile: GuruUser | null): "superadmin" | "guru" {
  if (isSuperadminEmail(firebaseUser.email, firebaseUser.emailVerified)) return "superadmin";
  return profile?.role === "superadmin" ? "superadmin" : "guru";
}

/**
 * Login Superadmin:
 * - Jika dipanggil dengan "google" -> autentikasi via Google Auth.
 * - Jika dipanggil dengan "email" -> autentikasi via Email & Password Firebase.
 * - Jika dipanggil dengan Passkey string -> mode mandiri lokal (default: "superadmin2026" / "admin123").
 */
export async function loginAsSuperAdmin(
  methodOrPasskey: string, 
  nameOrEmail?: string, 
  pass?: string
): Promise<GuruUser> {
  if (methodOrPasskey === "google") {
    const user = await loginWithGoogle();
    if (user.role !== "superadmin") {
      await logoutUser();
      throw new Error("Akun Google ini tidak terdaftar sebagai Superadmin.");
    }
    return user;
  }

  if (methodOrPasskey === "email") {
    const user = await loginWithEmail(nameOrEmail || "", pass || "");
    if (user.role !== "superadmin") {
      await logoutUser();
      throw new Error("Akun Email ini tidak memiliki otoritas Superadmin.");
    }
    return user;
  }

  // Mode Standalone Local Passkey (Tanpa Firebase)
  const currentKey = getSuperAdminPasskey();
  const validKeys = [currentKey, "superadmin2026", "admin123"];
  if (!validKeys.includes(methodOrPasskey.trim())) {
    throw new Error("Master Passkey Superadmin tidak valid! Gunakan passkey bawaan 'superadmin2026'.");
  }

  const superAdminUser: GuruUser = {
    uid: "superadmin_master",
    email: "superadmin@edufutura.ai",
    displayName: nameOrEmail?.trim() || "Super Administrator (Master HQ)",
    photoURL: null,
    nip: "19880101-SUPERADMIN",
    sekolah: "EDUFUTURA AI KEMENTERIAN / MASTER HQ",
    mapelUtama: "Super Administrator / Seluruh Akses",
    isGuest: false,
    role: "superadmin",
    createdAt: Date.now()
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("edadmin_superadmin_user", JSON.stringify(superAdminUser));
    localStorage.setItem("edadmin_active_uid", "superadmin_master");
  }

  setActiveUserId("superadmin_master");
  return superAdminUser;
}

export async function getAllRegisteredTeachers(): Promise<GuruUser[]> {
  try {
    const colRef = collection(firestore, "users");
    const snap = await getDocs(colRef);
    const list: GuruUser[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as GuruUser;
      if (data && data.uid) {
        list.push(data);
      }
    });
    if (list.length > 0) return list;
  } catch (err) {
    console.warn("Notice: could not load teachers from firestore:", err);
  }

  // Fallback from localStorage
  if (typeof window !== "undefined") {
    const fallbackList: GuruUser[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("edadmin_profile_")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "{}");
          if (parsed && parsed.uid) {
            fallbackList.push(parsed);
          }
        } catch {}
      }
    }
    return fallbackList;
  }
  return [];
}

export async function updateTeacherRole(userId: string, newRole: "superadmin" | "guru"): Promise<void> {
  await saveTeacherProfile(userId, { role: newRole });
}

export async function deleteTeacherProfile(userId: string): Promise<void> {
  try {
    const docRef = doc(firestore, "users", userId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Could not delete teacher from firestore:", err);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(`edadmin_profile_${userId}`);
  }
}

export async function loginWithGoogle(): Promise<GuruUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  
  const existingProfile = await getTeacherProfile(user.uid);
  const guruUser: GuruUser = {
    uid: user.uid,
    email: user.email,
    displayName: existingProfile?.displayName || user.displayName || "Guru EduFutura",
    photoURL: existingProfile?.photoURL || user.photoURL || null,
    nip: existingProfile?.nip || "",
    sekolah: existingProfile?.sekolah || "",
    mapelUtama: existingProfile?.mapelUtama || "",
    isGuest: false,
    role: resolveRole(user, existingProfile),
    createdAt: existingProfile?.createdAt || Date.now()
  };

  await saveTeacherProfile(user.uid, guruUser);
  setActiveUserId(user.uid);
  return guruUser;
}

export async function loginWithEmail(email: string, pass: string): Promise<GuruUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = result.user;
  
  const existingProfile = await getTeacherProfile(user.uid);
  const guruUser: GuruUser = {
    uid: user.uid,
    email: user.email,
    displayName: existingProfile?.displayName || user.displayName || email.split("@")[0],
    photoURL: existingProfile?.photoURL || user.photoURL || null,
    nip: existingProfile?.nip || "",
    sekolah: existingProfile?.sekolah || "",
    mapelUtama: existingProfile?.mapelUtama || "",
    isGuest: false,
    role: resolveRole(user, existingProfile),
    createdAt: existingProfile?.createdAt || Date.now()
  };

  setActiveUserId(user.uid);
  return guruUser;
}

export async function registerTeacher(
  email: string, 
  pass: string, 
  profileData: { namaGuru: string; nipGuru?: string; namaSekolah?: string; mapelUtama?: string }
): Promise<GuruUser> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = result.user;

  if (profileData.namaGuru) {
    try {
      await updateProfile(user, { displayName: profileData.namaGuru });
    } catch {}
  }

  const guruUser: GuruUser = {
    uid: user.uid,
    email: user.email,
    displayName: profileData.namaGuru || user.displayName || "Guru",
    photoURL: null,
    nip: profileData.nipGuru || "",
    sekolah: profileData.namaSekolah || "SMP NEGERI / SEKOLAH SAYA",
    mapelUtama: profileData.mapelUtama || "",
    isGuest: false,
    createdAt: Date.now()
  };

  await saveTeacherProfile(user.uid, guruUser);

  // Initialize teacher's isolated configuration
  const defaultTeacherConfig: Pengaturan = {
    Nama_Guru: profileData.namaGuru || "Guru EduFutura",
    NIP_Guru: profileData.nipGuru || "-",
    Nama_Sekolah: profileData.namaSekolah || "SMP NEGERI / SEKOLAH SAYA",
    Alamat_Sekolah: "Jalan Pendidikan No. 1",
    Pemerintah: "PEMERINTAH KABUPATEN / KOTA",
    Nama_Kepsek: "Kepala Sekolah, M.Pd.",
    NIP_Kepsek: "-",
    Tempat_Tanda_Tangan: "Kota",
    Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU"
  };
  await savePengaturan(defaultTeacherConfig, user.uid);

  setActiveUserId(user.uid);
  return guruUser;
}

export async function loginAsGuest(namaGuru?: string, namaSekolah?: string): Promise<GuruUser> {
  const guestUid = "tamu_" + Math.random().toString(36).substring(2, 9);
  const guruUser: GuruUser = {
    uid: guestUid,
    email: "tamu@edufutura.ai",
    displayName: namaGuru || "Guru Tamu (Mode Demo)",
    photoURL: null,
    nip: "19880101 201401 1 001",
    sekolah: namaSekolah || "SMP Percontohan Digital",
    mapelUtama: "Informatika / Umum",
    isGuest: true,
    createdAt: Date.now()
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("edadmin_guest_user", JSON.stringify(guruUser));
  }
  setActiveUserId(guestUid);
  return guruUser;
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("SignOut notice:", e);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("edadmin_superadmin_user");
    localStorage.removeItem("edadmin_guest_user");
    localStorage.removeItem("edadmin_active_uid");
    localStorage.removeItem("edadmin_user");
    localStorage.removeItem("edadmin_auth_token");
  }
  setActiveUserId("");
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeAuthUser(callback: (user: GuruUser | null) => void): () => void {
  // 1. Cek sesi aktif Superadmin Mode Standalone (Offline / Tanpa Firebase)
  if (typeof window !== "undefined") {
    const superAdminRaw = localStorage.getItem("edadmin_superadmin_user");
    if (superAdminRaw) {
      try {
        const superAdmin = JSON.parse(superAdminRaw) as GuruUser;
        if (superAdmin && superAdmin.role === "superadmin") {
          setActiveUserId(superAdmin.uid);
          callback(superAdmin);
          return () => {};
        }
      } catch {}
    }
  }

  // 2. Mode tamu (data hanya di perangkat ini)
  if (typeof window !== "undefined") {
    const guestRaw = localStorage.getItem("edadmin_guest_user");
    if (guestRaw) {
      try {
        const guest = JSON.parse(guestRaw) as GuruUser;
        if (guest && guest.isGuest) {
          setActiveUserId(guest.uid);
          callback(guest);
          return () => {};
        }
      } catch {}
    }
  }

  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      setActiveUserId(firebaseUser.uid);
      const profile = await getTeacherProfile(firebaseUser.uid);
      const guruUser: GuruUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: profile?.displayName || firebaseUser.displayName || "Guru",
        photoURL: profile?.photoURL || firebaseUser.photoURL || null,
        nip: profile?.nip || "",
        sekolah: profile?.sekolah || "",
        mapelUtama: profile?.mapelUtama || "",
        isGuest: false,
        role: resolveRole(firebaseUser, profile),
        createdAt: profile?.createdAt || Date.now()
      };
      callback(guruUser);
    } else {
      // Check if guest was set in meantime
      if (typeof window !== "undefined") {
        const guestRaw = localStorage.getItem("edadmin_guest_user");
        if (guestRaw) {
          try {
            const guest = JSON.parse(guestRaw) as GuruUser;
            if (guest && guest.isGuest) {
              setActiveUserId(guest.uid);
              callback(guest);
              return;
            }
          } catch {}
        }
      }
      setActiveUserId("");
      callback(null);
    }
  });
}

// Background data sync
export async function syncAllLocalDataToFirestore() {
  const targetUid = currentActiveUserId;
  try {
    let count = 0;
    const listCols = [
      COLLECTIONS.SISWA,
      COLLECTIONS.MAPEL,
      COLLECTIONS.JADWAL,
      COLLECTIONS.LOG_ABSENSI,
      COLLECTIONS.DATA_NILAI,
      COLLECTIONS.JURNAL_AGENDA,
      COLLECTIONS.SISWA_BIMBINGAN,
      COLLECTIONS.BIMBINGAN_WALI
    ];

    for (const colName of listCols) {
      const localItems = getRemixStorage<any>(colName, targetUid);
      if (localItems && localItems.length > 0) {
        await batchSaveDocuments(colName, localItems, targetUid);
        count += localItems.length;
      }
    }

    return { 
      syncedCount: count, 
      message: `Berhasil menyinkronkan data (${count} item) ke Cloud Firestore!` 
    };
  } catch (error: any) {
    console.error("Error in syncAllLocalDataToFirestore:", error);
    throw error;
  }
}

// Clear / Wipe Collections in Current Teacher's Space
export async function clearAllDatabaseCollections(userId?: string) {
  const targetUid = userId !== undefined ? userId : currentActiveUserId;
  localStorage.setItem(`edadmin_database_cleared_${targetUid}`, "true");

  const collectionsToClear = [
    COLLECTIONS.SISWA,
    COLLECTIONS.MAPEL,
    COLLECTIONS.JADWAL,
    COLLECTIONS.LOG_ABSENSI,
    COLLECTIONS.DATA_NILAI,
    COLLECTIONS.JURNAL_AGENDA,
    COLLECTIONS.SISWA_BIMBINGAN,
    COLLECTIONS.BIMBINGAN_WALI
  ];

  collectionsToClear.forEach((colName) => {
    setRemixStorage(colName, [], targetUid);
  });
  if (!isCloudSyncEnabled(targetUid)) return;

  for (const colName of collectionsToClear) {
    try {
      const colRef = getFirestoreColRef(colName, targetUid);
      const snapshot = await getDocs(colRef);
      for (const chunk of chunkArray(snapshot.docs, FIRESTORE_BATCH_LIMIT)) {
        const batch = writeBatch(firestore);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err: any) {
      console.warn(`Notice while clearing collection ${colName}:`, err);
    }
  }
}

// ============================================================================
// Header Autentikasi untuk Endpoint /api/*
// ----------------------------------------------------------------------------
// Menyisipkan Firebase ID token (bila pengguna login) ke setiap request same-origin
// menuju /api/ agar server dapat memverifikasi pemanggil dan menerapkan rate limit per guru.
// ============================================================================
let apiAuthInterceptorInstalled = false;

export function installApiAuthInterceptor(): void {
  if (typeof window === "undefined" || apiAuthInterceptorInstalled) return;
  apiAuthInterceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const isApiCall = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
      if (isApiCall && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(input, { ...init, headers });
      }
    } catch (err) {
      console.warn("Notice: gagal menyisipkan token autentikasi API:", err);
    }
    return originalFetch(input, init);
  };
}
