import { loginUser, registerUser, logoutUser, saveGameData, loadGameData, getLeaderboard, auth } from './cdn.js';

// --- CONFIGURAÇÃO: 15 EVOLUÇÕES ---
const upgrades = [
    { id: 0, name: "Cursor Extra", baseCost: 15, cps: 0.1, click: 1, icon: "fa-mouse-pointer" }, // Controla cor
    { id: 1, name: "Vovó Hacker", baseCost: 100, cps: 1, click: 0, icon: "fa-user-secret" },
    { id: 2, name: "Fazenda de Cliques", baseCost: 1100, cps: 8, click: 0, icon: "fa-tractor" },
    { id: 3, name: "Mina de Dados", baseCost: 12000, cps: 47, click: 0, icon: "fa-database" },
    { id: 4, name: "Fábrica de Mouses", baseCost: 130000, cps: 260, click: 0, icon: "fa-industry" },
    { id: 5, name: "Banco de Bits", baseCost: 1400000, cps: 1400, click: 0, icon: "fa-university" },
    { id: 6, name: "Templo do Click", baseCost: 20000000, cps: 7800, click: 0, icon: "fa-dungeon" },
    { id: 7, name: "Torre de Wizard", baseCost: 330000000, cps: 44000, click: 0, icon: "fa-hat-wizard" },
    { id: 8, name: "Foguete Espacial", baseCost: 5100000000, cps: 260000, click: 0, icon: "fa-rocket" },
    { id: 9, name: "Laboratório de Alquimia", baseCost: 75000000000, cps: 1600000, click: 0, icon: "fa-flask" },
    { id: 10, name: "Portal Dimensional", baseCost: 1000000000000, cps: 10000000, click: 0, icon: "fa-circle-notch" },
    { id: 11, name: "Máquina do Tempo", baseCost: 14000000000000, cps: 65000000, click: 0, icon: "fa-clock" },
    { id: 12, name: "Condensador de Antimatéria", baseCost: 170000000000000, cps: 430000000, click: 0, icon: "fa-atom" },
    { id: 13, name: "Prisma de Luz", baseCost: 2100000000000000, cps: 2900000000, click: 0, icon: "fa-gem" },
    { id: 14, name: "Cursor Divino", baseCost: 26000000000000000, cps: 21000000000, click: 0, icon: "fa-star" }
];

// --- 30 CORES DO CURSOR ---
// Muda a cada 5 níveis do Upgrade #0 (Cursor Extra)
const cursorColors = [
    { hex: "#ffffff", name: "Básico" }, { hex: "#cfcfcf", name: "Ferro" }, { hex: "#cd7f32", name: "Bronze" },
    { hex: "#c0c0c0", name: "Prata" }, { hex: "#ffd700", name: "Ouro" }, { hex: "#e5e4e2", name: "Platina" },
    { hex: "#b9f2ff", name: "Diamante" }, { hex: "#9e1316", name: "Rubi" }, { hex: "#50c878", name: "Esmeralda" },
    { hex: "#0f52ba", name: "Safira" }, { hex: "#9966cc", name: "Ametista" }, { hex: "#ff007f", name: "Quartzo Rosa" },
    { hex: "#00ffff", name: "Neon Cyan" }, { hex: "#ff00ff", name: "Neon Magenta" }, { hex: "#00ff00", name: "Hacker Green" },
    { hex: "#ff4500", name: "Lava" }, { hex: "#1e90ff", name: "Gelo" }, { hex: "#9400d3", name: "Vazio" },
    { hex: "#ffd1dc", name: "Sakura" }, { hex: "#ff8c00", name: "Solar" }, { hex: "#8a2be2", name: "Galáctico" },
    { hex: "#ff1493", name: "Plasma" }, { hex: "#00ced1", name: "Turquesa" }, { hex: "#dc143c", name: "Carmesim" },
    { hex: "#7fff00", name: "Radioativo" }, { hex: "#f4a460", name: "Areia" }, { hex: "#2f4f4f", name: "Sombra" },
    { hex: "#f0f8ff", name: "Celestial" }, { hex: "#222222", name: "Matéria Escura" }, { hex: "#ff0000", name: "DEUS" }
];

let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    startTime: Date.now()
};

// --- INICIALIZAÇÃO ---
window.tryLogin = async () => {
    try {
        const u = await loginUser(document.getElementById('email').value, document.getElementById('password').value);
        showToast(`Bem-vindo, ${u.email.split('@')[0]}!`);
        initGame(true);
    } catch(e) { showToast("Erro: " + e.message); }
};

window.tryRegister = async () => {
    try {
        await registerUser(document.getElementById('email').value, document.getElementById('password').value);
        initGame(true);
    } catch(e) { showToast("Erro: " + e.message); }
};

window.startOffline = () => initGame(false);
window.doLogout = logoutUser;
window.manualSave = () => { saveGameData(state); showToast("Jogo Salvo!"); };

// Abre Modal de Rank
window.toggleLeaderboard = async () => {
    const modal = document.getElementById('leaderboard-modal');
    const list = document.getElementById('leaderboard-list');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        list.innerHTML = "Carregando ranking global...";
        
        const data = await getLeaderboard();
        list.innerHTML = data.map((u, i) => `
            <div class="rank-row">
                <span>#${i+1} ${u.email ? u.email.split('@')[0] : 'Anon'}</span>
                <span>💎 ${formatNum(u.diamonds)}</span>
            </div>
        `).join('');
    } else {
        modal.classList.add('hidden');
    }
};

async function initGame(isOnline) {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('game-app').classList.remove('hidden');
    if(isOnline && auth.currentUser) {
        document.getElementById('player-name').innerText = auth.currentUser.email.split('@')[0];
    }
    
    // Carregar Save
    const loaded = await loadGameData();
    if (loaded) {
        state.diamonds = loaded.diamonds || 0;
        state.inventory = loaded.inventory || Array(15).fill(0);
    }

    renderShop();
    updateUI();
    gameLoop();
}

// --- GAME LOOP ---
function gameLoop() {
    setInterval(() => {
        let cps = 0;
        state.inventory.forEach((qtd, i) => cps += qtd * upgrades[i].cps);
        
        if (cps > 0) {
            state.diamonds += cps / 10;
            updateUI(cps);
        }
    }, 100);

    // Auto Save a cada 30s
    setInterval(() => saveGameData(state), 30000);
}

// --- CLIQUE MANUAL ---
document.getElementById('click-pad').addEventListener('mousedown', (e) => {
    doClick(e.clientX, e.clientY);
});

// Atalho Teclado (Espaço)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const pad = document.getElementById('click-pad').getBoundingClientRect();
        doClick(pad.left + pad.width/2, pad.top + pad.height/2);
        // Efeito visual no botão
        document.getElementById('main-cursor').style.transform = "scale(0.8)";
        setTimeout(()=> document.getElementById('main-cursor').style.transform = "scale(1)", 50);
    }
    // Atalho Salvar (Ctrl+S)
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        window.manualSave();
    }
});

function doClick(x, y) {
    // Força baseada no upgrade 0
    let power = 1 + (state.inventory[0] * upgrades[0].click);
    state.diamonds += power;
    
    createFloatingText(x, y, `+${formatNum(power)}`);
    updateUI();
}

// --- LOJA ---
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    
    upgrades.forEach((u, i) => {
        const item = document.createElement('div');
        item.className = "shop-item";
        item.id = `upg-${i}`;
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

function buyUpgrade(id) {
    const u = upgrades[id];
    const lvl = state.inventory[id];
    const cost = Math.floor(u.baseCost * Math.pow(1.15, lvl));

    if (state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[id]++;
        updateUI();
        if(id === 0) updateChroma(); // Atualiza cor
    }
}

// --- VISUAL ---
function updateUI(cps) {
    document.getElementById('score').innerText = formatNum(Math.floor(state.diamonds));
    
    if (cps !== undefined) document.getElementById('cps').innerText = `${formatNum(cps)} / seg`;

    // Atualiza Loja
    upgrades.forEach((u, i) => {
        const lvl = state.inventory[i];
        const cost = Math.floor(u.baseCost * Math.pow(1.15, lvl));
        
        document.getElementById(`cost-${i}`).innerText = formatNum(cost);
        document.getElementById(`count-${i}`).innerText = lvl;
        
        const el = document.getElementById(`upg-${i}`);
        if(state.diamonds >= cost) el.classList.remove('locked');
        else el.classList.add('locked');
    });

    updateChroma();
}

function updateChroma() {
    const lvl = state.inventory[0]; // Nível do Cursor Extra
    // Muda a cor a cada 5 níveis (ex: nv 0-4 = cor 0, nv 5-9 = cor 1)
    const colorIdx = Math.min(Math.floor(lvl / 5), cursorColors.length - 1);
    const color = cursorColors[colorIdx];

    document.documentElement.style.setProperty('--cursor-color', color.hex);
    document.getElementById('color-name').innerText = color.name;
    document.getElementById('color-name').style.color = color.hex;
    document.getElementById('cursor-lvl').innerText = lvl;
}

function createFloatingText(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'float-txt';
    el.innerText = txt;
    // Posição aleatória leve
    const randomX = (Math.random() - 0.5) * 40;
    el.style.left = (x + randomX) + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:20px; z-index:1000;";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// Formatação (1K, 1M, 1B)
function formatNum(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
}
