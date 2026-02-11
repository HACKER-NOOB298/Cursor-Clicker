import { saveGameData, loadGameData, auth } from './cdn.js';

// --- SISTEMA DE SOM (WEB AUDIO API) ---
// Gera sons sem precisar de arquivos mp3
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const SoundSys = {
    enabled: true,
    playClick: () => {
        if (!SoundSys.enabled) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        // Som de "Click" agudo e curto
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },
    playBuy: () => {
        if (!SoundSys.enabled) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        // Som de "Moeda"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    },
    playAchievement: () => {
        if (!SoundSys.enabled) return;
        // Som glorioso (placeholder simples)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
};

// --- CONFIGURAÇÃO ---
const UPGRADES = [
    { name: "Cursor Reforçado", cost: 15, cps: 0, click: 1, icon: "fa-mouse" },
    { name: "Auto-Clicker", cost: 100, cps: 1, click: 0, icon: "fa-robot" },
    { name: "Script Kiddie", cost: 500, cps: 5, click: 0, icon: "fa-user-secret" },
    { name: "Fazenda de GPU", cost: 3000, cps: 15, click: 0, icon: "fa-server" },
    { name: "Mineradora BTC", cost: 10000, cps: 50, click: 0, icon: "fa-bitcoin-sign" },
    { name: "Hacker de Elite", cost: 40000, cps: 120, click: 0, icon: "fa-laptop-code" },
    { name: "Botnet Global", cost: 200000, cps: 400, click: 0, icon: "fa-network-wired" },
    { name: "IA de Ponta", cost: 1000000, cps: 1500, click: 0, icon: "fa-brain" },
    { name: "Nanobots", cost: 5000000, cps: 5000, click: 0, icon: "fa-bacterium" },
    { name: "Computador Quântico", cost: 20000000, cps: 20000, click: 0, icon: "fa-atom" },
    { name: "Matéria Escura", cost: 100000000, cps: 100000, click: 0, icon: "fa-cloud-moon" },
    { name: "Viagem no Tempo", cost: 1000000000, cps: 500000, click: 0, icon: "fa-clock" },
    { name: "Império Galáctico", cost: 5000000000, cps: 2000000, click: 0, icon: "fa-space-shuttle" },
    { name: "Realidade Virtual", cost: 20000000000, cps: 10000000, click: 0, icon: "fa-vr-cardboard" },
    { name: "Onipotência", cost: 100000000000, cps: 50000000, click: 0, icon: "fa-hand-sparkles" }
];

const COLORS = [
    {n:"Padrão",h:"#00d4ff"}, {n:"Verde",h:"#00ff00"}, {n:"Rosa",h:"#ff00ff"}, {n:"Ouro",h:"#ffd700"}, {n:"Laranja",h:"#ff8800"},
    {n:"Vermelho",h:"#ff0000"}, {n:"Roxo",h:"#aa00ff"}, {n:"Branco",h:"#ffffff"}, {n:"Ciano",h:"#00ffff"}, {n:"Cinza",h:"#aaaaaa"},
    {n:"Chocolate",h:"#d2691e"}, {n:"Menta",h:"#98fb98"}, {n:"Azul Royal",h:"#4169e1"}, {n:"Rubi",h:"#e0115f"}, {n:"Lima",h:"#bfff00"},
    {n:"Céu",h:"#87ceeb"}, {n:"Fúcsia",h:"#ff00ff"}, {n:"Coral",h:"#ff7f50"}, {n:"Turquesa",h:"#40e0d0"}, {n:"Lavanda",h:"#e6e6fa"},
    {n:"Oliva",h:"#808000"}, {n:"Salmão",h:"#fa8072"}, {n:"Areia",h:"#f4a460"}, {n:"Orquídea",h:"#da70d6"}, {n:"Prata",h:"#c0c0c0"},
    {n:"Bronze",h:"#cd7f32"}, {n:"Preto",h:"#333333"}, {n:"Neon",h:"#ccff00"}, {n:"Infinito",h:"#ffffff"}, {n:"GOD",h:"#ff0000"}
];

const ACHIEVEMENTS = [
    { id: 'click1', title: "Primeiro Passo", desc: "Clique 1 vez", req: (s) => s.clicks >= 1 },
    { id: 'click100', title: "Dedo Rápido", desc: "100 Cliques manuais", req: (s) => s.clicks >= 100 },
    { id: 'diam1k', title: "Rico", desc: "Tenha 1.000 Diamantes", req: (s) => s.diamonds >= 1000 },
    { id: 'diam1m', title: "Milionário", desc: "Tenha 1 Milhão de Diamantes", req: (s) => s.diamonds >= 1000000 },
    { id: 'upg1', title: "Evolução", desc: "Compre o primeiro upgrade", req: (s) => s.inventory[0] >= 1 },
    { id: 'upg5', title: "Automatizado", desc: "Compre um Auto-Clicker", req: (s) => s.inventory[1] >= 1 },
    { id: 'cps100', title: "Fábrica", desc: "Chegue a 100 CPS", req: (s) => getTotalCPS() >= 100 },
    { id: 'color10', title: "Estiloso", desc: "Desbloqueie a 10ª Cor", req: (s) => s.inventory[0] >= 50 }
];

let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    clicks: 0,
    achievements: [], // IDs das conquistas desbloqueadas
    soundOn: true
};

// --- CORE ---
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');
};

window.toggleSound = () => {
    SoundSys.enabled = !SoundSys.enabled;
    state.soundOn = SoundSys.enabled;
    document.getElementById('btn-sound').innerHTML = `<i class="fas fa-volume-${state.soundOn ? 'up' : 'mute'}"></i> Som: ${state.soundOn ? 'ON' : 'OFF'}`;
};

window.hardReset = () => {
    if(confirm("Tem certeza? Isso apaga TUDO.")) {
        localStorage.removeItem('cursor_save');
        location.reload();
    }
};

window.saveGame = () => {
    saveGameData(state);
    showToast('<i class="fas fa-save"></i> Jogo Salvo!');
};

// Inicialização
async function init() {
    const saved = await loadGameData();
    if (saved) {
        state = { ...state, ...saved };
        SoundSys.enabled = state.soundOn ?? true;
    }
    window.toggleSound(); // Atualiza texto do botão
    window.toggleSound(); // Reverte para estado correto
    
    renderShop();
    renderAchievements();
    updateUI();
    
    // Loop Principal
    setInterval(() => {
        const cps = getTotalCPS();
        if(cps > 0) {
            state.diamonds += cps / 10;
            checkAchievements();
            updateUI();
        }
    }, 100);
    
    // Auto-Save 30s
    setInterval(() => saveGameData(state), 30000);
}

// Lógica de Clique
document.getElementById('big-cookie').addEventListener('mousedown', (e) => {
    // Resume audio context se o navegador tiver bloqueado
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const power = 1 + (state.inventory[0] * UPGRADES[0].click);
    state.diamonds += power;
    state.clicks++;
    
    SoundSys.playClick();
    createParticles(e.clientX, e.clientY, `+${format(power)}`);
    checkAchievements();
    updateUI();
});

// Comprar Upgrade
window.buy = (idx) => {
    const u = UPGRADES[idx];
    const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[idx]));
    
    if(state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[idx]++;
        SoundSys.playBuy();
        renderShop();
        updateUI();
    }
};

// Renderizadores
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = UPGRADES.map((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        const locked = state.diamonds < cost ? 'locked' : '';
        return `
            <div class="shop-item ${locked}" onclick="window.buy(${i})">
                <div class="item-icon"><i class="fas ${u.icon}"></i></div>
                <div class="item-data">
                    <span class="item-name">${u.name}</span>
                    <span class="item-cost">💎 ${format(cost)}</span>
                </div>
                <div class="item-qty">${state.inventory[i]}</div>
            </div>
        `;
    }).join('');
}

function renderAchievements() {
    const list = document.getElementById('achieve-list');
    let unlockedCount = 0;
    
    list.innerHTML = ACHIEVEMENTS.map(ach => {
        const unlocked = state.achievements.includes(ach.id);
        if(unlocked) unlockedCount++;
        return `
            <div class="achieve-item ${unlocked ? 'unlocked' : ''}">
                <div class="achieve-title"><i class="fas fa-${unlocked ? 'check-circle' : 'lock'}"></i> ${ach.title}</div>
                <div class="achieve-desc">${ach.desc}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('achieve-count').innerText = unlockedCount;
    document.getElementById('achieve-total').innerText = ACHIEVEMENTS.length;
}

function checkAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(ach => {
        if(!state.achievements.includes(ach.id) && ach.req(state)) {
            state.achievements.push(ach.id);
            showToast(`🏆 Conquista: ${ach.title}`);
            SoundSys.playAchievement();
            changed = true;
        }
    });
    if(changed) renderAchievements();
}

function updateUI() {
    document.getElementById('score').innerText = format(Math.floor(state.diamonds));
    document.getElementById('cps').innerText = format(getTotalCPS());
    
    // Cor Chroma
    const lvl = state.inventory[0];
    const colorIdx = Math.min(Math.floor(lvl / 5), COLORS.length - 1);
    const color = COLORS[colorIdx];
    
    document.documentElement.style.setProperty('--primary', color.h);
    document.getElementById('chroma-name').innerText = color.n;
    document.getElementById('cursor-lvl').innerText = lvl + 1;
    
    // Atualiza status de bloqueio da loja em tempo real
    const items = document.querySelectorAll('.shop-item');
    UPGRADES.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        if(state.diamonds >= cost) items[i].classList.remove('locked');
        else items[i].classList.add('locked');
    });
}

// Helpers
function getTotalCPS() {
    return UPGRADES.reduce((acc, u, i) => acc + (u.cps * state.inventory[i]), 0);
}

function format(num) {
    if(num >= 1e6) return (num/1e6).toFixed(2) + "M";
    if(num >= 1e3) return (num/1e3).toFixed(1) + "k";
    return num.toLocaleString();
}

function createParticles(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showToast(html) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

init();
