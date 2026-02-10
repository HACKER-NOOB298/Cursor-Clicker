// cdn.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAH1oVGTvxKj6HHnsyuHqcikabx_Oq_Bpg",
    authDomain: "cursor-clicker.firebaseapp.com",
    projectId: "cursor-clicker",
    storageBucket: "cursor-clicker.firebasestorage.app",
    messagingSenderId: "820736183584",
    appId: "1:820736183584:web:75ecad687c02469b8b5b45",
    measurementId: "G-YQE2S8FVRF"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Autenticação
export async function loginUser(email, pass) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    currentUser = cred.user;
    return currentUser;
}

export async function registerUser(email, pass) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    currentUser = cred.user;
    // Cria doc inicial no leaderboard
    await saveGameData({ diamonds: 0, inventory: [] }, true); 
    return currentUser;
}

export function logoutUser() {
    signOut(auth).then(() => location.reload());
}

// Salvar
export async function saveGameData(data, forceCloud = false) {
    // Salva local sempre
    localStorage.setItem('cc_v2_save', JSON.stringify(data));
    
    // Salva nuvem se logado
    if (auth.currentUser) {
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                ...data,
                email: auth.currentUser.email,
                lastSeen: new Date()
            }, { merge: true });
        } catch (e) { console.error("Erro save cloud", e); }
    }
}

// Carregar
export async function loadGameData() {
    if (auth.currentUser) {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) return snap.data();
    }
    return JSON.parse(localStorage.getItem('cc_v2_save'));
}

// Leaderboard
export async function getLeaderboard() {
    try {
        const q = query(collection(db, "users"), orderBy("diamonds", "desc"), limit(10));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch (e) {
        console.error(e);
        return [];
    }
}

export { auth };
