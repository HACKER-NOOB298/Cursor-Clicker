# 🎮 Cursor Clicker v2.0 - Jogo Online Completo

Um jogo clicker estilo Cookie Clicker, mas com cliques! Totalmente online com autenticação, save na nuvem e leaderboard global. Compatível com PC, Tablet e Mobile.

![Cursor Clicker](https://img.shields.io/badge/version-2.0-brightgreen) ![Firebase](https://img.shields.io/badge/Firebase-Ready-orange) ![Status](https://img.shields.io/badge/status-Production%20Ready-success)

---

## 🚀 NOVO AQUI? COMECE POR AQUI.
# SITE: https://hacker-noob298.github.io/Cursor-Clicker/
## ✨ Funcionalidades

### 🎯 Gameplay Completo
- ✅ Sistema de cliques manual com feedback visual
- ✅ Cliques por segundo (CPS) automáticos
- ✅ 9 tipos de upgrades (Cursor, Vovó Dev, Server Rack, Bot Farm, etc.)
- ✅ Preços escaláveis exponencialmente (estilo Cookie Clicker)
- ✅ Sistema de evolução do cursor (muda de cor a cada 10 níveis)
- ✅ Poder do clique aumenta com nível do cursor
- ✅ Animações e efeitos visuais

### 💾 Sistema de Save
- ✅ AutoSave local (localStorage)
- ✅ Export/Import de save (JSON)
- ✅ Save na nuvem (Firebase Firestore)
- ✅ Sincronização automática quando logado
- ✅ Fallback offline inteligente

### 🔐 Autenticação Completa
- ✅ Cadastro/Login com e-mail e senha
- ✅ OAuth com Google
- ✅ OAuth com GitHub
- ✅ Recuperação de senha por e-mail
- ✅ Trocar senha
- ✅ Gerenciamento de sessão

### 🏆 Leaderboard Global
- ✅ Ranking por total de cliques
- ✅ Ranking por CPS
- ✅ Top 5 em tempo real
- ✅ Ranking completo (Top 100)
- ✅ Destaque para jogador atual
- ✅ Atualização automática

### 📱 Design Responsivo
- ✅ Layout adaptável para PC (1400px+)
- ✅ Layout para Tablet (768px - 1024px)
- ✅ Layout para Mobile (< 768px)
- ✅ Otimizações para touch
- ✅ Feedback háptico (vibração) no mobile

### ⌨️ Atalhos de Teclado
- `Espaço` - Clicar
- `Ctrl+S` - Salvar
- `Ctrl+L` - Carregar da nuvem
- `ESC` - Fechar modal

---

## 🚀 Como Configurar e Deploy

### Passo 1: Criar Projeto Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Dê um nome ao projeto (ex: `cursor-clicker`)
4. Desative o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### Passo 2: Configurar Authentication

1. No menu lateral, vá em **"Authentication"**
2. Clique em **"Começar"**
3. Ative os seguintes provedores:
   - **E-mail/senha** - Clique em "Ativar" e salve
   - **Google** - Clique em "Ativar", configure e salve
   - **GitHub** - Siga as instruções:
     - Acesse [GitHub Developer Settings](https://github.com/settings/developers)
     - Clique em "New OAuth App"
     - Preencha:
       - Application name: `Cursor Clicker`
       - Homepage URL: `https://seu-projeto.web.app`
       - Authorization callback URL: (copie do Firebase)
     - Copie o Client ID e Client Secret para o Firebase
     - Salve

### Passo 3: Configurar Firestore Database

1. No menu lateral, vá em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de produção"**
4. Selecione a localização (ex: `southamerica-east1`)
5. Clique em **"Ativar"**

6. Configure as **Regras de Segurança**:
   - Vá na aba "Regras"
   - Cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard collection - anyone logged in can read, but only write their own entry
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

7. Clique em **"Publicar"**

### Passo 4: Obter Credenciais do Firebase

1. No menu lateral, clique no ícone de **engrenagem** ⚙️ > **"Configurações do projeto"**
2. Role até **"Seus apps"**
3. Clique no ícone **Web** `</>`
4. Dê um nome ao app (ex: `Cursor Clicker Web`)
5. **NÃO** marque Firebase Hosting ainda
6. Clique em **"Registrar app"**
7. Copie as credenciais do `firebaseConfig`

### Passo 5: Configurar o Código

1. Abra o arquivo `js/firebase-config.js`
2. Substitua os valores das credenciais:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};
```

### Passo 6: Testar Localmente

1. Instale um servidor HTTP local (escolha um):

**Opção A - Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Opção B - Node.js:**
```bash
npx http-server -p 8000
```

**Opção C - VS Code:**
- Instale a extensão "Live Server"
- Clique com botão direito no `index.html` > "Open with Live Server"

2. Acesse `http://localhost:8000` no navegador
3. Teste todas as funcionalidades:
   - Criar conta
   - Fazer login
   - Clicar no cursor
   - Comprar upgrades
   - Salvar na nuvem
   - Ver leaderboard
   - OAuth (Google/GitHub)

### Passo 7: Deploy no Firebase Hosting

1. **Instalar Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login no Firebase:**
```bash
firebase login
```

3. **Inicializar projeto:**
```bash
firebase init hosting
```
   - Selecione o projeto criado
   - Public directory: **`.`** (ponto = pasta atual)
   - Configure as single-page app: **No**
   - Overwrite index.html: **No**

4. **Deploy:**
```bash
firebase deploy --only hosting
```

5. **Pronto!** Seu jogo estará online em:
```
https://seu-projeto.web.app
ou
https://seu-projeto.firebaseapp.com
```

### Passo 8: Configurar Domínio OAuth (Importante!)

Após o deploy, você precisa adicionar o domínio do Firebase aos provedores OAuth:

1. Copie a URL do seu projeto (ex: `cursor-clicker.web.app`)
2. Volte ao Firebase Console > Authentication > Settings > Authorized domains
3. Adicione o domínio (se não estiver lá)
4. **Para GitHub OAuth:**
   - Volte ao GitHub > Settings > Developer Settings > OAuth Apps
   - Edite seu app
   - Atualize a Homepage URL e Callback URL com o domínio real

---

## 📂 Estrutura do Projeto

```
cursor-clicker/
├── index.html              # Página principal
│   style.css          # Estilos responsivos
│   cnd.js e cnd.module # Configuração Firebase (EDITAR AQUI)
│   script.js             # Coordenador geral
│  
└── README.md             # Este arquivo
```

---

## 🎮 Como Jogar

1. **Clique no cursor gigante** para ganhar cliques
2. **Compre upgrades** na loja (lateral direita)
3. **Evolua seu cursor** comprando "Cursor Extra"
   - A cada 10 níveis, o cursor muda de cor
   - Cada nível aumenta o poder do clique
4. **Construa sua rede neural** com upgrades automáticos
5. **Faça login** para salvar na nuvem
6. **Compita no ranking global** com outros jogadores

---

## 🔧 Resolução de Problemas

### OAuth não funciona localmente
**Problema:** Google/GitHub OAuth só funciona em produção ou `localhost`

**Solução:** 
- Use `127.0.0.1:8000` ou `localhost:8000`
- Ou faça deploy e teste no domínio real

### "Missing or insufficient permissions" no Firestore
**Problema:** Regras de segurança muito restritas

**Solução:**
- Verifique as regras no Firestore
- Certifique-se de que o usuário está autenticado
- Confira se o UID do documento corresponde ao usuário

### Leaderboard não carrega
**Problema:** Collection "leaderboard" não existe ou está vazia

**Solução:**
- Faça login e salve seu jogo
- O sistema criará automaticamente sua entrada no leaderboard
- Peça para outros jogadores fazerem o mesmo

### Deploy falha
**Problema:** Erro ao fazer `firebase deploy`

**Solução:**
```bash
# Reinstalar Firebase CLI
npm uninstall -g firebase-tools
npm install -g firebase-tools

# Fazer login novamente
firebase login --reauth

# Tentar novamente
firebase deploy --only hosting
```

---

## 🎨 Customização

### Alterar Cores do Jogo
Edite `css/style.css`, seção `:root`:
```css
:root {
    --primary-bg: #1a1a2e;      /* Fundo principal */
    --secondary-bg: #16213e;    /* Fundo secundário */
    --accent: #0f3460;          /* Destaque */
    --highlight: #e94560;       /* Cor principal */
    /* ... */
}
```

### Adicionar Mais Upgrades
Edite `js/game.js`, array `shopItems`:
```javascript
{
    id: 'novo-upgrade',
    name: 'Nome do Upgrade',
    icon: '🎯',
    baseCost: 1000,
    baseProduction: 10,
    costMultiplier: 1.15,
    description: 'Descrição aqui',
    type: 'building'
}
```

### Alterar Evolução do Cursor
Edite `js/game.js`, função `updateCursorLevel()`:
```javascript
// Mudar níveis por evolução (padrão: 10)
gameState.cursorLevel = Math.floor(cursorCount / 20) + 1; // agora é 20

// Mudar rotação de cor (padrão: 30 graus)
const hue = (gameState.cursorLevel - 1) * 45; // agora é 45 graus
```

---

## 📊 Banco de Dados (Firestore)

### Collection: `users`
```javascript
{
  uid: string,
  createdAt: timestamp,
  gameState: {
    clicks: number,
    totalClicks: number,
    buildings: {},
    upgrades: {},
    achievements: [],
    cursorLevel: number,
    showNumbers: boolean
  },
  stats: {
    totalClicks: number,
    cps: number,
    cursorLevel: number
  },
  lastSave: timestamp,
  updatedAt: timestamp
}
```

### Collection: `leaderboard`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  totalClicks: number,
  cps: number,
  cursorLevel: number,
  updatedAt: timestamp
}
```

---

## 🚀 Features Implementadas

- [x] Sistema de cliques com power-up
- [x] 18 tipos de upgrades
- [x] Preço escalável exponencial
- [x] Evolução do cursor (cor + força)
- [x] CPS automático
- [x] Save local (localStorage)
- [x] Export/Import save
- [x] Autenticação email/senha
- [x] OAuth Google
- [x] OAuth GitHub
- [x] Recuperação de senha
- [x] Trocar senha
- [x] Save na nuvem (Firestore)
- [x] Leaderboard global
- [x] Ranking por cliques
- [x] Ranking por CPS
- [x] Design responsivo (PC/Tablet/Mobile)
- [x] Animações e feedback visual
- [x] Atalhos de teclado
- [x] Auto-save
- [x] Sistema de mensagens dinâmicas
- [x] Modal system
- [x] Loading states
- [x] Error handling
- [x] Performance monitoring

---

## 📝 Próximas Melhorias (Opcional) (EM BREVE)

- [ ] Achievements/Conquistas
- [ ] Sistema de prestige
- [ ] Power-ups temporários
- [ ] Mini-games
- [ ] Temas customizáveis
- [ ] Modo offline completo
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Chat entre jogadores
- [ ] Sistema de clãs/guilds

---

## 🐛 Reportar Bugs

Se encontrar algum problema:
1. Abra o Console do navegador (F12)
2. Vá na aba "Console"
3. Copie os erros
4. Envie para o desenvolvedor com:
   - Navegador e versão
   - Sistema operacional
   - Passos para reproduzir

---

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para modificar e distribuir.

---

## 🎉 Créditos

**Desenvolvido por:** [Gabriel Amaral Azevedo]  
**Tecnologias:** HTML5, CSS3, JavaScript (ES6+), Firebase  
**Inspirado em:** Cookie Clicker  
**Versão:** 1.2  
**Data:** 2026  

---

## 🌟 Divirta-se jogando!

Se gostou do jogo, compartilhe com seus amigos e vejam quem consegue mais cliques! 🚀


## 📞 Suporte

Para dúvidas ou suporte:
- 📧 E-mail: [deaconhecido.al@gmail.com]
