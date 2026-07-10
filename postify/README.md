# PostHub — Plataforma de Postagens

PostHub é uma plataforma completa de postagens com painel administrativo, atualização em tempo real via Socket.IO, sistema de permissões em 4 níveis, e design moderno responsivo.

## 🚀 Funcionalidades

- ✅ Sistema de autenticação completo (JWT + bcrypt)
- ✅ 4 cargos: Dono, Administrador, Usuário, Banido
- ✅ Primeiro usuário registrado vira Dono automaticamente
- ✅ Criação, edição, exclusão de postagens (admins)
- ✅ Comentários com respostas aninhadas
- ✅ Sistema de curtidas (posts e comentários)
- ✅ Atualização em tempo real via Socket.IO
- ✅ Painel administrativo com gráficos
- ✅ Configurações completas do site
- ✅ Modo de manutenção
- ✅ Upload de imagens
- ✅ Pesquisa por título, autor, categoria e tags
- ✅ Agendamento de postagens
- ✅ Recuperação de senha
- ✅ Proteção contra SQL Injection, XSS, CSRF, Rate Limit
- ✅ Tema escuro/claro
- ✅ Totalmente responsivo

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + Express 4 + TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL (Neon) |
| Tempo real | Socket.IO |
| Autenticação | JWT + bcrypt |
| Frontend | React 18 + Vite + TypeScript |
| Estilo | Tailwind CSS |
| Gráficos | Recharts |
| Estado | TanStack Query |

## 📦 Instalação Local

### Pré-requisitos
- Node.js >= 18
- npm ou yarn
- URL do banco Neon PostgreSQL

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/posthub.git
cd posthub
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e configure:
```env
DATABASE_URL="sua_url_do_neon"
JWT_SECRET="sua_chave_secreta_muito_longa_e_aleatoria"
JWT_REFRESH_SECRET="outra_chave_secreta_muito_longa"
NODE_ENV=development
PORT=3000
CLIENT_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173"
```

### 3. Configurar o banco

```bash
# Criar as tabelas
npm run db:push

# Popular com dados iniciais (categorias)
npm run db:seed
```

### 4. Rodar em desenvolvimento

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

Acesse: http://localhost:5173

## 🚀 Deploy no Render

### 1. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/posthub.git
git push -u origin main
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com) → **New** → **Web Service**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: posthub (ou o nome que preferir)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. Variáveis de ambiente no Render

Em **Environment** adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Sua URL do Neon PostgreSQL |
| `JWT_SECRET` | Uma string longa e aleatória |
| `JWT_REFRESH_SECRET` | Outra string longa e aleatória |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://seu-app.onrender.com` |
| `ALLOWED_ORIGINS` | `https://seu-app.onrender.com` |

### 4. Inicializar o banco em produção

Após o primeiro deploy, acesse o **Shell** do Render e execute:

```bash
npm run db:push
npm run db:seed
```

> **Importante**: O primeiro usuário que se registrar no site receberá automaticamente o cargo de **Dono**.

## 📁 Estrutura do Projeto

```
posthub/
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts          # Dados iniciais
├── src/                 # Backend (Express)
│   ├── config/          # Configurações (Prisma)
│   ├── controllers/     # Handlers das rotas
│   ├── middlewares/     # Auth, roles, rate limit...
│   ├── routes/          # Definição das rotas
│   ├── services/        # Lógica de negócio
│   ├── sockets/         # Socket.IO
│   ├── utils/           # JWT, password, sanitize
│   ├── app.ts           # Setup do Express
│   └── server.ts        # Entrada do servidor
├── client/              # Frontend (React)
│   └── src/
│       ├── components/  # Componentes reutilizáveis
│       ├── contexts/    # Auth, Socket, Theme
│       ├── pages/       # Páginas da aplicação
│       ├── services/    # Calls à API
│       └── types/       # Tipagens TypeScript
├── uploads/             # Arquivos enviados
├── .env.example         # Template de variáveis
└── README.md
```

## 🔐 Permissões

| Ação | Usuário | Admin | Dono |
|------|---------|-------|------|
| Visualizar postagens | ✅ | ✅ | ✅ |
| Curtir / Comentar | ✅ | ✅ | ✅ |
| Criar postagens | ❌ | ✅ | ✅ |
| Banir usuários | ❌ | ✅ | ✅ |
| Promover admins | ❌ | ❌ | ✅ |
| Configurações do site | ❌ | ❌ | ✅ |
| Modo manutenção | ❌ | ❌ | ✅ |

## 📡 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Cadastro |
| POST | /api/auth/login | Login |
| GET | /api/posts | Listar postagens |
| POST | /api/posts | Criar postagem (admin) |
| GET | /api/posts/:id | Ver postagem |
| GET | /api/posts/:id/comments | Comentários |
| POST | /api/posts/:id/comments | Comentar |
| POST | /api/users/:id/like | Curtir postagem |
| GET | /api/admin/dashboard | Dashboard (admin) |
| GET | /api/settings | Configurações do site |

## 🔒 Segurança

- Rate limiting em todas as rotas
- Limite rigoroso em login (10 tentativas/15min) e registro (5/hora)
- Sanitização de HTML com sanitize-html e XSS
- Headers de segurança com Helmet
- CORS configurado
- Senhas com bcrypt (12 rounds)
- JWT com refresh token

## 📝 Licença

MIT
