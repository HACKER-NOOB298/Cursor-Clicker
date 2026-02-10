import { loginUser, registerUser, logoutUser, saveGameData, loadGameData, getLeaderboard, auth } from './cdn.js';

// 1. AS 15 EVOLUÇÕES
const UPGRADES = [
    { id: 0, name: "Cursor Extra", baseCost: 15, cps: 0.1, click: 1, icon: "fa-mouse-pointer" },
    { id: 1, name: "Vovó Dev", baseCost: 100, cps: 1, click: 0, icon: "fa-user-ninja" },
    { id: 2, name: "Server Rack", baseCost: 1100, cps: 8, click: 0, icon: "fa-server" },
    { id: 3, name: "Bot Farm", baseCost: 12000, cps: 47, click: 0, icon: "fa-robot" },
    { id: 4, name: "Mina de Cripto", baseCost: 130000, cps: 260, click: 0, icon: "fa-bitcoin-sign" },
    { id: 5, name: "Banco de Dados", baseCost: 1400000, cps: 1400, click: 0, icon: "fa-database" },
    { id: 6, name: "IA Generativa", baseCost: 20000000, cps: 7800, click: 0, icon: "fa-brain" },
    { id: 7, name: "Portal Quântico", baseCost: 330000000, cps: 44000, click: 0, icon: "fa-atom" },
    { id: 8, name: "Máquina do Tempo", baseCost: 5100000000, cps: 260000, click: 0, icon: "fa-clock" },
    { id: 9, name: "Satelite de Dados", baseCost: 75000000000, cps: 1600000, click: 0, icon: "fa-satellite" },
    { id: 10, name: "Cérebro Global", baseCost: 1000000000000, cps: 10000000, click: 0, icon: "fa-globe" },
    { id: 11, name: "Buraco Negro", baseCost: 14000000000000, cps: 65000000, click: 0, icon: "fa-circle" },
    { id: 12, name: "Dyson Sphere", baseCost: 170000000000000, cps: 430000000, click: 0, icon: "fa-sun" },
    { id: 13, name: "Multiverso", baseCost: 2100000000000000, cps: 2900000000, click: 0, icon: "fa-infinity" },
    { id: 14, name: "Deus do Clique", baseCost: 26000000000000000, cps: 21000000000, click: 0, icon: "fa-star" }
];

// 2. AS 30 CORES (SISTEMA CHROMA)
const COLORS = [
    { hex: "#00e5ff", name: "Cyber Blue" }, { hex: "#ff0055", name: "Neon Pink" }, { hex: "#00ff44", name: "Lime" },
    { hex: "#ffaa00", name: "Gold" }, { hex: "#aa00ff", name: "Purple" }, { hex: "#ffffff", name: "Pure" },
    { hex: "#ff4444", name: "Red" }, { hex: "#4444ff", name: "Deep Blue" }, { hex: "#ffff00", name: "Yellow" },
    { hex: "#00ffff", name: "Cyan" }, { hex: "#ff00ff", name: "Magenta" }, { hex: "#888888", name: "Iron" },
    { hex: "#cd7f32", name: "Bronze" }, { hex: "#c0c0c0", name: "Silver" }, { hex: "#ffd700", name: "Luxury" },
    { hex: "#b9f2ff", name: "Diamond" }, { hex: "#9e1316", name: "Ruby" }, { hex: "#50c878", name: "Emerald" },
    { hex: "#0f52ba", name: "Sapphire" }, { hex: "#e0115f", name: "Amethyst" }, { hex: "#f4a460", name: "Sand" },
    { hex: "#2f4f4f", name: "Dark Slate" }, { hex: "#ff4500", name: "Lava" }, { hex: "#1e90ff", name: "Ice" },
    { hex: "#adff2f", name: "Toxic" }, { hex: "#ff1493", name: "Deep Pink" }, { hex: "#000000", name: "Void" },
    { hex: "#7fff00", name: "Radioactive" }, { hex: "#000080", name: "Navy" }, { hex: "#ff0000", name: "GOD MODE" }
];

let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
};

// INICIALIZAÇÃO
window.startOffline = () => initGame(false);
window.tryLogin = async () => { /* Chamar loginUser do cdn.js */ initGame(true); };
window.tryRegister = async () => { /* Chamar registerUser do cdn.js */ initGame(true); };
window.manualSave = () => { saveGameData(state); showToast("Jogo Salvo!"); };
window.doLogout = logoutUser;

async function initGame(online) {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('game-app').classList.remove('hidden');
    
    const saved = await loadGameData();
    if(saved) { state.diamonds = saved.diamonds; state.inventory = saved.inventory || state.inventory; }
    
    renderShop();
    updateUI();
    startGameLoop();
}

// RENDERIZA A LOJA
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    UPGRADES.forEach((u, i) => {
        const item = document.createElement('div');
        item.className = "shop-item locked";
        item.id = `item-${i}`;
        item.onclick = () => buyUpgrade(i);
        item.innerHTML = `
            <div class="item-icon"><i class="fas ${u.icon}"></i></div>
            <div class="item-info">
                <span class="item-name">${u.name}</span>
                <span class="item-cost">💎 <span id="cost-${i}">0</span></span>
            </div>
            <div class="item-count" id="count-${i}">0</div>
        `;
        list.appendChild(item);
    });
}

// CLIQUE NO MOUSE
document.getElementById('click-pad').addEventListener('mousedown', (e) => {
    const power = 1 + (state.inventory[0] * UPGRADES[0].click);
    state.diamonds += power;
    createFloatText(e.clientX, e.clientY, `+${power}`);
    updateUI();
});

// COMPRAR UPGRADE
function buyUpgrade(idx) {
    const u = UPGRADES[idx];
    const cost = Math.floor(u.baseCost * Math.pow(1.15, state.inventory[idx]));
    
    if(state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[idx]++;
        updateUI();
    }
}

// ATUALIZA INTERFACE
function updateUI() {
    document.getElementById('score').innerText = Math.floor(state.diamonds).toLocaleString();
    
    let totalCps = 0;
    UPGRADES.forEach((u, i) => {
        const count = state.inventory[i];
        const cost = Math.floor(u.baseCost * Math.pow(1.15, count));
        totalCps += count * u.cps;
        
        document.getElementById(`cost-${i}`).innerText = cost.toLocaleString();
        document.getElementById(`count-${i}`).innerText = count;
        
        const btn = document.getElementById(`item-${i}`);
        if(state.diamonds >= cost) btn.classList.remove('locked');
        else btn.classList.add('locked');
    });

    document.getElementById('cps').innerText = `${totalCps.toFixed(1)} por segundo`;
    
    // Sistema Chroma (Mudar cor a cada 5 níveis do Upgrade 0)
    const colorIdx = Math.min(Math.floor(state.inventory[0] / 5), COLORS.length - 1);
    const color = COLORS[colorIdx];
    document.documentElement.style.setProperty('--cursor-color', color.hex);
    document.getElementById('color-name').innerText = color.name;
    document.getElementById('cursor-lvl').innerText = state.inventory[0] + 1;
}

// LOOP DE GANHOS E AUTO-SAVE
function startGameLoop() {
    setInterval(() => {
        let cps = 0;
        state.inventory.forEach((qtd, i) => cps += qtd * UPGRADES[i].cps);
        state.diamonds += cps / 10;
        updateUI();
    }, 100);

    setInterval(() => saveGameData(state), 10000); // Auto-save 10s
}

// ATALHOS DE TECLADO
document.addEventListener('keydown', (e) => {
    if(e.code === "Space") { // Clicar
        document.getElementById('click-pad').dispatchEvent(new Event('mousedown'));
    }
    if(e.ctrlKey && e.key === "s") { // Salvar
        e.preventDefault();
        window.manualSave();
    }
});

// AUXILIARES
function createFloatText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-txt';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

window.toggleLeaderboard = async () => {
    const modal = document.getElementById('leaderboard-modal');
    if(modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        const ranks = await getLeaderboard();
        document.getElementById('leaderboard-list').innerHTML = ranks.map((r, i) => `
            <div class="rank-row">
                <span>#${i+1} ${r.email.split('@')[0]}</span>
                <span>💎 ${Math.floor(r.diamonds).toLocaleString()}</span>
            </div>
        `).join('');
    } else modal.classList.add('hidden');
};

function showToast(m) { /* Implementar aviso simples se desejar */ alert(m); }
