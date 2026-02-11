import { login, register, loginGuest, logout, auth, db } from './cdn.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURAÇÃO ---
const COLORS = ["#00f2ff","#00ff88","#ff0055","#eaff00","#ff00ff","#ffffff","#ff8800","#88ff00","#0088ff","#ff0000","#00ff44","#7700ff","#ffcc00","#00cccc","#ff6666","#66ff66","#6666ff","#ccff00","#ff00cc","#00ffcc","#ffffff","#ff5500","#0055ff","#55ff00","#aa00ff","#ff00aa","#00aaff","#aaff00","#ffaa00","#00ffaa"];

const EVOLUTIONS = Array.from({length: 15}, (_, i) => ({
    id: i,
    nome: `Evolução ${i+1}`,
    baseCost: 15 * Math.pow(5, i),
    cps: i * 2,
    clickPower: i + 1
}));

let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    totalClicks: 0,
    settings: { sound: true, cursorSize: 120 }
};

// --- ÁUDIO ---
function playClickSound() {
    if (!state.settings.sound) return;
    const audio = new Audio('https://www.fesliyanstudios.com/play-mp3/6'); // Som de clique curto
    audio.volume = 0.2;
    audio.play().catch(()=>{});
}

// --- LÓGICA DE JOGO ---
function doClick() {
    let power = 1;
    state.inventory.forEach((qty, i) => power += qty * EVOLUTIONS[i].clickPower);
    state.diamonds += power;
    state.totalClicks++;
    playClickSound();
    updateUI();
}

function updateUI() {
    document.getElementById('diamonds').innerText = Math.floor(state.diamonds).toLocaleString();
    let totalCps = 0;
    state.inventory.forEach((qty, i) => totalCps += qty * EVOLUTIONS[i].cps);
    document.getElementById('cps').innerText = totalCps.toLocaleString();

    // Evolução de Cor (Baseado no total de upgrades comprados)
    const totalUpgrades = state.inventory.reduce((a, b) => a + b, 0);
    const colorIdx = Math.min(Math.floor(totalUpgrades / 10), 29);
    document.documentElement.style.setProperty('--primary', COLORS[colorIdx]);
    
    renderShop();
}

function renderShop() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    EVOLUTIONS.forEach((ev, i) => {
        const cost = Math.floor(ev.baseCost * Math.pow(1.15, state.inventory[i]));
        const item = document.createElement('div');
        item.className = `shop-item ${state.diamonds < cost ? 'locked' : ''}`;
        item.innerHTML = `<div><b>${ev.nome}</b><br><small>💎 ${cost}</small></div> <b>${state.inventory[i]}</b>`;
        item.onclick = () => {
            if(state.diamonds >= cost) {
                state.diamonds -= cost;
                state.inventory[i]++;
                updateUI();
            }
        };
        container.appendChild(item);
    });
}

// --- SISTEMA ---
async function saveToCloud() {
    if(!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, state);
    document.getElementById('save-msg').innerText = "Cloud: Salvo!";
    setTimeout(() => document.getElementById('save-msg').innerText = "Cloud: Sync...", 2000);
}

// --- ATALHOS & EVENTOS ---
window.addEventListener('keydown', (e) => {
    if(e.code === 'Space') { e.preventDefault(); doClick(); }
    if(e.ctrlKey && e.key === 's') { e.preventDefault(); saveToCloud(); }
});

document.getElementById('main-cursor').onclick = doClick;
document.getElementById('mob-menu').onclick = () => document.querySelector('.left-panel').classList.toggle('active');
document.getElementById('mob-shop').onclick = () => document.querySelector('.right-panel').classList.toggle('active');
document.getElementById('close-menu-mob').onclick = () => document.querySelector('.left-panel').classList.remove('active');

// --- AUTH ---
document.getElementById('btn-login').onclick = async () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try { 
        const res = await login(e,p); 
        initGame(res.user);
    } catch(err) { alert("Erro ao entrar"); }
};

document.getElementById('btn-reg').onclick = async () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try { 
        const res = await register(e,p); 
        initGame(res.user);
    } catch(err) { alert("Erro ao registrar"); }
};

document.getElementById('btn-anon').onclick = async () => {
    const res = await loginGuest();
    initGame(res.user);
};

async function initGame(user) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-display').innerText = user.email || "Convidado";
    
    // Detecção de Dispositivo
    document.getElementById('device-info').innerText = window.innerWidth < 900 ? "Mobile Mode" : "Desktop Mode";

    const docSnap = await getDoc(doc(db, "users", user.uid));
    if(docSnap.exists()) state = docSnap.data();
    
    updateUI();
    setInterval(saveToCloud, 60000); // Auto save 1min
    
    // Loop de CPS
    setInterval(() => {
        let totalCps = 0;
        state.inventory.forEach((qty, i) => totalCps += qty * EVOLUTIONS[i].cps);
        if(totalCps > 0) {
            state.diamonds += totalCps / 10;
            updateUI();
        }
    }, 100);
}
