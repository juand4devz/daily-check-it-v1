import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import bcrypt from "bcrypt"
import { clientDb } from "./firebase-client";

export async function getRetriveDate(collectionName: string) {
    const snapshot = await getDocs(collection(clientDb, collectionName))

    const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return data;
}

export async function retriveDataById(collectionName: string, id: string) {
    const snapshot = await getDoc(doc(clientDb, collectionName, id));
    const data = snapshot.data();
    return data;
}

export async function register(
    data: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }
) {
    const q = query(
        collection(clientDb, "users"),
        where("email", "==", data.email),
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    if (users.length > 0) {
        return ({ status: false, statusCode: 400, message: "Email alreadt exists" });
    } else {
        data.role = "user";
        data.password = await bcrypt.hash(data.password, 10);

        try {
            await addDoc(collection(clientDb, "users"), data)
            return { status: true, statusCode: 200, message: "Register success" };
        } catch (error) {
            return { status: false, statusCode: 400, message: "Regisiter Failed", error }
        }
    }
}

export async function login(data: { email: string }) {
    const q = query(
        collection(clientDb, "users"),
        where("email", "==", data.email),
    );

    const snapshot = await getDocs(q);
    const user = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    if (user) {
        return user[0];
    } else {
        return null
    }
}

export async function loginWithGoogle(data: any, callback: any) {
    const q = query(
        collection(clientDb, "users"),
        where("email", "==", data.email),
    );
    const snapshot = await getDocs(q);
    const user: any = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    if (user.length > 0) {
        data.role = user[0].role;
        await updateDoc(doc(clientDb, "users", user[0].id), data).then(() => {
            callback({ status: true, data: data });
        });
    } else {
        data.role = "user";
        await addDoc(collection(clientDb, "users"), data).then(() => {
            callback({ status: true, data: data })
        })
    }
}

export async function loginWithGithub(data: any, callback: any) {
    const q = query(
        collection(clientDb, "users"),
        where("email", "==", data.email),
    );
    const snapshot = await getDocs(q);
    const user: any = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    if (user.length > 0) {
        data.role = user[0].role;
        await updateDoc(doc(clientDb, "users", user[0].id), data).then(() => {
            callback({ status: true, data: data });
        });
    } else {
        data.role = "user";
        await addDoc(collection(clientDb, "users"), data).then(() => {
            callback({ status: true, data: data })
        })
    }
}