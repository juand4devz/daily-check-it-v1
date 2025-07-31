// /lib/firebase/diagnose-service.ts
import {
    collection,
    query,
    getDocs,
    addDoc,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    where,
    limit,
} from "firebase/firestore";
import { clientDb } from "./firebase-client";
import { Gejala, Kerusakan } from "@/types/diagnose";

// --- Service untuk Kerusakan ---
export async function getAllKerusakan(): Promise<Kerusakan[]> {
    try {
        const q = query(collection(clientDb, "kerusakan"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<Kerusakan, 'id'>
        }));
    } catch (error) {
        console.error("Error in getAllKerusakan:", error);
        throw new Error("Gagal mengambil data kerusakan dari database.");
    }
}

export async function getKerusakanById(id: string): Promise<Kerusakan | null> {
    try {
        const docRef = doc(clientDb, "kerusakan", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() as Omit<Kerusakan, 'id'> };
        }
        return null;
    } catch (error) {
        console.error("Error in getKerusakanById:", error);
        throw new Error("Gagal mengambil data kerusakan dari database.");
    }
}

export async function addKerusakan(data: Omit<Kerusakan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Kerusakan> {
    try {
        const now = new Date().toISOString();
        const kerusakanToSave = { ...data, createdAt: now, updatedAt: now };
        const docRef = await addDoc(collection(clientDb, "kerusakan"), kerusakanToSave);
        return { id: docRef.id, ...kerusakanToSave };
    } catch (error) {
        console.error("Error in addKerusakan:", error);
        throw new Error("Gagal menambahkan data kerusakan.");
    }
}

export async function updateKerusakan(id: string, data: Partial<Kerusakan>): Promise<void> {
    try {
        const docRef = doc(clientDb, "kerusakan", id);
        await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error in updateKerusakan:", error);
        throw new Error("Gagal memperbarui data kerusakan.");
    }
}

export async function deleteKerusakan(id: string): Promise<void> {
    try {
        const docRef = doc(clientDb, "kerusakan", id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error in deleteKerusakan:", error);
        throw new Error("Gagal menghapus data kerusakan.");
    }
}

export async function getKerusakanByKode(kode: string): Promise<Kerusakan | null> {
    try {
        const q = query(collection(clientDb, "kerusakan"), where("kode", "==", kode), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() as Omit<Kerusakan, 'id'> };
        }
        return null;
    } catch (error) {
        console.error("Error in getKerusakanByKode:", error);
        throw new Error("Gagal mencari data kerusakan berdasarkan kode.");
    }
}

// --- Service untuk Gejala ---
export async function getAllGejala(): Promise<Gejala[]> {
    try {
        const q = query(collection(clientDb, "gejala"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<Gejala, 'id'>
        }));
    } catch (error) {
        console.error("Error in getAllGejala:", error);
        throw new Error("Gagal mengambil data gejala dari database.");
    }
}

export async function getGejalaById(id: string): Promise<Gejala | null> {
    try {
        const docRef = doc(clientDb, "gejala", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() as Omit<Gejala, 'id'> };
        }
        return null;
    } catch (error) {
        console.error("Error in getGejalaById:", error);
        throw new Error("Gagal mengambil data gejala dari database.");
    }
}

export async function addGejala(data: Omit<Gejala, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gejala> {
    try {
        const now = new Date().toISOString();
        const gejalaToSave = { ...data, createdAt: now, updatedAt: now };
        const docRef = await addDoc(collection(clientDb, "gejala"), gejalaToSave);
        return { id: docRef.id, ...gejalaToSave };
    } catch (error) {
        console.error("Error in addGejala:", error);
        throw new Error("Gagal menambahkan data gejala.");
    }
}

export async function updateGejala(id: string, data: Partial<Gejala>): Promise<void> {
    try {
        const docRef = doc(clientDb, "gejala", id);
        await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error in updateGejala:", error);
        throw new Error("Gagal memperbarui data gejala.");
    }
}

export async function deleteGejala(id: string): Promise<void> {
    try {
        const docRef = doc(clientDb, "gejala", id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error in deleteGejala:", error);
        throw new Error("Gagal menghapus data gejala.");
    }
}

export async function getGejalaByKode(kode: string): Promise<Gejala | null> {
    try {
        const q = query(collection(clientDb, "gejala"), where("kode", "==", kode), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() as Omit<Gejala, 'id'> };
        }
        return null;
    } catch (error) {
        console.error("Error in getGejalaByKode:", error);
        throw new Error("Gagal mencari data gejala berdasarkan kode.");
    }
}