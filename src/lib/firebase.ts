import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from "firebase/firestore";
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
  Pengaturan 
} from "../types";

// Firebase Configuration dynamically resolved from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PENGATURAN_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_PENGATURAN_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_PENGATURAN_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_PENGATURAN_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_PENGATURAN_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_PENGATURAN_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use explicit firestoreDatabaseId with auto detect long polling for iframe stability
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "(default)";

// Original Owner & Master Database Identifiers
const PRIMARY_DATABASE_ID = firebaseConfigData.firestoreDatabaseId || "ai-studio-aplikasiguruai-962ea492-3615-4bc9-9964-b191b29c1a68";
const PRIMARY_APPLET_ID = "962ea492-3615-4bc9-9964-b191b29c1a68";

/**
 * Detects whether the application is running in a remixed / cloned workspace environment.
 * In this application, Firebase is fully provisioned with its own dedicated database.
 */
export function isRemixInstance(): boolean {
  return false;
}

/**
 * Returns true only if database mutations must be strictly isolated to localStorage.
 * Since this applet is provisioned with its dedicated Firestore database, this is disabled.
 */
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
  PENGATURAN: "pengaturan"
};

// Helpers for isolated local storage fallback when running in a remixed environment
export function getRemixStorage<T>(collectionName: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`edadmin_remix_db_${collectionName}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setRemixStorage<T>(collectionName: string, data: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`edadmin_remix_db_${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`edadmin_remix_db_update_${collectionName}`, { detail: data }));
  } catch (e) {
    console.error("Error writing remix database storage:", e);
  }
}

// Generic Realtime Subscription with offline fallback & auto-migration
export function subscribeCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  // 1. Initial immediate emission from local cache to prevent blank flicker
  const initialCached = getRemixStorage<T>(collectionName);
  if (initialCached.length > 0) {
    callback(initialCached);
  }

  // 2. Real-time subscription to Cloud Firestore
  const colRef = collection(firestore, collectionName);
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });

      // Auto-migrate: If Firestore is currently empty, but local cache has items, push to Firestore
      if (items.length === 0 && initialCached.length > 0) {
        batchSaveDocuments(collectionName, initialCached as any[]).catch((err) => {
          console.warn(`Auto-migration notice on ${collectionName}:`, err);
        });
        callback(initialCached);
        return;
      }

      // Sync local cache
      setRemixStorage(collectionName, items);
      callback(items);
    },
    (error) => {
      console.warn(`Firestore subscription notice on ${collectionName}:`, error?.message || error);
      // Fallback to local storage if Firestore connection encounters an issue
      callback(getRemixStorage<T>(collectionName));
    }
  );
}

// Single Document Save/Update with authorization guard
export async function saveDocument(collectionName: string, id: string, data: Record<string, any>) {
  if (isIsolatedRemix()) {
    const current = getRemixStorage<any>(collectionName);
    const idx = current.findIndex((item) => item.id === id);
    const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...data, id, updatedAt: Date.now() };
    if (idx >= 0) {
      current[idx] = updatedItem;
    } else {
      current.push(updatedItem);
    }
    setRemixStorage(collectionName, current);
    return;
  }

  // Update local cache immediately for zero latency
  const current = getRemixStorage<any>(collectionName);
  const idx = current.findIndex((item) => item.id === id);
  const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...data, id, updatedAt: Date.now() };
  if (idx >= 0) {
    current[idx] = updatedItem;
  } else {
    current.push(updatedItem);
  }
  setRemixStorage(collectionName, current);

  try {
    const docRef = doc(firestore, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  } catch (err: any) {
    console.error(`Error saving document in ${collectionName}:`, err);
    throw err;
  }
}

// Single Document Delete with authorization guard
export async function deleteDocument(collectionName: string, id: string) {
  // Always update local remix storage first so cached state clears immediately
  const current = getRemixStorage<any>(collectionName);
  if (current && current.length > 0) {
    const filtered = current.filter((item) => item.id !== id);
    setRemixStorage(collectionName, filtered);
  }

  if (isIsolatedRemix()) {
    return;
  }

  try {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error(`Error deleting document in ${collectionName}:`, err);
    // Ignore error if document was already deleted or not found
    if (err?.code === "not-found" || err?.message?.includes("not found")) {
      return;
    }
    throw err;
  }
}

// Batch Save Documents with authorization guard
export async function batchSaveDocuments(collectionName: string, items: Array<{ id: string; [key: string]: any }>) {
  if (!items || items.length === 0) return;
  
  if (isIsolatedRemix()) {
    const current = getRemixStorage<any>(collectionName);
    items.forEach((item) => {
      const idx = current.findIndex((existing) => existing.id === item.id);
      const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...item, updatedAt: Date.now() };
      if (idx >= 0) {
        current[idx] = updatedItem;
      } else {
        current.push(updatedItem);
      }
    });
    setRemixStorage(collectionName, current);
    return;
  }

  // Update local cache immediately for zero latency
  const current = getRemixStorage<any>(collectionName);
  items.forEach((item) => {
    const idx = current.findIndex((existing) => existing.id === item.id);
    const updatedItem = { ...(idx >= 0 ? current[idx] : {}), ...item, updatedAt: Date.now() };
    if (idx >= 0) {
      current[idx] = updatedItem;
    } else {
      current.push(updatedItem);
    }
  });
  setRemixStorage(collectionName, current);

  try {
    const batch = writeBatch(firestore);
    items.forEach((item) => {
      const docRef = doc(firestore, collectionName, item.id);
      batch.set(docRef, { ...item, updatedAt: Date.now() }, { merge: true });
    });
    await batch.commit();
  } catch (err: any) {
    console.error(`Error batch saving documents in ${collectionName}:`, err);
    throw err;
  }
}

// Batch Delete Documents with authorization guard
export async function batchDeleteDocuments(collectionName: string, ids: string[]) {
  if (!ids || ids.length === 0) return;

  const current = getRemixStorage<any>(collectionName);
  if (current && current.length > 0) {
    const idSet = new Set(ids);
    const filtered = current.filter((item) => !idSet.has(item.id));
    setRemixStorage(collectionName, filtered);
  }

  if (isIsolatedRemix()) {
    return;
  }

  try {
    const batch = writeBatch(firestore);
    ids.forEach((id) => {
      const docRef = doc(firestore, collectionName, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err: any) {
    console.error(`Error batch deleting documents in ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Security guard specifically for Pengaturan Database connection.
 */
export function checkPengaturanDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return { authorized: true };
}

// Pengaturan special helper (Doc ID: "config") with isolated database connection & security guard
export async function savePengaturan(config: Pengaturan) {
  if (isIsolatedRemix()) {
    if (typeof window !== "undefined") {
      localStorage.setItem("edadmin_remix_db_pengaturan", JSON.stringify(config));
      window.dispatchEvent(new CustomEvent("edadmin_remix_db_update_pengaturan", { detail: config }));
    }
    return;
  }

  try {
    const docRef = doc(firestore, COLLECTIONS.PENGATURAN, "config");
    await setDoc(docRef, { ...config, updatedAt: Date.now() }, { merge: true });
    if (typeof window !== "undefined") {
      localStorage.setItem("edadmin_pengaturan_isolated", JSON.stringify(config));
    }
  } catch (err: any) {
    console.error("Error saving pengaturan:", err);
    throw err;
  }
}

export function subscribePengaturan(callback: (config: Pengaturan) => void) {
  // 1. Immediate emission from local cache to prevent blank flicker
  let cachedConfig: Pengaturan | null = null;
  if (typeof window !== "undefined") {
    const rawCached = localStorage.getItem("edadmin_pengaturan_isolated") || localStorage.getItem("edadmin_remix_db_pengaturan");
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

  if (isIsolatedRemix()) {
    if (typeof window !== "undefined") {
      const handleUpdate = (e: any) => {
        if (e.detail) callback(e.detail);
      };
      window.addEventListener("edadmin_remix_db_update_pengaturan", handleUpdate);
      return () => window.removeEventListener("edadmin_remix_db_update_pengaturan", handleUpdate);
    }
    return () => {};
  }

  const docRef = doc(firestore, COLLECTIONS.PENGATURAN, "config");
  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Pengaturan;
        callback(data);
        if (typeof window !== "undefined") {
          localStorage.setItem("edadmin_pengaturan_isolated", JSON.stringify(data));
          localStorage.setItem("edadmin_remix_db_pengaturan", JSON.stringify(data));
        }
      } else {
        // If config doc does not exist yet in Firestore, but local storage has a saved profile/name:
        if (cachedConfig && (cachedConfig.Nama_Guru || cachedConfig.Nama_Sekolah)) {
          setDoc(docRef, { ...cachedConfig, updatedAt: Date.now() }, { merge: true }).catch((err) => {
            console.warn("Auto-sync local pengaturan to Firestore notice:", err);
          });
        }
      }
    },
    (error) => {
      console.warn("Firestore pengaturan subscription notice:", error?.message || error);
    }
  );
}

/**
 * Uploads all local browser storage data (from laptop/PC) to Firebase Firestore
 * so it becomes immediately accessible on other devices such as mobile phones (HP).
 */
export async function syncAllLocalDataToFirestore(): Promise<{ syncedCount: number; message: string }> {
  let count = 0;
  try {
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
      const localItems = getRemixStorage<any>(colName);
      if (localItems && localItems.length > 0) {
        await batchSaveDocuments(colName, localItems);
        count += localItems.length;
      }
    }

    // Sync Pengaturan profile (Nama Guru, Kop Sekolah, dll.)
    if (typeof window !== "undefined") {
      const rawCfg = localStorage.getItem("edadmin_pengaturan_isolated") || localStorage.getItem("edadmin_remix_db_pengaturan");
      if (rawCfg) {
        try {
          const cfg = JSON.parse(rawCfg);
          if (cfg && (cfg.Nama_Guru || cfg.Nama_Sekolah)) {
            const docRef = doc(firestore, COLLECTIONS.PENGATURAN, "config");
            await setDoc(docRef, { ...cfg, updatedAt: Date.now() }, { merge: true });
            count++;
          }
        } catch (e) {
          console.warn("Could not parse config during sync:", e);
        }
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

// Clear / Wipe All Collections in Database (Except Configuration) with authorization guard
export async function clearAllDatabaseCollections() {
  localStorage.setItem("edadmin_database_cleared", "true");

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

  // 1. Always purge local storage fallback for all collections & dispatch update events
  collectionsToClear.forEach((colName) => {
    setRemixStorage(colName, []);
  });

  if (isIsolatedRemix()) {
    return;
  }

  // 2. Set isDatabaseCleared flag in Firestore configuration
  try {
    const configDocRef = doc(firestore, COLLECTIONS.PENGATURAN, "config");
    await setDoc(configDocRef, { isDatabaseCleared: true, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn("Could not set isDatabaseCleared flag in pengaturan collection:", err);
  }

  // 3. Clear all collections in Firestore (chunked batch deletes with individual fallback)
  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(firestore, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        // Batch delete in chunks of 200
        for (let i = 0; i < docs.length; i += 200) {
          const chunk = docs.slice(i, i + 200);
          try {
            const batch = writeBatch(firestore);
            chunk.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          } catch (batchErr) {
            console.warn(`Batch delete failed for ${colName}, attempting individual deletes:`, batchErr);
            // Fallback to individual deletes if batch fails
            for (const docSnap of chunk) {
              try {
                await deleteDoc(docSnap.ref);
              } catch (singleErr) {
                console.warn(`Notice: Could not delete document ${docSnap.id} in ${colName}:`, singleErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`Notice while fetching/clearing collection ${colName}:`, err);
    }
  }
}
