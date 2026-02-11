import { registerUser, loginUser, loginAnonymous, logoutUser, saveGameData, loadGameData, getLeaderboard, auth } from './cdn.js';

// --- DADOS DO JOGO (15 EVOLUÇÕES) ---
const UPGRADES = [
    { name: "Mouse Básico", cost: 15, cps: 0, click: 1, icon: "fa-mouse" },
    { name: "Script Auto", cost: 100, cps: 1, click: 0, icon: "fa-scroll" },
    { name: "Estagiário", cost: 500, cps: 5, click: 0, icon: "fa-user" },
    { name: "PC Gamer", cost: 2000, cps: 15, click: 0, icon: "fa-desktop" },
    { name: "Servidor", cost: 7500, cps: 45, click: 0, icon: "fa-server" },
    { name: "Bot Farm", cost: 30000, cps: 120, click: 0, icon: "fa-network-wired" },
    { name: "Hacker", cost: 100000, cps: 350, click: 0, icon: "fa-user-secret" },
    { name: "IA Básica", cost: 500000, cps: 1000, click: 0, icon: "fa-brain" },
    { name: "Mineração", cost: 2500000, cps: 4000, click: 0, icon: "fa-gem" },
    { name: "Rede Neural", cost: 15000000, cps: 15000, click: 0, icon: "fa-project-diagram" },
    { name: "Satélite", cost: 100000000, cps: 60000, click: 0, icon: "fa-satellite" },
    { name: "Time Warp", cost: 800000000, cps: 250000, click: 0, icon: "fa-clock" },
    { name: "Realidade VR", cost: 5000000000, cps: 1000000, click: 0, icon: "fa-vr-cardboard" },
    { name: "Mão Divina", cost: 40000000000, cps: 5000000, click: 0, icon: "fa-hand-sparkles" },
    { name: "Big Bang", cost: 999999999999, cps: 25000000, click: 0, icon: "fa-infinity" }
];

// --- 30 CORES DINÂMICAS ---
const COLORS = [
    {n:"Ciano", h:"#00d4ff"}, {n:"Verde", h:"#00ff00"}, {n:"Roxo", h:"#b026ff"}, {n:"Laranja", h:"#ff9300"},
    {n:"Rosa", h:"#ff007f"}, {n:"Ouro", h:"#ffd700"}, {n:"Branco", h:"#ffffff"}, {n:"Vermelho", h:"#ff0000"},
    {n:"Azul", h:"#0044ff"}, {n:"Turquesa", h:"#40e0d0"}, {n:"Lima", h:"#ccff00"}, {n:"Magenta", h:"#ff00ff"},
    {n:"Coral", h:"#ff7f50"}, {n:"Ametista", h:"#9966cc"}, {n:"Prata", h:"#c0c0c0"}, {n:"Bronze", h:"#cd7f32"},
    {n:"Menta", h:"#98fb98"}, {n:"Lava", h:"#cf1020"}, {n:"Céu", h:"#87ceeb"}, {n:"Pessegô", h:"#ffdab9"},
    {n:"Indigo", h:"#4b0082"}, {n:"Esmeralda", h:"#50c878"}, {n:"Rubi", h:"#e0115f"}, {n:"Safira", h:"#0f52ba"},
    {n:"Obsidiana", h:"#404040"}, {n:"Plasma", h:"#8a2be2"}, {n:"Radioativo", h:"#aaff00"}, {n:"Galáxia", h:"#191970"},
    {n:"Fóton", h:"#fafad2"}, {n:"DEUS", h:"#ffffff"}
];

// --- ESTADO ---
let state = {
    diamonds: 0,
    inventory: Array(UPGRADES.length).fill(0),
    settings: { sound: true, cursorSize: 140 },
    achievements: []
};

// --- ÁUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'sine') {
    if(!state.settings.sound) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
}

// --- INICIALIZAÇÃO SEGURA ---
async function startGame() {
    try {
        console.log("Iniciando jogo...");
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        if(auth.currentUser) {
            const saved = await loadGameData();
            if(saved) state = { ...state, ...saved };
            document.getElementById('player-email').innerText = auth.currentUser.isAnonymous ? "Visitante" : auth.currentUser.email.split('@')[0];
        }

        applySettings();
        updateUI();
        renderShop();
        
        // Loop CPS
        setInterval(() => {
            const cps = getCPS();
            if(cps > 0) {
                state.diamonds += cps/10;
                updateUI();
            }
        }, 100);

        // Auto Save
        setInterval(() => saveGameData(state), 30000);
        
    } catch(e) {
        alert("Erro ao iniciar jogo: " + e.message);
    }
}

// --- EVENTOS (BOTÕES QUE FUNCIONAM) ---
// Login
document.getElementById('btn-login').addEventListener('click', async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    const res = await loginUser(e, p);
    if(res.success) startGame(); else alert(res.error);
});
document.getElementById('btn-register').addEventListener('click', async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    const res = await registerUser(e, p);
    if(res.success) startGame(); else alert(res.error);
});
document.getElementById('btn-anon').addEventListener('click', async () => {
    await loginAnonymous();
    startGame();
});

// Ação Principal (Clique)
document.getElementById('click-trigger').addEventListener('pointerdown', (e) => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const power = 1 + (state.inventory[0] * UPGRADES[0].click);
    state.diamonds += power;
    playSound(400 + (Math.random()*200));
    
    // Efeito Visual
    const el = document.getElementById('visual-cursor');
    el.style.transform = "scale(0.9) rotate(-5deg)";
    setTimeout(() => el.style.transform = "scale(1) rotate(0deg)", 50);

    createFloatText(e.clientX, e.clientY, `+${format(power)}`);
    updateUI();
});

// Compra de Itens
function buyItem(idx) {
    const u = UPGRADES[idx];
    const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[idx]));
    
    if(state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[idx]++;
        playSound(800, 'square');
        updateUI();
        renderShop(); // Re-renderiza para atualizar preços
    }
}

// UI Updates
function updateUI() {
    document.getElementById('score-display').innerText = format(Math.floor(state.diamonds));
    document.getElementById('cps-display').innerText = format(getCPS());

    // Cor
    const idx = Math.min(Math.floor(state.inventory[0] / 5), COLORS.length-1);
    const color = COLORS[idx];
    document.documentElement.style.setProperty('--primary', color.h);
    document.getElementById('chroma-name').innerText = color.n;
    document.getElementById('chroma-preview').style.background = color.h;

    // Loja (Travar/Destravar visualmente)
    const items = document.querySelectorAll('.shop-item');
    UPGRADES.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        if(state.diamonds >= cost) items[i].classList.remove('locked');
        else items[i].classList.add('locked');
    });
}

function renderShop() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = ""; // Limpa
    UPGRADES.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, state.inventory[i]));
        const el = document.createElement('div');
        el.className = "shop-item"; // Classe base
        el.innerHTML = `
            <div class="icon"><i class="fas ${u.icon}"></i></div>
            <div class="info">
                <b>${u.name}</b>
                <small>💎 ${format(cost)}</small>
            </div>
            <div class="qty">${state.inventory[i]}</div>
        `;
        // ADICIONA O EVENTO DIRETO NO ELEMENTO
        el.addEventListener('click', () => buyItem(i));
        list.appendChild(el);
    });
}

// Helpers
function getCPS() { return UPGRADES.reduce((acc, u, i) => acc + (u.cps * state.inventory[i]), 0); }
function format(n) {
    if(n>=1e9) return (n/1e9).toFixed(2)+"B";
    if(n>=1e6) return (n/1e6).toFixed(2)+"M";
    if(n>=1e3) return (n/1e3).toFixed(1)+"K";
    return n.toLocaleString();
}
function createFloatText(x, y, txt) {
    const d = document.createElement('div');
    d.className = 'float-txt'; d.innerText = txt;
    d.style.left = x+'px'; d.style.top = y+'px';
    document.body.appendChild(d);
    setTimeout(()=>d.remove(), 800);
}

// Controles de Janelas
document.getElementById('btn-open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
document.getElementById('btn-close-settings').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
document.getElementById('btn-open-rank').onclick = async () => {
    document.getElementById('rank-modal').classList.remove('hidden');
    document.getElementById('rank-list').innerHTML = "Carregando...";
    const ranks = await getLeaderboard();
    document.getElementById('rank-list').innerHTML = ranks.map((r,i) => `
        <div class="rank-row"><span>#${i+1} ${r.email.split('@')[0]}</span> <span>💎 ${format(r.diamonds)}</span></div>
    `).join('');
};
document.getElementById('btn-close-rank').onclick = () => document.getElementById('rank-modal').classList.add('hidden');
document.getElementById('btn-save').onclick = () => { saveGameData(state); alert("Salvo!"); };

// Configs
document.getElementById('cursor-size-slider').oninput = (e) => {
    state.settings.cursorSize = e.target.value;
    applySettings();
};
document.getElementById('btn-toggle-sound').onclick = () => {
    state.settings.sound = !state.settings.sound;
    applySettings();
};
function applySettings() {
    document.documentElement.style.setProperty('--cursor-size', state.settings.cursorSize + "px");
    document.getElementById('btn-toggle-sound').innerText = state.settings.sound ? "SOM: ON" : "SOM: OFF";
}

// Tabs
document.getElementById('tab-shop-btn').onclick = () => switchTab('shop');
document.getElementById('tab-achieve-btn').onclick = () => switchTab('achievements');
function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(e => e.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    if(t === 'shop') document.getElementById('tab-shop-btn').classList.add('active');
    else document.getElementById('tab-achieve-btn').classList.add('active');
}
