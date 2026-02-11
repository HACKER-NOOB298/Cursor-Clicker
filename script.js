import { 
    registerUser, loginUser, loginAnonymous, logoutUser, 
    saveGameData, loadGameData, getLeaderboard, auth 
} from './cdn.js';

// --- CONFIGURAÇÃO: 15 EVOLUÇÕES ---
const UPGRADES = [
    { name: "Mouse de Plástico", baseCost: 15, cps: 0, click: 1, icon: "fa-mouse" },
    { name: "Script Básico", baseCost: 100, cps: 1, click: 0, icon: "fa-scroll" },
    { name: "Estagiário", baseCost: 550, cps: 5, click: 0, icon: "fa-user-graduate" },
    { name: "PC Gamer", baseCost: 2000, cps: 15, click: 0, icon: "fa-desktop" },
    { name: "Servidor Dedicado", baseCost: 7500, cps: 45, click: 0, icon: "fa-server" },
    { name: "Farm de Cliques", baseCost: 30000, cps: 120, click: 0, icon: "fa-network-wired" },
    { name: "Hacker Russo", baseCost: 100000, cps: 350, click: 0, icon: "fa-user-secret" },
    { name: "Inteligência Artificial", baseCost: 500000, cps: 1000, click: 0, icon: "fa-brain" },
    { name: "Mineração Quântica", baseCost: 2500000, cps: 4000, click: 0, icon: "fa-atom" },
    { name: "Rede Neural Global", baseCost: 15000000, cps: 15000, click: 0, icon: "fa-project-diagram" },
    { name: "Satélite Orbital", baseCost: 100000000, cps: 60000, click: 0, icon: "fa-satellite" },
    { name: "Manipulador Temporal", baseCost: 800000000, cps: 250000, click: 0, icon: "fa-clock" },
    { name: "Matriz de Realidade", baseCost: 5000000000, cps: 1000000, click: 0, icon: "fa-vr-cardboard" },
    { name: "Cursor Divino", baseCost: 40000000000, cps: 5000000, click: 0, icon: "fa-hand-sparkles" },
    { name: "Big Bang Digital", baseCost: 999999999999, cps: 25000000, click: 0, icon: "fa-infinity" }
];

// --- CONFIGURAÇÃO: 30 CORES DINÂMICAS ---
const COLORS = [
    {n:"Ciano Cyber", h:"#00d4ff"}, {n:"Verde Matrix", h:"#00ff00"}, {n:"Roxo Neon", h:"#b026ff"},
    {n:"Laranja Solar", h:"#ff9300"}, {n:"Rosa Choque", h:"#ff007f"}, {n:"Amarelo Ouro", h:"#ffd700"},
    {n:"Branco Puro", h:"#ffffff"}, {n:"Vermelho Sangue", h:"#ff0000"}, {n:"Azul Profundo", h:"#0044ff"},
    {n:"Turquesa", h:"#40e0d0"}, {n:"Lima", h:"#ccff00"}, {n:"Magenta", h:"#ff00ff"},
    {n:"Coral", h:"#ff7f50"}, {n:"Ametista", h:"#9966cc"}, {n:"Prata", h:"#c0c0c0"},
    {n:"Bronze", h:"#cd7f32"}, {n:"Menta", h:"#98fb98"}, {n:"Lava", h:"#cf1020"},
    {n:"Céu", h:"#87ceeb"}, {n:"Pessegô", h:"#ffdab9"}, {n:"Indigo", h:"#4b0082"},
    {n:"Esmeralda", h:"#50c878"}, {n:"Rubi", h:"#e0115f"}, {n:"Safira", h:"#0f52ba"},
    {n:"Obsidiana", h:"#404040"}, {n:"Plasma", h:"#8a2be2"}, {n:"Radioativo", h:"#aaff00"},
    {n:"Galáxia", h:"#191970"}, {n:"Fóton", h:"#fafad2"}, {n:"Supremo", h:"#ffffff"}
];

// --- CONQUISTAS ---
const ACHIEVEMENTS = [
    { id: 'c1', name: "Primeiros Passos", desc: "Clique 100 vezes", req: (s) => s.totalClicks >= 100 },
    { id: 'c2', name: "Rico", desc: "Tenha 10.000 Diamantes", req: (s) => s.diamonds >= 10000 },
    { id: 'c3', name: "Automatizado", desc: "Tenha 10 Scripts Básicos", req: (s) => s.inventory[1] >= 10 },
    { id: 'c4', name: "Estiloso", desc: "Desbloqueie a 10ª Cor", req: (s) => s.inventory[0] >= 50 },
    { id: 'c5', name: "Deus do Clique", desc: "1 Milhão de Diamantes", req: (s) => s.diamonds >= 1000000 }
];

// --- ESTADO DO JOGO ---
let gameState = {
    diamonds: 0,
    inventory: Array(UPGRADES.length).fill(0),
    achievements: [],
    totalClicks: 0,
    settings: {
        sound: true,
        cursorSize: 140,
        particles: true
    }
};

// --- SISTEMA DE ÁUDIO (Web Audio API - Sem downloads) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const SoundSys = {
    playTone: (freq, type, duration) => {
        if (!gameState.settings.sound) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    click: () => SoundSys.playTone(600 + Math.random()*200, 'sine', 0.1),
    buy: () => SoundSys.playTone(1200, 'square', 0.2),
    achieve: () => {
        SoundSys.playTone(400, 'triangle', 0.3);
        setTimeout(() => SoundSys.playTone(600, 'triangle', 0.4), 100);
    }
};

// --- FUNÇÕES DE AUTH (INTERFACE) ---
window.doLogin = async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    if (!e || !p) return alert("Preencha tudo.");
    const res = await loginUser(e, p);
    if (res.success) initGame();
    else alert("Erro: " + res.error);
};
window.doRegister = async () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-pass').value;
    const res = await registerUser(e, p);
    if (res.success) initGame();
    else alert("Erro: " + res.error);
};
window.doAnon = async () => {
    await loginAnonymous();
    initGame();
};
window.doLogout = logoutUser;

// --- CORE GAMEPLAY ---
async function initGame() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    if (auth.currentUser) {
        const saved = await loadGameData();
        if (saved) {
            // Merge cuidadoso para não quebrar save antigo com features novas
            gameState = { ...gameState, ...saved, settings: { ...gameState.settings, ...saved.settings } };
        }
        document.getElementById('player-email').innerText = auth.currentUser.isAnonymous ? "Convidado" : auth.currentUser.email.split('@')[0];
    }

    applySettings();
    renderShop();
    renderAchievements();
    updateUI();
    
    // Loop de CPS
    setInterval(() => {
        const cps = calculateCPS();
        if (cps > 0) {
            gameState.diamonds += cps / 10;
            checkAchievements();
            updateUI();
        }
    }, 100);

    // Auto-Save (60s)
    setInterval(() => saveGameData(gameState), 60000);
}

// Lógica de Clique Principal
document.getElementById('main-cursor-btn').addEventListener('mousedown', (e) => handleClick(e));
document.getElementById('main-cursor-btn').addEventListener('touchstart', (e) => {
    // Prevent default para não duplicar com mousedown em alguns dispositivos
    e.preventDefault(); 
    // Pega o primeiro toque
    const touch = e.touches[0];
    handleClick({ clientX: touch.clientX, clientY: touch.clientY });
}, {passive: false});

function handleClick(e) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const clickPower = 1 + (gameState.inventory[0] * UPGRADES[0].click);
    gameState.diamonds += clickPower;
    gameState.totalClicks++;
    
    SoundSys.click();
    if(gameState.settings.particles) createParticles(e.clientX, e.clientY, `+${format(clickPower)}`);
    
    checkAchievements();
    updateUI();
    
    // Animação CSS manual para garantir feedback
    const btn = document.getElementById('main-cursor-btn');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = 'scale(1)', 50);
}

// Sistema de Loja
window.buyUpgrade = (idx) => {
    const u = UPGRADES[idx];
    const cost = Math.floor(u.baseCost * Math.pow(1.15, gameState.inventory[idx]));
    
    if (gameState.diamonds >= cost) {
        gameState.diamonds -= cost;
        gameState.inventory[idx]++;
        SoundSys.buy();
        renderShop();
        updateUI();
    }
};

// Renderização
function renderShop() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = UPGRADES.map((u, i) => {
        const cost = Math.floor(u.baseCost * Math.pow(1.15, gameState.inventory[i]));
        const locked = gameState.diamonds < cost;
        return `
            <div class="upgrade-item ${locked ? 'locked' : ''}" onclick="window.buyUpgrade(${i})">
                <div class="up-icon"><i class="fas ${u.icon}"></i></div>
                <div class="up-info">
                    <span class="up-name">${u.name}</span>
                    <span class="up-cost">💎 ${format(cost)}</span>
                </div>
                <div class="up-qty">${gameState.inventory[i]}</div>
            </div>
        `;
    }).join('');
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    let unlockedCount = 0;
    
    list.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = gameState.achievements.includes(a.id);
        if (unlocked) unlockedCount++;
        return `
            <div class="achieve-card ${unlocked ? 'unlocked' : ''}">
                <div class="achieve-title"><i class="fas ${unlocked ? 'fa-check' : 'fa-lock'}"></i> ${a.name}</div>
                <div class="achieve-desc">${a.desc}</div>
            </div>
        `;
    }).join('');

    const pct = (unlockedCount / ACHIEVEMENTS.length) * 100;
    document.getElementById('achieve-progress').style.width = `${pct}%`;
}

// Atualização Visual (Gameloop Visual)
function updateUI() {
    document.getElementById('score-display').innerText = format(Math.floor(gameState.diamonds));
    document.getElementById('cps-display').innerText = format(calculateCPS());

    // Chroma System (Cor Dinâmica)
    // Muda a cor a cada 5 níveis do primeiro upgrade
    const colorIdx = Math.min(Math.floor(gameState.inventory[0] / 5), COLORS.length - 1);
    const theme = COLORS[colorIdx];
    
    document.documentElement.style.setProperty('--primary', theme.h);
    document.getElementById('chroma-name').innerText = theme.n;
    document.getElementById('chroma-preview').style.background = theme.h;
    
    // Atualiza classes 'locked' na loja em tempo real
    const items = document.querySelectorAll('.upgrade-item');
    items.forEach((item, i) => {
        const u = UPGRADES[i];
        const cost = Math.floor(u.baseCost * Math.pow(1.15, gameState.inventory[i]));
        if(gameState.diamonds >= cost) item.classList.remove('locked');
        else item.classList.add('locked');
    });
}

// --- UTILITÁRIOS ---
function calculateCPS() {
    return UPGRADES.reduce((total, u, i) => total + (gameState.inventory[i] * u.cps), 0);
}

function format(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
}

function checkAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(a => {
        if (!gameState.achievements.includes(a.id) && a.req(gameState)) {
            gameState.achievements.push(a.id);
            SoundSys.achieve();
            showToast(`🏆 Conquista: ${a.name}`);
            changed = true;
        }
    });
    if (changed) renderAchievements();
}

function createParticles(x, y, text) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = 'var(--primary)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerText = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// --- CONTROLES DE UI (MODAIS E ABAS) ---
window.toggleModal = (id) => {
    document.getElementById(id).classList.toggle('hidden');
    if (id === 'rank-modal') window.refreshRank();
};

window.openTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');
};

window.refreshRank = async () => {
    const list = document.getElementById('rank-list');
    list.innerHTML = '<p>Carregando...</p>';
    const ranks = await getLeaderboard();
    list.innerHTML = ranks.map((r, i) => `
        <div class="setting-row" style="border-bottom:1px solid #333; padding:5px;">
            <span>#${i+1} ${r.email.split('@')[0]}</span>
            <span style="color:var(--gold)">💎 ${format(r.diamonds)}</span>
        </div>
    `).join('') || '<p>Sem dados.</p>';
};

// --- CONFIGURAÇÕES ---
window.toggleSound = () => {
    gameState.settings.sound = !gameState.settings.sound;
    document.getElementById('btn-sound-toggle').innerText = gameState.settings.sound ? "ON" : "OFF";
};

window.updateCursorSize = (val) => {
    gameState.settings.cursorSize = val;
    applySettings();
};

function applySettings() {
    document.documentElement.style.setProperty('--cursor-size', `${gameState.settings.cursorSize}px`);
    document.getElementById('btn-sound-toggle').innerText = gameState.settings.sound ? "ON" : "OFF";
    document.getElementById('cursor-size-slider').value = gameState.settings.cursorSize;
    document.getElementById('check-particles').checked = gameState.settings.particles;
}

// Checkbox listener
document.getElementById('check-particles').addEventListener('change', (e) => {
    gameState.settings.particles = e.target.checked;
});

window.manualSave = () => {
    saveGameData(gameState);
    showToast("Salvo na nuvem!");
};
