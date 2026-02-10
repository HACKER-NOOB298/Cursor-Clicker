import { loginUser, registerUser, logout, saveData, loadData } from './cdn.js';
import { loginUser, registerUser, logoutUser, saveGameData, loadGameData, subscribeToRank } from './cdn.js';

// --- CONFIGURAÇÃO CHROMA (CORES POR NÍVEL) ---
const themes = [
    { hex: "#00d2ff", name: "Cyber Blue" },   // 0-9
    { hex: "#00ff88", name: "Matrix Green" }, // 10-19
    { hex: "#ffd700", name: "Midas Gold" },   // 20-29
    { hex: "#ff0055", name: "Crimson Red" },  // 30-39
    { hex: "#9d00ff", name: "Void Purple" },  // 40-49
    { hex: "#ffffff", name: "Pure Light" }    // 50+

// --- CONFIGURAÇÃO DAS 15 EVOLUÇÕES ---
const upgrades = [
    { name: "Poder do Clique", cost: 15, cps: 0, power: 0.5, icon: "fa-mouse-pointer" }, // Nível de Cor
    { name: "Autoclicker V1", cost: 100, cps: 1, power: 0, icon: "fa-robot" },
    { name: "Hacker Estagiário", cost: 1100, cps: 8, power: 0, icon: "fa-user-ninja" },
    { name: "Servidor Dedicado", cost: 12000, cps: 47, power: 0, icon: "fa-server" },
    { name: "Fazenda de GPUs", cost: 130000, cps: 260, power: 0, icon: "fa-microchip" },
    { name: "Botnet Global", cost: 1400000, cps: 1400, power: 0, icon: "fa-network-wired" },
    { name: "IA Consciente", cost: 20000000, cps: 7800, power: 0, icon: "fa-brain" },
    { name: "Nuvem Quântica", cost: 330000000, cps: 44000, power: 0, icon: "fa-cloud" },
    { name: "Reator Nuclear", cost: 5100000000, cps: 260000, power: 0, icon: "fa-atom" },
    { name: "Sonda Espacial", cost: 75000000000, cps: 1600000, power: 0, icon: "fa-satellite" },
    { name: "Dobra Espacial", cost: 1000000000000, cps: 10000000, power: 0, icon: "fa-rocket" },
    { name: "Buraco Negro", cost: 14000000000000, cps: 65000000, power: 0, icon: "fa-circle" },
    { name: "Multiverso", cost: 200000000000000, cps: 400000000, power: 0, icon: "fa-infinity" },
    { name: "Deus da Máquina", cost: 5000000000000000, cps: 2500000000, power: 0, icon: "fa-eye" },
    { name: "Fim dos Tempos", cost: 999999999999999999, cps: 999999999999, power: 0, icon: "fa-skull" }
];

let state = { diamonds: 0, inventory: Array(15).fill(0) };

// --- FUNÇÕES DE INTERAÇÃO ---
window.tryLogin = async () => {
    try { await loginUser(document.getElementById('email').value, document.getElementById('password').value); }
    catch(e) { showToast(e.message); }
};
window.tryRegister = async () => {
    try { await registerUser(document.getElementById('email').value, document.getElementById('password').value); initGame(); }
    catch(e) { showToast(e.message); }
};
window.startGuestMode = () => { document.getElementById('p-mode').innerText = "OFFLINE"; initGame(); };
window.doLogout = logout;

window.addEventListener('logged-in', () => {
    document.getElementById('p-mode').innerText = "ONLINE";
    initGame();
});

async function initGame() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('game-app').classList.remove('hidden');
    
    const saved = await loadData();
    if(saved) state = { ...state, ...saved };
    
    renderStore();
    updateUI();
    updateChroma();
    
    setInterval(() => {
        const cps = upgrades.reduce((acc, u, i) => acc + (state.inventory[i] * u.cps), 0);
        if(cps > 0) { state.diamonds += cps/10; updateUI(cps); }
    }, 100);
    
    setInterval(() => saveData(state), 10000);
}

document.getElementById('click-area').addEventListener('mousedown', (e) => {
    const power = 1 + (state.inventory[0] * 0.5);
    state.diamonds += power;
    updateUI();
    showFloat(e.clientX, e.clientY, `+${Math.floor(power)}`);
});

window.buy = (i) => {
    const u = upgrades[i];
    const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
    if(state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[i]++;
        if(i === 0) updateChroma();
        renderStore();
        updateUI();
    }
};

function updateChroma() {
    const lvl = state.inventory[0];
    const idx = Math.min(Math.floor(lvl / 10), themes.length - 1);
    const theme = themes[idx];
    document.documentElement.style.setProperty('--dynamic-color', theme.hex);
    document.documentElement.style.setProperty('--dynamic-glow', theme.hex + '66');
    document.getElementById('current-color-name').innerText = theme.name;
    document.getElementById('cursor-lvl').innerText = lvl;
}

function renderStore() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = upgrades.map((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        return `
            <div class="upgrade-card" onclick="window.buy(${i})" id="upg-${i}">
                <div class="u-icon"><i class="fas ${u.icon}"></i></div>
                <div class="u-info">
                    <b>${u.name}</b>
                    <span class="cost">💎 ${format(cost)}</span>
                </div>
                <div class="u-count">${state.inventory[i]}</div>
            </div>
        `;
    }).join('');
}

function updateUI(cps = 0) {
    document.getElementById('diamonds-val').innerText = format(Math.floor(state.diamonds));
    document.getElementById('cps-val').innerText = `${format(cps)} / s`;
    upgrades.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        const el = document.getElementById(`upg-${i}`);
        if(el) state.diamonds >= cost ? el.classList.remove('locked') : el.classList.add('locked');
    });
}

// --- UTILITÁRIOS ---
function format(n) {
    if(n >= 1e12) return (n/1e12).toFixed(2) + "T";
    if(n >= 1e9) return (n/1e9).toFixed(2) + "B";
    if(n >= 1e6) return (n/1e6).toFixed(2) + "M";
    if(n >= 1e3) return (n/1e3).toFixed(1) + "K";
    return n.toLocaleString();
}

function showToast(m) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function showFloat(x,y,t) {
    const e = document.createElement('div'); e.className = 'float-text'; e.style.left = x+'px'; e.style.top = y+'px'; e.innerText = t;
    document.body.appendChild(e); setTimeout(() => e.remove(), 800);
}

// ABAS E ATALHOS
window.switchTab = (t) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
};

document.addEventListener('keydown', (e) => {
    if(e.code === 'Space') { 
        e.preventDefault();
        document.getElementById('click-area').dispatchEvent(new MouseEvent('mousedown'));
    }
    if(e.ctrlKey && e.key === 's') { e.preventDefault(); saveData(state); showToast("Salvo!"); }
});
