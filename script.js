import { 
    loginUser, registerUser, loginAnon, resetPass, logout, 
    saveGameCloud, loadGameCloud, getLeaderboardData, auth 
} from './cdn.js';

// --- DADOS DO JOGO ---
// 15 Evoluções
const UPGRADES = [
    { id: 0, nome: "Cursor de Plástico", base: 15, cps: 0, click: 1, icon: "fa-mouse" },
    { id: 1, nome: "Auto-Clicker v1", base: 100, cps: 1, click: 0, icon: "fa-robot" },
    { id: 2, nome: "Estagiário de TI", base: 500, cps: 5, click: 0, icon: "fa-user-graduate" },
    { id: 3, nome: "Script Python", base: 2000, cps: 15, click: 0, icon: "fa-code" },
    { id: 4, nome: "PC Gamer RGB", base: 8000, cps: 50, click: 0, icon: "fa-desktop" },
    { id: 5, nome: "Servidor Nuvem", base: 30000, cps: 150, click: 0, icon: "fa-cloud" },
    { id: 6, nome: "Fazenda de Bots", base: 100000, cps: 400, click: 0, icon: "fa-network-wired" },
    { id: 7, nome: "Inteligência Artificial", base: 500000, cps: 1200, click: 0, icon: "fa-brain" },
    { id: 8, nome: "Hacker de Elite", base: 2000000, cps: 5000, click: 0, icon: "fa-user-secret" },
    { id: 9, nome: "Computador Quântico", base: 10000000, cps: 15000, click: 0, icon: "fa-atom" },
    { id: 10, nome: "Nanobots", base: 50000000, cps: 50000, click: 0, icon: "fa-bacterium" },
    { id: 11, nome: "Satélite Orbital", base: 250000000, cps: 150000, click: 0, icon: "fa-satellite" },
    { id: 12, nome: "Manipulador do Tempo", base: 1000000000, cps: 500000, click: 0, icon: "fa-clock" },
    { id: 13, nome: "Matrix Pessoal", base: 5000000000, cps: 2000000, click: 0, icon: "fa-vr-cardboard" },
    { id: 14, nome: "Dedo de Deus", base: 99999999999, cps: 10000000, click: 0, icon: "fa-hand-sparkles" }
];

// 30 Cores que mudam conforme o nível do cursor (Upgrade ID 0)
const COLORS = [
    "#00d4ff", "#00ff9d", "#eaff00", "#ffaa00", "#ff0055", // Nv 0-4
    "#d600ff", "#7300ff", "#002aff", "#00f7ff", "#ffffff", // Nv 5-9
    "#ff4d4d", "#4dff88", "#4d88ff", "#ffff4d", "#ff4dff", // Nv 10-14
    "#ffa64d", "#4dffa6", "#a64dff", "#ff80bf", "#80ffbf", // Nv 15-19
    "#bf80ff", "#ffbf80", "#bfbfbf", "#ff0000", "#00ff00", // Nv 20-24
    "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#gold"    // Nv 25-29
];

// Conquistas
const ACHIEVEMENTS = [
    { id: "c1", nome: "Iniciante", req: 100, desc: "Clique 100 vezes" },
    { id: "c2", nome: "Milionário", req: 1000000, desc: "Tenha 1 Milhão de Diamantes" },
    { id: "c3", nome: "Viciado", req: 10000, desc: "Tenha 10k cliques totais" }
];

// ESTADO DO JOGO
let state = {
    diamonds: 0,
    inventory: Array(15).fill(0),
    totalClicks: 0,
    startTime: Date.now(),
    achievements: [],
    settings: { sound: true, size: 120 }
};

// --- ÁUDIO (SINTETIZADOR) ---
const playSound = (type) => {
    if (!state.settings.sound) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
            osc.type = 'sine';
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'buy') {
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
            osc.type = 'square';
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    } catch(e) {}
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    detectDevice();
    setupAuthButtons();
    setupGameButtons();
    setupHotkeys();
    
    // Auto-Save Loop (a cada 30s)
    setInterval(() => {
        if(auth.currentUser) saveGame();
    }, 30000);

    // Game Loop (CPS)
    setInterval(gameLoop, 100);
});

// --- LÓGICA DE JOGO ---
function gameLoop() {
    let cps = calculateCPS();
    if (cps > 0) {
        state.diamonds += cps / 10;
        updateUI();
    }
    checkAchievements();
}

function calculateCPS() {
    return UPGRADES.reduce((total, item, index) => {
        return total + (item.cps * state.inventory[index]);
    }, 0);
}

function clickAction() {
    // Força do clique: 1 + (Nível do Mouse * Poder do Mouse)
    const power = 1 + (state.inventory[0] * UPGRADES[0].click);
    state.diamonds += power;
    state.totalClicks++;
    
    playSound('click');
    createParticle();
    updateUI();
}

function buyItem(index) {
    const item = UPGRADES[index];
    const cost = Math.floor(item.base * Math.pow(1.15, state.inventory[index]));

    if (state.diamonds >= cost) {
        state.diamonds -= cost;
        state.inventory[index]++;
        playSound('buy');
        renderShop(); // Atualiza preços
        updateUI();
        updateColor(); // Checa se muda a cor
    }
}

// --- VISUAL E UI ---
function updateUI() {
    document.getElementById('score-val').innerText = formatNum(Math.floor(state.diamonds));
    document.getElementById('cps-val').innerText = formatNum(calculateCPS().toFixed(1));
    
    // Atualiza estado dos botões da loja (cinza se não puder comprar)
    UPGRADES.forEach((item, index) => {
        const cost = Math.floor(item.base * Math.pow(1.15, state.inventory[index]));
        const btn = document.getElementById(`shop-btn-${index}`);
        if (btn) {
            if (state.diamonds >= cost) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        }
    });
}

function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    
    UPGRADES.forEach((item, index) => {
        const cost = Math.floor(item.base * Math.pow(1.15, state.inventory[index]));
        
        const div = document.createElement('div');
        div.className = `shop-item ${state.diamonds < cost ? 'disabled' : ''}`;
        div.id = `shop-btn-${index}`;
        div.innerHTML = `
            <i class="fas ${item.icon}"></i>
            <div class="item-info">
                <b>${item.nome}</b>
                <span>💎 ${formatNum(cost)}</span>
            </div>
            <div class="item-qty">${state.inventory[index]}</div>
        `;
        div.onclick = () => buyItem(index);
        list.appendChild(div);
    });
}

function updateColor() {
    // A cada nível do item 0 (Mouse), muda a cor.
    // Usamos modulo % 30 para ciclar as cores se passar de 30.
    const colorIndex = state.inventory[0] % COLORS.length;
    const newColor = COLORS[colorIndex];
    document.documentElement.style.setProperty('--primary', newColor);
}

function createParticle() {
    const zone = document.getElementById('click-zone');
    const p = document.createElement('span');
    p.innerText = "+" + (1 + (state.inventory[0] * UPGRADES[0].click));
    p.style.position = 'absolute';
    p.style.color = 'var(--primary)';
    p.style.fontWeight = 'bold';
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.pointerEvents = 'none';
    p.style.animation = 'floatUp 0.8s ease-out forwards'; // Definir keyframes no CSS se quiser, ou transição simples
    // Simplificado para JS:
    p.style.transition = 'all 0.5s';
    p.style.transform = `translate(-50%, -50%) translate(${Math.random()*40-20}px, -50px)`;
    p.style.opacity = '0';
    
    zone.appendChild(p);
    setTimeout(() => p.remove(), 500);
}

// --- SISTEMA E UTILITÁRIOS ---
function formatNum(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
}

function detectDevice() {
    const isMobile = window.innerWidth < 900;
    document.getElementById('device-type').innerText = isMobile ? "Mobile" : "PC / Desktop";
    if (isMobile) {
        document.body.classList.add('mobile-mode');
    }
}

function checkAchievements() {
    if (state.totalClicks >= 100 && !state.achievements.includes('c1')) unlockAchieve('c1');
    if (state.diamonds >= 1000000 && !state.achievements.includes('c2')) unlockAchieve('c2');
}

function unlockAchieve(id) {
    state.achievements.push(id);
    const data = ACHIEVEMENTS.find(a => a.id === id);
    alert(`CONQUISTA DESBLOQUEADA: ${data.nome}`);
    // Poderia ser um Toast mais bonito
}

// --- EVENTOS (BUTTONS E INPUTS) ---
function setupGameButtons() {
    // Botão de clique
    const clickZone = document.getElementById('click-zone');
    clickZone.addEventListener('pointerdown', clickAction); // pointerdown é melhor que click pra mobile

    // Menus Mobile
    document.getElementById('mob-menu-btn').onclick = () => document.querySelector('.left-panel').classList.toggle('active');
    document.getElementById('mob-shop-btn').onclick = () => document.querySelector('.right-panel').classList.add('active');
    document.getElementById('close-shop-mob').onclick = () => document.querySelector('.right-panel').classList.remove('active');

    // Modais
    document.getElementById('nav-settings').onclick = () => openModal('modal-settings');
    document.getElementById('nav-rank').onclick = loadLeaderboard;
    document.getElementById('nav-achieve').onclick = loadAchievements;
    
    document.querySelectorAll('.close-modal').forEach(b => {
        b.onclick = () => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });

    // Configurações
    const range = document.getElementById('range-size');
    range.oninput = (e) => {
        state.settings.size = e.target.value;
        document.documentElement.style.setProperty('--cursor-size', e.target.value + 'px');
    };
    
    const soundBtn = document.getElementById('toggle-sound');
    soundBtn.onclick = () => {
        state.settings.sound = !state.settings.sound;
        soundBtn.innerText = state.settings.sound ? "ON" : "OFF";
        soundBtn.className = `toggle-btn ${state.settings.sound ? 'on' : 'off'}`;
    };

    // Save
    document.getElementById('btn-cloud-save').onclick = async () => {
        await saveGame();
        alert("Jogo salvo!");
    };
    document.getElementById('btn-logout').onclick = logout;
}

function setupAuthButtons() {
    const err = (msg) => { 
        const el = document.getElementById('auth-error');
        el.innerText = msg; el.style.display = 'block'; 
    };

    document.getElementById('btn-login').onclick = async () => {
        const e = document.getElementById('inp-email').value;
        const p = document.getElementById('inp-pass').value;
        if(!e || !p) return err("Preencha tudo.");
        const res = await loginUser(e, p);
        if(res.success) startGame(res.user); else err(res.error);
    };

    document.getElementById('btn-register').onclick = async () => {
        const e = document.getElementById('inp-email').value;
        const p = document.getElementById('inp-pass').value;
        if(!e || !p) return err("Preencha tudo.");
        const res = await registerUser(e, p);
        if(res.success) startGame(res.user); else err(res.error);
    };

    document.getElementById('btn-anon').onclick = async () => {
        const res = await loginAnon();
        if(res.success) startGame(res.user); else err(res.error);
    };
    
    document.getElementById('btn-forgot').onclick = () => openModal('modal-reset');
    document.getElementById('btn-confirm-reset').onclick = async () => {
        const email = document.getElementById('reset-email-input').value;
        await resetPass(email);
        alert("Verifique seu e-mail.");
    };
}

function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && document.getElementById('auth-screen').style.display === 'none') {
            clickAction();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveGame();
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        }
    });
}

// --- DATA HANDLING ---
async function startGame(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('display-name').innerText = user.email ? user.email.split('@')[0] : "Visitante";

    // Carregar Save
    const saved = await loadGameCloud();
    if (saved) {
        // Mescla o save com o estado padrão (pra evitar erros se adicionar coisas novas depois)
        state = { ...state, ...saved };
        // Aplica configs visuais
        document.documentElement.style.setProperty('--cursor-size', state.settings.size + 'px');
        document.getElementById('range-size').value = state.settings.size;
        updateColor();
    }
    
    renderShop();
    updateUI();
}

async function saveGame() {
    const btn = document.getElementById('last-save-msg');
    btn.innerText = "Salvando...";
    await saveGameCloud(state);
    const now = new Date();
    btn.innerText = `Salvo às ${now.getHours()}:${now.getMinutes()}`;
}

async function loadLeaderboard() {
    openModal('modal-rank');
    const div = document.getElementById('leaderboard-list');
    div.innerHTML = "Carregando...";
    const data = await getLeaderboardData();
    
    div.innerHTML = data.map((p, i) => `
        <div class="leader-row">
            <span>#${i+1} ${p.name}</span>
            <span style="color:var(--primary)">${formatNum(p.score)} 💎</span>
        </div>
    `).join('');
}

function loadAchievements() {
    openModal('modal-achieve');
    const div = document.getElementById('achieve-list');
    div.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = state.achievements.includes(a.id);
        return `
            <div class="achieve-item ${unlocked ? 'unlocked' : ''}">
                <i class="fas fa-trophy"></i>
                <small>${a.nome}</small>
            </div>
        `;
    }).join('');
}

function openModal(id) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}
function setupGameButtons() {
    // ... seus códigos anteriores ...

    // --- CÓDIGO NOVO PARA ADICIONAR ---
    
    // 1. Botão de Fechar Menu (Esquerdo)
    const closeMenuBtn = document.getElementById('close-menu-mob');
    if (closeMenuBtn) {
        closeMenuBtn.onclick = () => {
            document.querySelector('.left-panel').classList.remove('active');
        };
    }

    // 2. Botão de Sair (Lateral)
    const logoutBtnSide = document.getElementById('btn-logout-sidebar');
    if (logoutBtnSide) {
        logoutBtnSide.onclick = logout; // Usa a função logout importada do cdn.js
    }

    // ... resto dos códigos ...
}

