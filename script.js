/**
 * CURSOR CLICKER ELITE ENGINE
 * Desenvolvido para máxima performance e diversão.
 */

import { saveGameData, loadGameData, auth } from './cdn.js';

// --- 1. CONFIGURAÇÃO DE DADOS ---
const UPGRADES = [
    { id: 0, name: "Micro-Transistor", cost: 15, cps: 0, click: 1, icon: "fa-microchip" },
    { id: 1, name: "Bot Aprendiz", cost: 100, cps: 1, click: 0, icon: "fa-robot" },
    { id: 2, name: "Servidor VPS", cost: 1100, cps: 8, click: 0, icon: "fa-server" },
    { id: 3, name: "Farm de Cliques", cost: 12000, cps: 47, click: 0, icon: "fa-tractor" },
    { id: 4, name: "Mina de Cripto", cost: 130000, cps: 260, click: 0, icon: "fa-bitcoin-sign" },
    { id: 5, name: "IA Treinada", cost: 1400000, cps: 1400, click: 0, icon: "fa-brain" },
    { id: 6, name: "Quantum Rig", cost: 20000000, cps: 7800, click: 0, icon: "fa-atom" },
    { id: 7, name: "Sonda de Dados", cost: 330000000, cps: 44000, click: 0, icon: "fa-satellite" },
    { id: 8, name: "Nuvem Privada", cost: 5100000000, cps: 260000, click: 0, icon: "fa-cloud" },
    { id: 9, name: "Holograma Dev", cost: 75000000000, cps: 1600000, click: 0, icon: "fa-project-diagram" },
    { id: 10, name: "Motor de Dobra", cost: 1e12, cps: 1e7, click: 0, icon: "fa-rocket" },
    { id: 11, name: "Singularidade", cost: 14e12, cps: 65e6, click: 0, icon: "fa-circle-notch" },
    { id: 12, name: "Matriz Global", cost: 170e12, cps: 430e6, click: 0, icon: "fa-globe" },
    { id: 13, name: "Antimatéria", cost: 2e15, cps: 3e9, click: 0, icon: "fa-flask" },
    { id: 14, name: "Cursor Divino", cost: 26e15, cps: 21e9, click: 0, icon: "fa-hand-sparkles" }
];

const CHROMA_SYSTEM = [
    { name: "Cyber Blue", hex: "#00d4ff" }, { name: "Neon Lime", hex: "#39ff14" }, { name: "Ruby", hex: "#ff0040" },
    { name: "Gold Rush", hex: "#ffcc00" }, { name: "Amethyst", hex: "#9d00ff" }, { name: "Orange Sun", hex: "#ff6600" },
    { name: "Pink Panther", hex: "#ff00ff" }, { name: "Ice Cold", hex: "#a5f2ff" }, { name: "Deep Sea", hex: "#0040ff" },
    { name: "Toxic", hex: "#adff2f" }, { name: "Blood", hex: "#800000" }, { name: "Cloud", hex: "#f0f0f0" },
    { name: "Chocolate", hex: "#d2691e" }, { name: "Mint", hex: "#98fb98" }, { name: "Steel", hex: "#708090" },
    { name: "Void", hex: "#1a1a1a" }, { name: "Solar Flare", hex: "#ff4500" }, { name: "Lavender", hex: "#e6e6fa" },
    { name: "Forest", hex: "#228b22" }, { name: "Electric", hex: "#7fffd4" }, { name: "Royal", hex: "#4169e1" },
    { name: "Salmon", hex: "#fa8072" }, { name: "Sand", hex: "#f4a460" }, { name: "Emerald", hex: "#50c878" },
    { name: "Fuchsia", hex: "#ff00ff" }, { name: "Crimson", hex: "#dc143c" }, { name: "Titanium", hex: "#d1d1d1" },
    { name: "Night", hex: "#0c0c0c" }, { name: "Plasma", hex: "#ff0080" }, { name: "GOD", hex: "#ffffff" }
];

// --- 2. ESTADO DO JOGO ---
let game = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    totalClicks: 0,
    startTime: Date.now(),
    multiplier: 1
};

// --- 3. CORE LOGIC ---
const target = document.getElementById('main-target');

function handleClick(e) {
    const clickPower = (1 + (game.inventory[0] * UPGRADES[0].click)) * game.multiplier;
    game.diamonds += clickPower;
    game.totalClicks++;

    createParticle(e.clientX, e.clientY, `+${formatNum(clickPower)}`);
    updateUI();
}

target.addEventListener('mousedown', handleClick);

function buyUpgrade(idx) {
    const up = UPGRADES[idx];
    const cost = Math.floor(up.cost * Math.pow(1.15, game.inventory[idx]));

    if (game.diamonds >= cost) {
        game.diamonds -= cost;
        game.inventory[idx]++;
        updateUI();
        renderShop();
        showNotification(`${up.name} Adquirido!`);
    }
}

// --- 4. RENDERIZAÇÃO ---
function renderShop() {
    const container = document.getElementById('upgrade-list');
    container.innerHTML = "";
    
    UPGRADES.forEach((up, i) => {
        const cost = Math.floor(up.cost * Math.pow(1.15, game.inventory[i]));
        const card = document.createElement('div');
        card.className = `upgrade-card ${game.diamonds < cost ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="icon-box"><i class="fas ${up.icon}"></i></div>
            <div class="up-details">
                <span class="up-name">${up.name}</span>
                <span class="up-cost">💎 ${formatNum(cost)}</span>
            </div>
            <div class="up-qty">${game.inventory[i]}</div>
        `;
        card.onclick = () => buyUpgrade(i);
        container.appendChild(card);
    });
}

function updateUI() {
    document.getElementById('main-score').innerText = formatNum(Math.floor(game.diamonds));
    
    let totalCps = 0;
    game.inventory.forEach((qty, i) => totalCps += qty * UPGRADES[i].cps);
    document.getElementById('main-cps').innerText = formatNum(totalCps);

    // Sistema Chroma (Muda a cada 5 níveis do primeiro upgrade)
    const chromaIndex = Math.min(Math.floor(game.inventory[0] / 5), 29);
    const theme = CHROMA_SYSTEM[chromaIndex];
    document.documentElement.style.setProperty('--accent', theme.hex);
    document.getElementById('current-color-name').innerText = theme.name;
    document.getElementById('cursor-lvl-val').innerText = game.inventory[0] + 1;
}

// --- 5. UTILITÁRIOS ---
function formatNum(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
}

function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'particle-text';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.color = 'var(--accent)';
    p.innerText = text;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
}

function showNotification(msg) {
    const container = document.getElementById('notif-container');
    const n = document.createElement('div');
    n.className = 'toast-msg';
    n.innerText = msg;
    container.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// --- 6. LOOPS ---
setInterval(() => {
    let cps = 0;
    game.inventory.forEach((qty, i) => cps += qty * UPGRADES[i].cps);
    if (cps > 0) {
        game.diamonds += cps / 10;
        updateUI();
    }
}, 100);

// Auto-Save
setInterval(() => saveGameData(game), 15000);

// Inicialização
window.onload = async () => {
    const saved = await loadGameData();
    if (saved) game = { ...game, ...saved };
    
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    renderShop();
    updateUI();
};
