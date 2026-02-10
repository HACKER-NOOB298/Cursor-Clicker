import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// --- CONFIGURE SUA API AQUI ---
const firebaseConfig = {
    apiKey: "AIzaSyAH1oVGTvxKj6HHnsyuHqcikabx_Oq_Bpg",
    authDomain:"cursor-clicker.firebaseapp.com",
    projectId: "cursor-clicker",
    storageBucket: "cursor-clicker.firebasestorage.app",
    messagingSenderId: "820736183584",
    appId: "1:820736183584:web:75ecad687c02469b8b5b45",
    measurementId: "G-YQE2S8FVRF"
  };

let app, auth, db;
let isOfflineMode = false;
let currentUser = null;

// Inicializa com tratamento de erro
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    document.getElementById('system-status').innerText = "🟢 Sistema Online";
    document.getElementById('system-status').style.color = "#00ff88";
} catch (e) {
    console.warn("API Offline. Ativando modo local.", e);
    isOfflineMode = true;
    document.getElementById('system-status').innerText = "🟠 Modo Local (API Falhou)";
    document.getElementById('system-status').style.color = "orange";
}

// --- FUNÇÕES EXPORTADAS ---

export async function loginUser(email, password) {
    if (isOfflineMode) throw new Error("API Indisponível. Use Modo Offline.");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    return currentUser;
}

export async function registerUser(email, password) {
    if (isOfflineMode) throw new Error("API Indisponível. Use Modo Offline.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    return currentUser;
}

export function logoutUser() {
    if (auth) signOut(auth);
    location.reload();
}

export async function saveGameData(data) {
    if (isOfflineMode || !currentUser) {
        localStorage.setItem('cc_save_v2', JSON.stringify(data));
    } else {
        try {
            await setDoc(doc(db, "players", currentUser.uid), {
                ...data,
                name: currentUser.email.split('@')[0],
                lastSeen: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            localStorage.setItem('cc_save_v2', JSON.stringify(data)); // Fallback
        }
    }
}

export async function loadGameData() {
    if (isOfflineMode || !currentUser) {
        return JSON.parse(localStorage.getItem('cc_save_v2'));
    } else {
        try {
            const snap = await getDoc(doc(db, "players", currentUser.uid));
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            return JSON.parse(localStorage.getItem('cc_save_v2'));
        }
    }
}

// Listener de Leaderboard em Tempo Real
export function subscribeToRank(callback) {
    if (isOfflineMode || !db) return;
    const q = query(collection(db, "players"), orderBy("diamonds", "desc"), limit(10));
    onSnapshot(q, (snap) => {
        const data = snap.docs.map((d, i) => ({ ...d.data(), rank: i+1, id: d.id }));
        callback(data);
    });
}

// Auto-Login Check
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            window.dispatchEvent(new CustomEvent('auth-success', { detail: user }));
        }
    });
}
