// --- IMPORTAÇÕES DO FIREBASE (VERSÃO WEB MODULAR) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, signInAnonymously 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, 
    collection, query, orderBy, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURAÇÃO (SUA API KEY) ---
const firebaseConfig = {
    apiKey: "AIzaSyAH1oVGTvxKj6HHnsyuHqcikabx_Oq_Bpg",
    authDomain: "cursor-clicker.firebaseapp.com",
    projectId: "cursor-clicker",
    storageBucket: "cursor-clicker.firebasestorage.app",
    messagingSenderId: "820736183584",
    appId: "1:820736183584:web:75ecad687c02469b8b5b45",
    measurementId: "G-YQE2S8FVRF"
};

// INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- FUNÇÕES DE AUTENTICAÇÃO ---
export async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function loginAnonymous() {
    try {
        const result = await signInAnonymously(auth);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Erro ao sair", error);
    }
}

// --- BANCO DE DADOS (FIRESTORE) ---
export async function saveGameData(gameState) {
    if (!auth.currentUser) return; // Não salva se não estiver logado
    const userRef = doc(db, "players", auth.currentUser.uid);
    
    // Prepara objeto para salvar (removemos dados sensíveis ou funções)
    const dataToSave = {
        email: auth.currentUser.email || "Anônimo",
        diamonds: gameState.diamonds || 0,
        inventory: gameState.inventory || [],
        achievements: gameState.achievements || [],
        settings: gameState.settings || {},
        lastSave: Date.now()
    };

    try {
        await setDoc(userRef, dataToSave, { merge: true });
        console.log("Jogo salvo na nuvem.");
    } catch (e) {
        console.error("Erro ao salvar:", e);
    }
}

export async function loadGameData() {
    if (!auth.currentUser) return null;
    const userRef = doc(db, "players", auth.currentUser.uid);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (e) {
        console.error("Erro ao carregar:", e);
    }
    return null;
}

// --- LEADERBOARD (RANKING) ---
export async function getLeaderboard() {
    const playersRef = collection(db, "players");
    const q = query(playersRef, orderBy("diamonds", "desc"), limit(10));
    
    try {
        const querySnapshot = await getDocs(q);
        let leaderboard = [];
        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });
        return leaderboard;
    } catch (e) {
        console.error("Erro ao buscar rank:", e);
        return [];
    }
}

// Exportar Auth para checagem de estado no script principal
export { auth };
