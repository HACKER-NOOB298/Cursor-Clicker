import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, signInAnonymously, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, 
    collection, query, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAH1oVGTvxKj6HHnsyuHqcikabx_Oq_Bpg",
    authDomain: "cursor-clicker.firebaseapp.com",
    projectId: "cursor-clicker",
    storageBucket: "cursor-clicker.firebasestorage.app",
    messagingSenderId: "820736183584",
    appId: "1:820736183584:web:75ecad687c02469b8b5b45",
    measurementId: "G-YQE2S8FVRF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tradução de erros do Firebase para o utilizador
function translateError(code) {
    switch (code) {
        case 'auth/invalid-email': return 'E-mail inválido.';
        case 'auth/user-not-found': return 'Utilizador não encontrado.';
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
        case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
        default: return 'Ocorreu um erro. Tente novamente.';
    }
}

export async function loginUser(email, password) {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: res.user };
    } catch (e) {
        return { success: false, error: translateError(e.code) };
    }
}

export async function registerUser(email, password) {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: res.user };
    } catch (e) {
        return { success: false, error: translateError(e.code) };
    }
}

export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (e) {
        return { success: false, error: translateError(e.code) };
    }
}

export async function saveGameData(data) {
    if (!auth.currentUser) return;
    try {
        await setDoc(doc(db, "players", auth.currentUser.uid), {
            ...data,
            lastUpdate: Date.now(),
            email: auth.currentUser.email || "Anónimo"
        }, { merge: true });
    } catch (e) { console.error("Erro ao salvar:", e); }
}

export async function loadGameData() {
    if (!auth.currentUser) return null;
    const snap = await getDoc(doc(db, "players", auth.currentUser.uid));
    return snap.exists() ? snap.data() : null;
}

export async function getLeaderboard() {
    const q = query(collection(db, "players"), orderBy("diamonds", "desc"), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}

export { auth, loginAnonymous, signOut };
