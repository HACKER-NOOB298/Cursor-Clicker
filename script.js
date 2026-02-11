import { 
    loginUser, registerUser, resetPassword, saveGameData, 
    loadGameData, getLeaderboard, auth 
} from './cdn.js';

import { registerUser, loginUser, loginAnonymous, logoutUser, saveGameData, loadGameData, getLeaderboard, auth } from './cdn.js';


// --- CONFIGURAÇÃO: 15 EVOLUÇÕES ---
const UPGRADES = [
    { id: 0, n: "Mouse Plástico", cost: 15, cps: 0, click: 1, icon: "fa-mouse" },
    { id: 1, n: "Auto-Clicker", cost: 100, cps: 1, click: 0, icon: "fa-robot" },
    { id: 2, n: "Script Python", cost: 500, cps: 5, click: 0, icon: "fa-code" },
    { id: 3, n: "PC Gaming", cost: 2000, cps: 18, click: 0, icon: "fa-desktop" },
    { id: 4, n: "Servidor Nuvem", cost: 10000, cps: 55, click: 0, icon: "fa-cloud" },
    { id: 5, n: "Bot-Net", cost: 50000, cps: 160, click: 0, icon: "fa-network-wired" },
    { id: 6, n: "Hacker Profissional", cost: 250000, cps: 500, click: 0, icon: "fa-user-secret" },
    { id: 7, n: "Inteligência Artificial", cost: 1000000, cps: 1800, click: 0, icon: "fa-brain" },
    { id: 8, n: "Super Computador", cost: 5000000, cps: 6500, click: 0, icon: "fa-microchip" },
    { id: 9, n: "Chip Neural", cost: 25000000, cps: 20000, click: 0, icon: "fa-bolt" },
    { id: 10, n: "Satélite de Cliques", cost: 150000000, cps: 85000, click: 0, icon: "fa-satellite" },
    { id: 11, n: "Dobra Temporal", cost: 900000000, cps: 350000, click: 0, icon: "fa-history" },
    { id: 12, n: "Realidade Simulada", cost: 5000000000, cps: 1200000, click: 0, icon: "fa-vr-cardboard" },
    { id: 13, n: "Mão de Deus", cost: 50000000000, cps: 6000000, click: 0, icon: "fa-hand-sparkles" },
    { id: 14, n: "Big Bang 2.0", cost: 999999999999, cps: 30000000, click: 0, icon: "fa-infinity" }
];

// --- 30 CORES DINÂMICAS ---
const COLORS = ["#00d4ff", "#00ff00", "#ff00ff", "#ff9300", "#ff007f", "#ffd700", "#ffffff", "#ff0000", "#0044ff", "#40e0d0", "#ccff00", "#7f00ff", "#ff7f50", "#9966cc", "#c0c0c0", "#cd7f32", "#98fb98", "#cf1020", "#87ceeb", "#ffdab9", "#4b0082", "#50c878", "#e0115f", "#0f52ba", "#404040", "#8a2be2", "#aaff00", "#191970", "#fafad2", "#ff0044"];

let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    settings: { sound: true, size: 140 },
    totalClicks: 0
};

// --- ÁUDIO PROCEDURAL ---
const playSound = (f) => {
    if (!state.settings.sound) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = f;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    o.start(); o.stop(ctx.currentTime + 0.1);
};

// --- FUNÇÃO PRINCIPAL: LOGIN E INICIALIZAÇÃO ---
document.getElementById('btn-login').onclick = async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    const res = await loginUser(e, p);
    if (res.success) initGame(); else showError(res.error);
};

document.getElementById('btn-register').onclick = async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    const res = await registerUser(e, p);
    if (res.success) initGame(); else showError(res.error);
};

document.getElementById('btn-forgot').onclick = () => {
    document.getElementById('reset-modal').classList.remove('hidden');
};

document.getElementById('btn-confirm-reset').onclick = async () => {
    const email = document.getElementById('reset-email-input').value;
    const res = await resetPassword(email);
    if (res.success) {
        alert("E-mail de recuperação enviado!");
        document.getElementById('reset-modal').classList.add('hidden');
    } else alert(res.error);
};

function showError(m) {
    const el = document.getElementById('auth-msg');
    el.innerText = m; el.style.display = 'block';
}

// --- CORE GAMEPLAY ---
async function initGame() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    const saved = await loadGameData();
    if (saved) state = { ...state, ...saved };

    document.getElementById('player-name').innerText = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : "Anónimo";

    renderShop();
    updateUI();
    
    // Loop de Ganho Passivo
    setInterval(() => {
        const totalCPS = UPGRADES.reduce((acc, u, i) => acc + (u.cps * state.inventory[i]), 0);
        if (totalCPS > 0) {
            state.diamonds += totalCPS / 10;
            updateUI();
        }
    }, 100);

    // Auto-Save
    setInterval(() => saveGameData(state), 30000);
}

// CLIQUE
document.getElementById('main-clicker').onpointerdown = (e) => {
    const power = 1 + (state.inventory[0] * UPGRADES[0].click);
    state.diamonds += power;
    state.totalClicks++;
    
    playSound(400 + (Math.random() * 200));
    
    const icon = document.getElementById('cursor-icon');
    icon.style.transform = 'scale(0.8) rotate(-10deg)';
    setTimeout(() => icon.style.transform = 'scale(1)', 50);

    updateUI();
};

// RENDERIZAR LOJA (Aqui os botões são criados)
function renderShop() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ""; // Limpa

    UPGRADES.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        const item = document.createElement('div');
        item.className = `shop-item ${state.diamonds < cost ? 'locked' : ''}`;
        item.id = `upgrade-${i}`;
        item.innerHTML = `
            <div class="icon"><i class="fas ${u.icon}"></i></div>
            <div class="info">
                <b>${u.n}</b>
                <span>💎 ${format(cost)}</span>
            </div>
            <div class="qty">${state.inventory[i]}</div>
        `;
        item.onclick = () => buyUpgrade(i);
        list.appendChild(item);
    });
}

function buyUpgrade(idx) {
    const u = UPGRADES[idx];
    const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[idx]));

    if (state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[idx]++;
        playSound(800);
        renderShop();
        updateUI();
    }
}

function updateUI() {
    document.getElementById('diamond-display').innerText = format(Math.floor(state.diamonds));
    const totalCPS = UPGRADES.reduce((acc, u, i) => acc + (u.cps * state.inventory[i]), 0);
    document.getElementById('cps-display').innerText = format(totalCPS.toFixed(1));

    // CORES (30 Cores baseado no nível do primeiro item)
    const colorIdx = Math.min(Math.floor(state.inventory[0] / 3), 29);
    const mainColor = COLORS[colorIdx];
    document.documentElement.style.setProperty('--primary', mainColor);
    document.getElementById('chroma-dot').style.background = mainColor;

    // Atualizar estado visual da loja sem re-renderizar tudo
    UPGRADES.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        const el = document.getElementById(`upgrade-${i}`);
        if (el) {
            if (state.diamonds >= cost) el.classList.remove('locked');
            else el.classList.add('locked');
        }
    });
}

function format(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
}

// AJUSTES E MODAIS
document.getElementById('nav-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
document.getElementById('nav-rank').onclick = async () => {
    const m = document.getElementById('rank-modal');
    m.classList.remove('hidden');
    const data = await getLeaderboard();
    document.getElementById('leaderboard-data').innerHTML = data.map((p, i) => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #222">
            <span>#${i + 1} ${p.email.split('@')[0]}</span>
            <b style="color:var(--primary)">${format(Math.floor(p.diamonds))}</b>
        </div>
    `).join('');
};

window.closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
};

document.getElementById('range-cursor').oninput = (e) => {
    state.settings.size = e.target.value;
    document.documentElement.style.setProperty('--cursor-size', e.target.value + 'px');
};

document.getElementById('toggle-sound').onclick = (e) => {
    state.settings.sound = !state.settings.sound;
    e.target.innerText = state.settings.sound ? "ON" : "OFF";
};

document.getElementById('nav-save').onclick = () => {
    saveGameData(state);
    alert("Jogo guardado na nuvem!");
};

document.getElementById('nav-logout').onclick = () => {
    auth.signOut();
    window.location.reload();
};
