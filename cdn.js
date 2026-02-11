// cdn.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, sendPasswordResetEmail, signInAnonymously 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, 
    collection, query, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURAÇÃO EXATA FORNECIDA ---
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

// --- FUNÇÕES DE UTILIDADE ---
function translateError(code) {
    const errors = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/weak-password': 'Senha muito fraca (min 6 caracteres).',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.'
    };
    return errors[code] || `Erro desconhecido: ${code}`;
}

// --- AUTENTICAÇÃO ---
export async function loginUser(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
}

export async function registerUser(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Cria documento inicial vazio
        await setDoc(doc(db, "users", result.user.uid), {
            email: email,
            diamonds: 0,
            createdAt: new Date()
        });
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
}

export async function loginAnon() {
    try {
        const result = await signInAnonymously(auth);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
}

export async function resetPass(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: translateError(error.code) };
    }
}

export async function logout() {
    await signOut(auth);
    window.location.reload();
}

// --- DATABASE (SAVE/LOAD) ---
export async function saveGameCloud(data) {
    if (!auth.currentUser) return { success: false, error: "Não logado" };
    try {
        // Salva dados do jogo + dados para o Leaderboard
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, {
            ...data,
            lastSave: new Date(),
            email: auth.currentUser.email || "Anônimo",
            // Campos específicos para facilitar a query do Leaderboard
            leaderboardScore: data.diamonds, 
            leaderboardCPS: data.cps
        }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Erro ao salvar:", e);
        return { success: false, error: e.message };
    }
}

export async function loadGameCloud() {
    if (!auth.currentUser) return null;
    try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        console.error("Erro ao carregar:", e);
        return null;
    }
}

// --- LEADERBOARD ---
export async function getLeaderboardData() {
    try {
        const q = query(collection(db, "users"), orderBy("leaderboardScore", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const leaders = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            leaders.push({
                name: data.email ? data.email.split('@')[0] : "Anônimo",
                score: data.leaderboardScore || 0
            });
        });
        return leaders;
    } catch (e) {
        console.error("Erro leaderboard:", e);
        return [];
    }
}

// Exporta o auth para verificar estado no script principal
export { auth };
