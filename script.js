import { loginUser, registerUser, logoutUser, saveGameData, loadGameData, subscribeToRank } from './cdn.js';

// --- CONFIGURAÇÃO CHROMA (CORES POR NÍVEL) ---
const colors = [
    { hex: "#00d2ff", name: "Cyber Blue" },   // 0-9
    { hex: "#00ff88", name: "Matrix Green" }, // 10-19
    { hex: "#ffd700", name: "Midas Gold" },   // 20-29
    { hex: "#ff0055", name: "Crimson Red" },  // 30-39
    { hex: "#9d00ff", name: "Void Purple" },  // 40-49
    { hex: "#ffffff", name: "Pure Light" }    // 50+
];

// --- DADOS DO JOGO ---
const upgrades = [
    { id: 0, name: "Poder do Mouse", cost: 15, cps: 0, click: 0.5, icon: "fa-mouse-pointer" }, // Item especial
    { id: 1, name: "Auto-Clicker v1", cost: 100, cps: 1, click: 0, icon: "fa-robot" },
    { id: 2, name: "Script Kiddie", cost: 500, cps: 5, click: 0, icon: "fa-laptop-code" },
    { id: 3, name: "Servidor Dedicado", cost: 3000, cps: 20, click: 0, icon: "fa-server" },
    { id: 4, name: "Fazenda de GPU", cost: 10000, cps: 80, click: 0, icon: "fa-memory" },
    { id: 5, name: "IA Neural", cost: 50000, cps: 250, click: 0, icon: "fa-brain" },
    { id: 6, name: "Computação Quântica", cost: 200000, cps: 1000, click: 0, icon: "fa-atom" },
    { id: 7, name: "Manipulador do Tempo", cost: 1500000, cps: 5000, click: 0, icon: "fa-clock" },
    { id: 8, name: "Matriz Galáctica", cost: 50000000, cps: 20000, click: 0, icon: "fa-galaxy" }
];

let gameState = {
    diamonds: 0,
    inventory: Array(upgrades.length).fill(0)
};

// --- FUNÇÕES EXPOSTAS AO HTML (WINDOW) ---
window.tryLogin = async () => {
    try {
        await loginUser(document.getElementById('email').value, document.getElementById('password').value);
    } catch(e) { showToast(e.message, 'error'); }
};

window.tryRegister = async () => {
    try {
        await registerUser(document.getElementById('email').value, document.getElementById('password').value);
        startGame();
    } catch(e) { showToast(e.message, 'error'); }
};

window.startGuestMode = () => {
    document.getElementById('p-mode').innerText = "OFFLINE";
    startGame();
};

window.doLogout = logoutUser;

window.addEventListener('auth-success', () => {
    document.getElementById('p-mode').innerText = "ONLINE";
    document.getElementById('p-mode').style.color = "#00ff88";
    startGame();
});

// --- INICIALIZAÇÃO ---
async function startGame() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('game-app').classList.remove('hidden');

    const data = await loadGameData();
    if (data) {
        gameState.diamonds = data.diamonds || 0;
        gameState.inventory = data.inventory || Array(upgrades.length).fill(0);
    }
    
    // Inicia Loops
    renderStore();
    updateUI();
    updateCursorTheme(); // Aplica a cor correta ao carregar
    
    setInterval(gameLoop, 100); // Loop de Diamantes
    setInterval(() => saveGameData(gameState), 5000); // Auto-Save
    
    subscribeToRank(updateLeaderboard);
}

// --- LÓGICA DO JOGO ---
function gameLoop() {
    // Calcula CPS (Cliques Por Segundo automáticos)
    const cps = upgrades.reduce((acc, u, i) => acc + (gameState.inventory[i] * u.cps), 0);
    if(cps > 0) {
        gameState.diamonds += cps / 10;
        updateUI(cps);
    }
}

// CLIQUE MANUAL
document.getElementById('click-area').addEventListener('mousedown', (e) => {
    // Fórmula: 1 + (Nível do Mouse * 0.5)
    const power = 1 + (gameState.inventory[0] * 0.5); 
    gameState.diamonds += power;
    
    // Efeitos
    animateClick();
    showFloatingText(e.clientX, e.clientY, `+${formatNum(power)}`);
    updateUI();
});

// COMPRA
window.buyUpgrade = (id) => {
    const u = upgrades[id];
    // Preço aumenta 15% a cada compra
    const cost = Math.floor(u.cost * Math.pow(1.15, gameState.inventory[id]));
    
    if (gameState.diamonds >= cost) {
        gameState.diamonds -= cost;
        gameState.inventory[id]++;
        
        // Se comprou o Mouse (ID 0), checa se muda de cor
        if(id === 0) updateCursorTheme();
        
        renderStore();
        updateUI();
    } else {
        showToast("Diamantes Insuficientes!", "error");
    }
};

// --- LÓGICA DE CORES (A NOVIDADE) ---
function updateCursorTheme() {
    const mouseLvl = gameState.inventory[0];
    
    // Lógica: Divide nível por 10. (Ex: Nv 25 / 10 = 2.5 -> Índice 2 -> Ouro)
    let colorIndex = Math.floor(mouseLvl / 10);
    
    // Limita ao máximo do array
    if(colorIndex >= colors.length) colorIndex = colors.length - 1;
    
    const theme = colors[colorIndex];
    
    // INJETA A COR NO CSS (Isso muda tudo que usa var(--dynamic-color))
    document.documentElement.style.setProperty('--dynamic-color', theme.hex);
    document.documentElement.style.setProperty('--dynamic-glow', theme.hex + "66"); // Adiciona transparência
    
    // Atualiza textos
    document.getElementById('current-color-name').innerText = theme.name;
    document.getElementById('cursor-lvl').innerText = mouseLvl;
    
    // Feedback visual se mudou de tier (exato múltiplo de 10)
    if(mouseLvl > 0 && mouseLvl % 10 === 0) {
        showToast(`EVOLUÇÃO CROMÁTICA: ${theme.name}!`, "success");
    }
}

// --- UI & RENDERIZAÇÃO ---
function renderStore() {
    const list = document.getElementById('upgrades-list');
    list.innerHTML = "";
    
    upgrades.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, gameState.inventory[i]));
        const canBuy = gameState.diamonds >= cost;
        
        const div = document.createElement('div');
        div.className = `upgrade-card ${canBuy ? '' : 'locked'}`;
        div.onclick = () => window.buyUpgrade(i);
        div.innerHTML = `
            <div class="u-icon"><i class="fas ${u.icon}"></i></div>
            <div class="u-info">
                <b>${u.name}</b>
                <span class="cost">💎 ${formatNum(cost)}</span>
            </div>
            <div class="u-count">${gameState.inventory[i]}</div>
        `;
        list.appendChild(div);
    });
}

function updateUI(cps = 0) {
    document.getElementById('diamonds-val').innerText = formatNum(Math.floor(gameState.diamonds));
    if(cps > 0) document.getElementById('cps-val').innerText = `${formatNum(cps)} / seg`;
    
    // Atualiza estado visual (travado/destravado) da loja em tempo real
    const cards = document.getElementsByClassName('upgrade-card');
    if(cards.length === upgrades.length) {
        upgrades.forEach((u, i) => {
            const cost = Math.floor(u.cost * Math.pow(1.15, gameState.inventory[i]));
            if(gameState.diamonds >= cost) cards[i].classList.remove('locked');
            else cards[i].classList.add('locked');
        });
    }
}

function updateLeaderboard(data) {
    const list = document.getElementById('leaderboard');
    list.innerHTML = "";
    data.forEach(p => {
        const isMe = currentUser && p.id === currentUser.uid;
        list.innerHTML += `
            <li class="${isMe ? 'me' : ''}">
                <span>#${p.rank} ${p.name}</span>
                <span style="color:var(--gold)">💎 ${formatNum(Math.floor(p.diamonds))}</span>
            </li>
        `;
    });
}

// --- UTILITÁRIOS ---
function animateClick() {
    const c = document.getElementById('main-cursor');
    c.style.transform = "scale(0.8) rotate(-5deg)";
    setTimeout(() => c.style.transform = "scale(1) rotate(0)", 80);
}

function showFloatingText(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = txt;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showToast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    t.style.borderLeft = `5px solid ${type === 'error' ? '#ff0055' : '#00ff88'}`;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function formatNum(num) {
    if(num >= 1e9) return (num/1e9).toFixed(2) + "B";
    if(num >= 1e6) return (num/1e6).toFixed(2) + "M";
    if(num >= 1e3) return (num/1e3).toFixed(1) + "K";
    return num.toLocaleString();
}

// Abas
window.switchTab = (t) => {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
};

// Teclado (Atalhos PC)
document.addEventListener('keydown', (e) => {
    if(e.code === 'Space') {
        const clickArea = document.getElementById('click-area');
        // Pega coordenadas do centro do elemento para a animação
        const rect = clickArea.getBoundingClientRect();
        const evt = new MouseEvent('mousedown', {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        });
        clickArea.dispatchEvent(evt);
    }
    if(e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveGameData(gameState);
        showToast("Jogo Salvo (Ctrl+S)", "success");
    }
});
