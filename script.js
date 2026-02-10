import { loginUser, registerUser, logoutUser, saveGameData, loadGameData, getLeaderboard, auth } from './cdn.js';

// --- 1. CONFIGURAÇÃO: 15 EVOLUÇÕES ---
// ID 0 é especial: Aumenta o clique manual e muda a cor do cursor.
const UPGRADES = [
    { name: "Cursor Reforçado", baseCost: 15, cps: 0, click: 1, icon: "fa-mouse-pointer" },
    { name: "Autoclicker Básico", baseCost: 100, cps: 1, click: 0, icon: "fa-robot" },
    { name: "Vovó Hacker", baseCost: 500, cps: 5, click: 0, icon: "fa-user-ninja" },
    { name: "Fazenda de Cliques", baseCost: 2000, cps: 15, click: 0, icon: "fa-tractor" },
    { name: "Servidor Dedicado", baseCost: 10000, cps: 50, click: 0, icon: "fa-server" },
    { name: "Mina de Cripto", baseCost: 40000, cps: 150, click: 0, icon: "fa-bitcoin-sign" },
    { name: "Botnet Global", baseCost: 200000, cps: 500, click: 0, icon: "fa-network-wired" },
    { name: "IA de Ponta", baseCost: 1000000, cps: 2000, click: 0, icon: "fa-brain" },
    { name: "Computação Quântica", baseCost: 5000000, cps: 7500, click: 0, icon: "fa-atom" },
    { name: "Sonda Espacial", baseCost: 25000000, cps: 30000, click: 0, icon: "fa-satellite" },
    { name: "Esfera de Dyson", baseCost: 150000000, cps: 100000, click: 0, icon: "fa-sun" },
    { name: "Manipulador do Tempo", baseCost: 1000000000, cps: 500000, click: 0, icon: "fa-clock" },
    { name: "Motor de Dobra", baseCost: 20000000000, cps: 4000000, click: 0, icon: "fa-rocket" },
    { name: "Multiverso", baseCost: 150000000000, cps: 20000000, click: 0, icon: "fa-infinity" },
    { name: "Cursor Divino", baseCost: 999999999999, cps: 100000000, click: 0, icon: "fa-hand-sparkles" }
];

// --- 2. CONFIGURAÇÃO: 30 CORES (SISTEMA CHROMA) ---
const CURSOR_COLORS = [
    { hex: "#ffffff", name: "Clássico" }, { hex: "#cccccc", name: "Prata" }, { hex: "#a0a0a0", name: "Titânio" },
    { hex: "#cd7f32", name: "Bronze" }, { hex: "#d4af37", name: "Ouro" }, { hex: "#b9f2ff", name: "Diamante" },
    { hex: "#ff9999", name: "Vermelho Claro" }, { hex: "#ff0000", name: "Vermelho Puro" }, { hex: "#990000", name: "Carmesim" },
    { hex: "#ff6600", name: "Laranja" }, { hex: "#ffcc00", name: "Amarelo" }, { hex: "#99ff99", name: "Verde Claro" },
    { hex: "#00ff00", name: "Verde Neon" }, { hex: "#009900", name: "Verde Escuro" }, { hex: "#00ffcc", name: "Ciano" },
    { hex: "#0099ff", name: "Azul Celeste" }, { hex: "#0000ff", name: "Azul Puro" }, { hex: "#000099", name: "Azul Marinho" },
    { hex: "#cc99ff", name: "Lavanda" }, { hex: "#9900ff", name: "Roxo Neon" }, { hex: "#660099", name: "Roxo Profundo" },
    { hex: "#ff66ff", name: "Rosa Choque" }, { hex: "#ff00ff", name: "Magenta" }, { hex: "#ff0099", name: "Pink" },
    { hex: "#ff3333", name: "Plasma" }, { hex: "#33ff33", name: "Tóxico" }, { hex: "#3333ff", name: "Elétrico" },
    { hex: "#222222", name: "Obsidiana" }, { hex: "#555555", name: "Aço" }, { hex: "#ff0000", name: "LENDÁRIO" }
];

let gameState = {
    diamonds: 0,
    inventory: Array(UPGRADES.length).fill(0),
    lastSave: Date.now()
};

// --- FUNÇÕES DE ENTRADA (WINODW) ---
window.startOffline = () => initGame();
window.tryLogin = async () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    if(!e || !p) return showToast("Preencha e-mail e senha.");
    try { await loginUser(e, p); initGame(); } catch(err) { showToast("Erro: " + err.code); }
};
window.tryRegister = async () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    if(!e || !p) return showToast("Preencha e-mail e senha.");
    try { await registerUser(e, p); initGame(); } catch(err) { showToast("Erro: " + err.code); }
};
window.manualSave = () => { saveGameData(gameState); showToast("Jogo salvo!"); };
window.doLogout = logoutUser;
window.toggleRank = async () => {
    const modal = document.getElementById('rank-modal');
    const list = document.getElementById('rank-list');
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) {
        list.innerHTML = '<div style="padding:20px;text-align:center;">Carregando...</div>';
        const ranks = await getLeaderboard();
        list.innerHTML = ranks.map((r, i) => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333; ${r.id === auth.currentUser?.uid ? 'color:var(--accent);font-weight:bold;' : ''}">
                <span>#${i+1} ${r.email.split('@')[0]}</span>
                <span>💎 ${formatNumber(r.diamonds)}</span>
            </div>
        `).join('') || '<div style="padding:20px;">Sem dados.</div>';
    }
};

// --- INICIALIZAÇÃO DO JOGO ---
async function initGame() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('game-app').classList.remove('hidden');
    
    if(auth.currentUser) {
        document.getElementById('player-id').innerText = auth.currentUser.email.split('@')[0];
        document.getElementById('rank-status-text').innerText = "Logado. Toque para ver o Rank.";
    }

    const saved = await loadGameData();
    if(saved) {
        gameState.diamonds = saved.diamonds || 0;
        gameState.inventory = saved.inventory || Array(UPGRADES.length).fill(0);
    }

    renderShopUI();
    updateUI();
    
    // Loop de CPS (Renda Passiva)
    setInterval(() => {
        let cps = UPGRADES.reduce((total, u, i) => total + (gameState.inventory[i] * u.cps), 0);
        if(cps > 0) {
            gameState.diamonds += cps / 10;
            updateUI(cps);
        }
    }, 100);

    // Auto-Save (30s)
    setInterval(() => saveGameData(gameState), 30000);
}

// --- CLIQUE MANUAL ---
document.getElementById('click-pad').addEventListener('mousedown', (e) => {
    const cursorLvl = gameState.inventory[0];
    const clickPower = 1 + (cursorLvl * UPGRADES[0].click);
    gameState.diamonds += clickPower;
    
    createFloatingText(e.clientX, e.clientY, `+${formatNumber(clickPower)}`);
    updateUI();
});

// --- LÓGICA DA LOJA ---
function renderShopUI() {
    const list = document.getElementById('shop-list');
    list.innerHTML = UPGRADES.map((u, i) => `
        <div class="shop-item locked" id="shop-item-${i}" onclick="window.buyItem(${i})">
            <div class="item-icon"><i class="fas ${u.icon}"></i></div>
            <div class="item-details">
                <span class="item-name">${u.name}</span>
                <span class="item-cost">💎 <span id="cost-${i}">0</span></span>
            </div>
            <div class="item-count" id="count-${i}">0</div>
        </div>
    `).join('');
}

window.buyItem = (idx) => {
    const u = UPGRADES[idx];
    const level = gameState.inventory[idx];
    const cost = Math.floor(u.baseCost * Math.pow(1.15, level));
    
    if(gameState.diamonds >= cost) {
        gameState.diamonds -= cost;
        gameState.inventory[idx]++;
        updateUI();
        showToast(`Comprou: ${u.name}!`);
    }
};

// --- ATUALIZAÇÃO VISUAL ---
function updateUI(cpsCount = 0) {
    // Pontuação e CPS
    document.getElementById('score').innerText = formatNumber(Math.floor(gameState.diamonds));
    if(cpsCount > 0) document.getElementById('cps-display').innerText = `${formatNumber(cpsCount)} diamantes/seg`;

    // Atualiza Loja (Preços e Travas)
    UPGRADES.forEach((u, i) => {
        const level = gameState.inventory[i];
        const cost = Math.floor(u.baseCost * Math.pow(1.15, level));
        
        document.getElementById(`cost-${i}`).innerText = formatNumber(cost);
        document.getElementById(`count-${i}`).innerText = level;
        
        const itemEl = document.getElementById(`shop-item-${i}`);
        if(gameState.diamonds >= cost) itemEl.classList.remove('locked');
        else itemEl.classList.add('locked');
    });

    updateCursorColor();
}

// --- SISTEMA DE COR DINÂMICA (CHROMA) ---
function updateCursorColor() {
    const cursorLvl = gameState.inventory[0];
    // Muda de cor a cada 5 níveis. Usa o operador % para ciclar se passar de 30.
    const colorIndex = Math.floor(cursorLvl / 5) % CURSOR_COLORS.length;
    const theme = CURSOR_COLORS[colorIndex];

    // Injeta a nova cor no CSS
    document.documentElement.style.setProperty('--cursor-color', theme.hex);
    document.documentElement.style.setProperty('--accent', theme.hex);
    
    document.getElementById('color-name').innerText = theme.name;
    document.getElementById('cursor-level').innerText = cursorLvl;
}

// --- UTILITÁRIOS ---
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
}

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-text'; el.innerText = text;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showToast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
    document.getElementById('toast-box').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// Atalhos de Teclado (PC)
document.addEventListener('keydown', (e) => {
    if(e.code === "Space") { e.preventDefault(); document.getElementById('click-pad').dispatchEvent(new Event('mousedown')); }
    if(e.ctrlKey && e.key === "s") { e.preventDefault(); window.manualSave(); }
});
