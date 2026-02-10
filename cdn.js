// cnd.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function saveGameData(state) {
    localStorage.setItem('cursor_save', JSON.stringify(state));
    if(auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), state, { merge: true });
    }
}

export async function loadGameData() {
    if(auth.currentUser) {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if(snap.exists()) return snap.data();
    }
    return JSON.parse(localStorage.getItem('cursor_save'));
}

export async function getLeaderboard() {
    const q = query(collection(db, "users"), orderBy("diamonds", "desc"), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export { auth };
// ... demais funções de login ...
