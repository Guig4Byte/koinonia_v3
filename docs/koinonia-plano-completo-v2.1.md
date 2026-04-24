# Koinonia — Plano de Desenvolvimento por Ondas
> **Versão 2.1** · Next.js 16 · TypeScript Strict · PWA · UX Pastoral · AI-Ready

---

## 📋 Leia antes de começar

Este documento foi reescrito para ser **executado por Inteligência Artificial**.
Cada onda é um **contrato de entrega**: a IA deve implementar exatamente o que está escrito, testar, e só então avançar.

**Regra de ouro:** Nunca peça para a IA implementar duas ondas ao mesmo tempo. Uma onda por sessão.

**Regra técnica:** Este plano usa **Next.js 16** (versão estável atual). Não use Next.js 14 — o suporte LTS do 14 encerrou em outubro de 2025.

---

## 🎯 Visão Consolidada

O Koinonia é um **PWA (Progressive Web App)** de gestão de células para igrejas.
Não é um app nativo. É um site que funciona como app: instala na tela inicial, funciona offline parcialmente, e entrega notificações push.

**A experiência central:** O pastor Roberto (52 anos) abre o celular às 22h, sem óculos, no escuro. Em 3 segundos ele sabe se a igreja está bem ou se alguém precisa dele. Em 5 segundos ele encontra qualquer pessoa pelo nome. Em 1 toque ele registra que orou por alguém.

**Três personas, três visões:**
- **Bruno (Líder):** Vê SÓ sua célula. Registra presença. Anota cuidados.
- **Ana (Supervisora):** Navega entre células. NÃO registra presença. Cobra líderes.
- **Roberto (Pastor):** Vê padrões macro. Busca global. Não vê formulários.

---

## 🏗️ Stack Definitiva

```
Frontend (Web + Mobile)  → Next.js 16 (App Router) + React Server Components
Bundler dev              → Turbopack (padrão no Next.js 16)
Estilos                  → Tailwind CSS + shadcn/ui (componentes base)
Animações                → Framer Motion
Ícones                   → Lucide React
Fonte                    → Inter (Google Fonts)
Query/Cache              → TanStack Query (React Query)
Formulários              → React Hook Form + Zod
Backend/API              → Next.js Route Handlers (API Routes)
ORM                      → Prisma
Banco                    → PostgreSQL
Auth                     → JWT (jose) + bcryptjs + Refresh Token
Validação                → Zod (100% dos inputs)
Erros                    → neverthrow (Result<T, E>)
Testes                   → Vitest + React Testing Library
Deploy                   → Vercel (frontend) + Neon (PostgreSQL)
Imagens                  → UploadThing ou Cloudflare R2
PWA                      → next-pwa (manifest, service worker, ícones)
```

**Requisito de ambiente:**
- **Node.js 20 LTS ou superior** (Next.js 16 não roda no Node 18)
- **npm 10+** ou **pnpm 9+**

**Por que não React Native:** Para um dev solo, PWA entrega 95% do valor com 30% do esforço. Se no futuro precisar de nativo pesado, empacota com Capacitor usando a mesma codebase.

---

## ⚠️ Breaking Changes do Next.js 16 (atenção para a IA)

O Next.js 16 introduziu mudanças importantes em relação ao 14. A IA deve respeitar:

### 1. Params de rotas dinâmicas são Promise (async)
Em rotas com `[id]`, `params` agora é uma **Promise**. Sempre use `await`.

```typescript
// ❌ ERRADO (era assim no Next.js 14)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// ✅ CERTO (Next.js 16)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>{id}</div>
}
```

**Isso afeta:** `/lider/membros/[id]/`, `/supervisor/celulas/[id]/`, `/pastor/equipe/[id]/`, `/lider/presenca/[eventId]/`, etc.

### 2. fetch() não é mais cacheado por padrão
No Next.js 14, `fetch()` cacheava automaticamente. No 16, **não cacheia** (comportamento `no-store`).

```typescript
// ❌ Antes (no 14, isso cacheava sozinho)
const data = await fetch('/api/people')

// ✅ Agora (se quiser cachear, declare explicitamente)
const data = await fetch('/api/people', { cache: 'force-cache' })
// Ou use ISR na página:
export const revalidate = 3600 // 1 hora
```

**Para o Koinonia isso é BOM:** dados pastorais (presença, interações, tasks) mudam o tempo todo. O padrão "não cachear" evita mostrar dados desatualizados para o Roberto.

### 3. Turbopack é o bundler padrão em desenvolvimento
Não precisa instalar nada extra. `next dev` já usa Turbopack automaticamente.

---

## 📁 Estrutura de Pastas

```
koinonia/
├── prisma/
│   ├── schema.prisma          # Modelo único de dados
│   └── seed.ts                # Dados iniciais (Roberto, Ana, Bruno, membros demo)
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker (gerado pelo next-pwa)
│   └── icons/                 # Ícones 192x192, 512x512
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Grupo de rotas públicas
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── onboarding/    # Primeiro acesso do pastor
│   │   │       └── page.tsx
│   │   ├── proxy.ts           # Proteção de APIs (Next.js 16 — antigo middleware.ts)
│   │   ├── (app)/             # Grupo de rotas autenticadas (shell mobile)
│   │   │   ├── layout.tsx     # Bottom nav, header, providers + auth client-side
│   │   │   ├── page.tsx       # Redirect por persona
│   │   │   ├── pastor/
│   │   │   │   ├── page.tsx           # Visão (3 linhas)
│   │   │   │   ├── equipe/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── eventos/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── acoes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── busca/
│   │   │   │       └── page.tsx
│   │   │   ├── supervisor/
│   │   │   │   ├── page.tsx           # Visão da região
│   │   │   │   ├── celulas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── eventos/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── acoes/
│   │   │   │       └── page.tsx
│   │   │   └── lider/
│   │   │       ├── page.tsx           # Visão da célula
│   │   │       ├── membros/
│   │   │       │   └── page.tsx
│   │   │       ├── eventos/
│   │   │       │   └── page.tsx
│   │   │       ├── presenca/
│   │   │       │   └── [eventId]/
│   │   │       │       └── page.tsx   # ⚠️ params é Promise
│   │   │       └── acoes/
│   │   │           └── page.tsx
│   │   ├── api/               # API Routes (Route Handlers)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── refresh/
│   │   │   │   │   └── route.ts
│   │   │   │   └── me/
│   │   │   │       └── route.ts
│   │   │   ├── people/
│   │   │   │   ├── route.ts           # GET /api/people (search)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # ⚠️ params é Promise
│   │   │   ├── groups/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # ⚠️ params é Promise
│   │   │   ├── events/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # ⚠️ params é Promise
│   │   │   │       └── attendance/
│   │   │   │           └── route.ts
│   │   │   ├── interactions/
│   │   │   │   └── route.ts
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # ⚠️ params é Promise
│   │   │   └── dashboard/
│   │   │       ├── pastor/
│   │   │       │   └── route.ts
│   │   │       └── supervisor/
│   │   │           └── route.ts
│   │   ├── layout.tsx         # Root layout (fontes, providers, tema)
│   │   └── globals.css        # Tailwind + variáveis CSS do tema
│   ├── components/
│   │   ├── ui/                # shadcn/ui (Button, Card, Input, Badge, Avatar)
│   │   ├── layout/
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── mobile-header.tsx
│   │   │   ├── persona-guard.tsx      # Redireciona se persona errada
│   │   │   └── theme-provider.tsx     # next-themes (claro/escuro)
│   │   └── features/
│   │       ├── pulse-card.tsx
│   │       ├── member-card.tsx
│   │       ├── member-card-swipe.tsx  # Com swipe "Orei"
│   │       ├── risk-badge.tsx
│   │       ├── presence-toggle.tsx
│   │       ├── attendance-bar.tsx
│   │       ├── search-hero.tsx
│   │       ├── week-summary.tsx
│   │       ├── empty-state.tsx        # "Durma em paz, pastor"
│   │       └── prayer-toast.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Singleton PrismaClient
│   │   ├── auth.ts            # JWT sign/verify, bcrypt, sessão
│   │   ├── auth-service.ts    # Lógica de negócio de autenticação
│   │   ├── auth-storage.ts    # localStorage para tokens (client-side)
│   │   ├── api-client.ts      # Fetch wrapper com TanStack Query
│   │   ├── api-response.ts    # Helpers padronizados de resposta HTTP
│   │   └── utils.ts           # cn() (clsx + tailwind-merge)
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-persona.ts
│   │   ├── use-group-health.ts
│   │   ├── use-attendance.ts
│   │   ├── use-search.ts      # Debounce 300ms
│   │   └── use-theme.ts
│   ├── types/
│   │   └── index.ts           # Tipos globais compartilhados
│   └── domain/                # Lógica de negócio PURA (sem framework)
│       ├── entities/
│       │   ├── person.entity.ts
│       │   ├── group.entity.ts
│       │   ├── event.entity.ts
│       │   ├── attendance.entity.ts
│       │   ├── interaction.entity.ts
│       │   ├── task.entity.ts
│       │   └── risk-score.entity.ts
│       ├── repositories/      # Interfaces (contratos)
│       │   ├── person.repository.ts
│       │   ├── group.repository.ts
│       │   ├── event.repository.ts
│       │   ├── attendance.repository.ts
│       │   ├── interaction.repository.ts
│       │   └── task.repository.ts
│       ├── use-cases/         # Um arquivo por caso de uso
│       │   ├── auth/
│       │   ├── attendance/
│       │   ├── dashboard/
│       │   └── risk/
│       └── errors/
│           └── domain-errors.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

---

## ⚙️ Configurações Base (Onda 0)

### tsconfig.json
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        bg: { DEFAULT: '#FAF6F1', dark: '#141412' },
        card: { DEFAULT: '#FFFFFF', dark: '#1e1e1c' },
        risk: { DEFAULT: '#993C1D', bg: '#FAECE7', 'bg-dark': '#3d1a0e' },
        ok: { DEFAULT: '#3B6D11', bg: '#EAF3DE', 'bg-dark': '#1a3008' },
        warn: { DEFAULT: '#854F0B', bg: '#FEF3E8', 'bg-dark': '#3d2405' },
        new: { DEFAULT: '#185FA5', bg: '#E6F1FB', 'bg-dark': '#0a2640' },
        stone: {
          50: '#FAF9F7', 100: '#F1EFEA', 200: '#E3E0D8', 300: '#D3D1C7',
          400: '#A8A59A', 500: '#888780', 600: '#5F5E5A', 700: '#3D3C39',
          800: '#2C2C2A', 900: '#1A1A18',
        },
      },
      fontSize: {
        'pulse': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'card-title': ['1.125rem', { lineHeight: '1.3' }],
        'card-meta': ['0.875rem', { lineHeight: '1.4' }],
        'badge': ['0.75rem', { lineHeight: '1', fontWeight: '500' }],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'gentle-pulse': 'gentlePulse 4s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.995)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg: #FAF6F1;
    --card: #FFFFFF;
    --text-primary: #2C2C2A;
    --text-secondary: #5F5E5A;
    --text-muted: #888780;
  }

  .dark {
    --bg: #141412;
    --card: #1e1e1c;
    --text-primary: #e8e4df;
    --text-secondary: #c8c4bd;
    --text-muted: #888780;
  }

  body {
    background-color: var(--bg);
    color: var(--text-primary);
  }
}
```

---

## 🗄️ Schema Prisma Corrigido (Onda 0)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role
  personId      String    @unique
  churchId      String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  person        Person    @relation(fields: [personId], references: [id])
  church        Church    @relation(fields: [churchId], references: [id])
  assignedTasks Task[]    @relation("Assignee")
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Church {
  id          String      @id @default(cuid())
  name        String
  createdAt   DateTime    @default(now())
  deletedAt   DateTime?

  people      Person[]
  groups      Group[]
  eventTypes  EventType[]
  users       User[]
}

model Person {
  id          String    @id @default(cuid())
  churchId    String
  name        String
  phone       String?
  photoUrl    String?
  birthDate   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  church      Church    @relation(fields: [churchId], references: [id])
  memberships Membership[]
  attendances Attendance[]
  interactionsAsSubject Interaction[] @relation("Subject")
  interactionsAsAuthor  Interaction[] @relation("Author")
  needs       Need[]
  riskScore   RiskScore?
  user        User?
}

model Group {
  id          String    @id @default(cuid())
  churchId    String
  name        String
  leaderId    String?
  supervisorId String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  church      Church    @relation(fields: [churchId], references: [id])
  memberships Membership[]
  events      Event[]
  tasks       Task[]
}

model Membership {
  id        String   @id @default(cuid())
  personId  String
  groupId   String
  role      MembershipRole
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  person    Person   @relation(fields: [personId], references: [id])
  group     Group    @relation(fields: [groupId], references: [id])

  @@unique([personId, groupId])
}

model EventType {
  id          String   @id @default(cuid())
  churchId    String
  name        String
  kind        EventKind
  riskWeight  Int      @default(1)
  createdAt   DateTime @default(now())

  church      Church   @relation(fields: [churchId], references: [id])
  events      Event[]
}

model Event {
  id          String    @id @default(cuid())
  groupId     String
  eventTypeId String
  scheduledAt DateTime
  occurredAt  DateTime?
  notes       String?
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?

  group       Group     @relation(fields: [groupId], references: [id])
  eventType   EventType @relation(fields: [eventTypeId], references: [id])
  attendances Attendance[]
}

model Attendance {
  id        String   @id @default(cuid())
  eventId   String
  personId  String
  present   Boolean
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  event     Event    @relation(fields: [eventId], references: [id])
  person    Person   @relation(fields: [personId], references: [id])

  @@unique([eventId, personId])
}

model Interaction {
  id        String          @id @default(cuid())
  personId  String
  authorId  String
  kind      InteractionKind
  content   String
  createdAt DateTime        @default(now())

  person    Person          @relation("Subject", fields: [personId], references: [id], onDelete: Cascade)
  author    Person          @relation("Author", fields: [authorId], references: [id])

  @@index([personId])
  @@index([authorId])
}

model Need {
  id          String    @id @default(cuid())
  personId    String
  kind        NeedKind
  priority    Priority
  content     String
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())

  person      Person    @relation(fields: [personId], references: [id], onDelete: Cascade)
  tasks       Task[]    @relation("NeedTasks")

  @@index([personId])
}

model Task {
  id          String     @id @default(cuid())
  assigneeId  String
  groupId     String?
  needId      String?
  targetType  TaskTarget
  targetId    String
  description String
  dueAt       DateTime
  completedAt DateTime?
  createdAt   DateTime   @default(now())
  deletedAt   DateTime?

  assignee    User       @relation("Assignee", fields: [assigneeId], references: [id])
  group       Group?     @relation(fields: [groupId], references: [id])
  need        Need?      @relation("NeedTasks", fields: [needId], references: [id], onDelete: SetNull)

  @@index([assigneeId])
  @@index([groupId])
  @@index([needId])
}

model RiskScore {
  id        String    @id @default(cuid())
  personId  String    @unique
  score     Int
  level     RiskLevel
  reasons   String[]
  updatedAt DateTime  @updatedAt

  person    Person    @relation(fields: [personId], references: [id])
}

enum Role {
  pastor
  supervisor
  leader
  host
  member
}

enum MembershipRole {
  member
  host
}

enum EventKind {
  community_bond
  belonging
  development
  commitment
}

enum InteractionKind {
  call
  whatsapp
  visit
  prayer
  note
}

enum NeedKind {
  prayer
  social
  counseling
}

enum Priority {
  low
  medium
  high
}

enum TaskTarget {
  person
  group
  leader
}

enum RiskLevel {
  green
  yellow
  red
}
```

---

## 🌊 Ondas de Desenvolvimento

> **Regra para a IA:** Implemente UMA onda por vez. Nunca adiante código de ondas futuras. Cada onda tem um **Contrato de Entrega** — só avance quando todos os itens estiverem marcados.

---

### 🌊 Onda 0 — Fundação
**Objetivo:** Repositório configurado, banco modelado, seed rodando.

**Comando de instalação:**
```bash
npx create-next-app@latest koinonia --typescript --tailwind --eslint --app --src-dir
```

**Tarefas:**
1. Instalar dependências:
   ```bash
   npm install prisma @prisma/client zod react-hook-form @hookform/resolvers lucide-react framer-motion clsx tailwind-merge bcryptjs jose next-themes @tanstack/react-query
   npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom dotenv
   ```
2. Configurar `prisma/schema.prisma` (copiar do documento)
3. Rodar `npx prisma migrate dev --name init`
4. Criar `prisma/seed.ts` com:
   - Igreja "Comunidade Esperança"
   - Roberto (pastor) + User
   - Ana (supervisora) + User
   - Bruno (líder) + User
   - 10 membros distribuídos em 3 células
   - 2 event types: Célula e EMC
   - 3 eventos passados com presenças variadas
5. Configurar `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs` (com next-pwa)
6. Criar `src/lib/utils.ts` (cn helper)
7. Criar `src/lib/prisma.ts` (singleton)
8. Criar `src/types/index.ts` com tipos globais

**Contrato de Entrega:**
- [ ] `npm run dev` sobe sem erros (Turbopack rodando)
- [ ] `npx prisma db seed` popula o banco
- [ ] `npx prisma studio` mostra todos os dados
- [ ] TypeScript `strict: true` sem erros
- [ ] Tailwind compilando

---

### 🌊 Onda 1 — Autenticação e Onboarding
**Objetivo:** Login seguro, sessão com refresh token, logout server-side, primeiro acesso do pastor.

> **Arquitetura de auth no Koinonia (padrão dual):**
> - **APIs:** `src/proxy.ts` (Next.js 16) intercepta rotas `/api/*`, valida o Bearer token e injeta headers `x-user-id`, `x-user-role`, `x-person-id`, `x-church-id`. NÃO redireciona páginas.
> - **Páginas:** `src/app/(app)/layout.tsx` (client component) verifica sessão via `useMe()` e redireciona para `/login` se o usuário não estiver autenticado. Isso evita o problema do middleware não ter acesso ao `localStorage`.
> - **Tokens:** Access token (15min) e refresh token (7 dias) ficam em `localStorage` via `src/lib/auth-storage.ts`.

**Tarefas:**
1. Criar `src/lib/auth.ts`:
   - `hashPassword(password: string): Promise<string>`
   - `verifyPassword(password: string, hash: string): Promise<boolean>`
   - `signAccessToken(payload: TokenPayload): Promise<string>` (JWT, 15min)
   - `signRefreshToken(userId: string): Promise<string>` (JWT, 7 dias)
   - `verifyAccessToken(token: string): Promise<TokenPayload | null>`
   - `verifyRefreshToken(token: string): Promise<string | null>` (retorna userId)
   - `extractBearerToken(header: string | null): string | null`
2. Criar `src/lib/auth-storage.ts`:
   - `persistAuthTokens(tokens)` — salva access + refresh no `localStorage`
   - `getStoredAccessToken()` / `getStoredRefreshToken()`
   - `clearStoredAuth()` — remove tokens e dispara evento de mudança
   - `subscribeToAuthStorage(callback)` — para hooks reagirem a logout
3. Criar `src/lib/auth-service.ts`:
   - `loginUser(input)` — busca user, verifica senha, cria tokens, retorna `Result<LoginResponse, DomainError>`
   - `refreshAccessToken(input)` — valida refresh token no banco, gera novo access token
   - `getAuthenticatedUser(input)` — valida access token e retorna usuário
   - `onboardChurch(input)` — cria igreja + pastor + user em transação (só se não houver igreja)
4. Criar API Routes:
   - `POST /api/auth/login` — Zod schema, chama `loginUser`, retorna tokens + user
   - `POST /api/auth/logout` — recebe `{ refreshToken }`, deleta o token do banco (logout server-side)
   - `POST /api/auth/refresh` — Zod schema, chama `refreshAccessToken`
   - `GET /api/auth/me` — extrai Bearer, chama `getAuthenticatedUser`
   - `POST /api/auth/onboarding` — Zod schema, chama `onboardChurch`
5. Criar `src/lib/api-response.ts`:
   - `validationErrorResponse`, `domainErrorResponse`, `serverErrorResponse`, `invalidJsonResponse`
   - Mapeamento de `DomainError` para status HTTP e mensagens em português
6. Criar `src/proxy.ts` (Next.js 16 — substitui `middleware.ts`):
   - Exporta função `proxy(request)`
   - Matcher: `/api/:path*`
   - Libera `/api/auth/*`
   - Para APIs protegidas: extrai Bearer, verifica JWT, injeta headers `x-user-id`, `x-user-role`, `x-person-id`, `x-church-id`
   - Retorna 401 JSON se token ausente ou inválido
   - **NUNCA** redireciona páginas (isso é feito no client-side)
7. Criar tela `/(auth)/login/page.tsx`:
   - Formulário com React Hook Form + Zod (`loginSchema`)
   - Layout mobile-first, inputs grandes (h-12, text-base)
   - Sem validação visual agressiva (mensagens suaves)
8. Criar tela `/(auth)/onboarding/page.tsx`:
   - Só acessível se não houver igreja no banco
   - Formulário com React Hook Form + Zod: nome da igreja, nome do pastor, email, senha
   - Cria igreja + pastor + user em uma transação
9. Criar `src/hooks/use-auth.ts` (TanStack Query):
   - `useMe()` — busca `/api/auth/me`, com retry automático em `TOKEN_EXPIRED` (usa refresh token)
   - `useLogin()` — mutation para login, persiste tokens, redireciona
   - `useLogout()` — chama `POST /api/auth/logout` (invalida refresh no servidor), depois limpa localStorage e redireciona
   - `useOnboarding()` — mutation para onboarding
   - `useStoredSessionState()` — retorna se há sessão no localStorage (para evitar flash de login)
10. Criar `src/components/layout/persona-guard.tsx`:
    - Lê `useMe()`
    - Se role for `pastor`, redireciona `/pastor`
    - Se `supervisor`, redireciona `/supervisor`
    - Se `leader`, redireciona `/lider`
11. Criar `src/app/(app)/layout.tsx`:
    - Client component que verifica `useStoredSessionState()` e `useMe()`
    - Redireciona para `/login` se não houver sessão ou se `useMe()` falhar
    - Mostra tela de loading enquanto verifica

**Contrato de Entrega:**
- [ ] Login funciona com seed data (Roberto/Ana/Bruno)
- [ ] Refresh token renova sessão silenciosamente
- [ ] Logout deleta o refresh token no banco e limpa o client
- [ ] Rota de API protegida rejeita token inválido (401 JSON)
- [ ] Acesso direto a `/lider` funciona após login (F5 não quebra)
- [ ] Onboarding cria primeira igreja e redireciona
- [ ] Redirect por persona funciona
- [ ] Testes unitários para `auth.ts` (hash, verify, JWT sign/verify, bearer extraction)

---

### 🌊 Onda 2 — Domínio Core + API Base
**Objetivo:** Entidades, repositórios (interfaces), casos de uso, e implementações Prisma.

**Tarefas:**
1. Criar entidades em `src/domain/entities/` (interfaces readonly):
   ```typescript
   export interface Person {
     readonly id: string
     readonly name: string
     readonly churchId: string
     readonly phone?: string
     readonly photoUrl?: string
   }
   ```
   (Fazer para Group, Event, Attendance, Interaction, Task, RiskScore)
2. Criar interfaces de repositório em `src/domain/repositories/`:
   - Cada interface define os métodos necessários (findById, findMany, create, update)
3. Criar `src/domain/errors/domain-errors.ts`:
   ```typescript
   export const DomainErrors = {
     PERSON_NOT_FOUND: 'PERSON_NOT_FOUND',
     GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
     EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
     UNAUTHORIZED: 'UNAUTHORIZED',
     INVALID_ROLE: 'INVALID_ROLE',
   } as const
   ```
4. Criar implementações Prisma em `src/app/api/_repositories/`:
   - `PersonPrismaRepository implements PersonRepository`
   - `GroupPrismaRepository implements GroupRepository`
   - `EventPrismaRepository implements EventRepository`
   - `AttendancePrismaRepository implements AttendanceRepository`
5. Criar casos de uso em `src/domain/use-cases/`:
   - `GetPersonProfileUseCase`
   - `GetGroupHealthUseCase` (versão ingênua: conta membros, presença recente, faltas)
   - `SearchPeopleUseCase` (busca por nome, usa `ILIKE` no Prisma)
   - `RegisterAttendanceUseCase`
   - `CreateInteractionUseCase`
6. Criar API Routes (lembrar: params é Promise no Next.js 16):
   ```typescript
   // Exemplo de rota dinâmica
   export async function GET(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params
     // ...
   }
   ```
   - `GET /api/people?search=` — busca com `ILIKE`, limit 20
   - `GET /api/people/[id]` — perfil completo
   - `GET /api/groups/[id]` — dados do grupo + líder
   - `GET /api/groups/[id]/health` — saúde da célula (versão ingênua)
   - `GET /api/events/[id]` — dados do evento
   - `POST /api/events/[id]/attendance` — registra presenças (array de {personId, present})
   - `POST /api/interactions` — cria anotação
7. Criar Zod schemas para TODOS os inputs de API
8. Criar role-guard nas rotas:
   - `/api/groups/[id]/health` — `pastor`, `supervisor`, `leader` (mas leader só se for líder do grupo)
   - `/api/events/[id]/attendance` — `leader`, `supervisor`, `pastor`

**Contrato de Entrega:**
- [ ] Todas as entidades são `readonly` interfaces
- [ ] Zero `any` no código
- [ ] Todos os inputs de API validados por Zod
- [ ] Role-guard aplicado em rotas sensíveis
- [ ] Params de rotas dinâmicas usam `await` (Next.js 16)
- [ ] Testes unitários para todos os casos de uso (com repositórios mockados)
- [ ] Testes de integração para login, busca, e registro de presença

---

### 🌊 Onda 3 — App Bruno: Visão e Membros
**Objetivo:** Tela inicial do líder e feed de membros. Sem presença ainda.

**Tarefas:**
1. Criar layout `/(app)/lider/layout.tsx`:
   - Bottom nav com 4 tabs: Visão, Membros, Eventos, Ações
   - Header com saudação dinâmica ("Boa noite, Bruno.")
   - Container mobile (`max-w-[430px]`, centralizado no desktop)
2. Criar `src/components/features/pulse-card.tsx`:
   - Fundo escuro (`bg-stone-800`), texto branco
   - Animação `fade-up` com delays escalonados
   - Mostra: total de membros, presença da última reunião, quantos em risco
3. Criar `src/components/features/member-card.tsx`:
   - Avatar circular com iniciais
   - Nome, status, badge de risco
   - Nota curta embaixo (última interação)
   - `active:scale-[0.98]` no toque
4. Criar `src/components/features/risk-badge.tsx`:
   - `red` → "Risco" (terroso, não vermelho puro)
   - `yellow` → "Atenção"
   - `green` → "Ativo"
   - `blue` → "Novo"
5. Criar tela `/(app)/lider/page.tsx` (Visão):
   - Saudação com delay teatral (0ms → 300ms → 600ms)
   - Pulse card com resumo da célula
   - Lista dos 3 membros mais urgentes (em risco)
6. Criar tela `/(app)/lider/membros/page.tsx`:
   - Feed de membros dividido por seção: "Em risco", "Visitantes", "Regulares"
   - Cards clicáveis → navega para perfil
7. Criar tela `/(app)/lider/membros/[id]/page.tsx` (⚠️ params é Promise):
   ```typescript
   export default async function MemberProfilePage({
     params,
   }: {
     params: Promise<{ id: string }>
   }) {
     const { id } = await params
     // ...
   }
   ```
   - Avatar grande, nome, célula
   - Badge de status
   - Timeline de presença (últimas 6 semanas: bolinhas verde/vermelho/cinza)
   - Histórico de interações (feed cronológico)
   - Botão "+ Anotar observação" (abre modal/simples textarea)
8. Criar `src/hooks/use-group-health.ts` (TanStack Query)
9. Criar `src/hooks/use-members.ts`

**Regra de ouro do Bruno:**
- O backend filtra tudo pelo `groupId` do Bruno. Ele NUNCA vê dados de outra célula.
- A API `GET /api/leader/dashboard` retorna apenas dados do grupo do líder logado.

**Contrato de Entrega:**
- [ ] Bruno loga e vê SÓ sua célula
- [ ] Feed de membros com seções corretas
- [ ] Perfil do membro com timeline de presença
- [ ] Anotação livre funciona (POST /api/interactions)
- [ ] Animações de entrada suaves
- [ ] Touch targets mínimo 48x48px
- [ ] Testes dos hooks

---

### 🌊 Onda 4 — App Bruno: Presença e Eventos
**Objetivo:** Registro de presença com toggles e barra de progresso.

**Tarefas:**
1. Criar `src/components/features/presence-toggle.tsx`:
   - Checkbox grande, redondo, acessível
   - Estado `presente` → verde com check
   - Estado `ausente` → cinza vazio
   - Label com nome e status ("Em risco · 3ª falta")
   - `accessibilityRole="checkbox"`
2. Criar `src/components/features/attendance-bar.tsx`:
   - Barra de progresso horizontal
   - Atualiza em tempo real conforme toggles mudam
   - Texto: "7 de 10 confirmados"
3. Criar tela `/(app)/lider/eventos/page.tsx`:
   - Lista de eventos da célula (passados e futuros)
   - Card com data, tipo, taxa de presença
   - Evento mais recente em destaque: "Toque para registrar presença"
4. Criar tela `/(app)/lider/presenca/[eventId]/page.tsx` (⚠️ params é Promise):
   - Header: nome da célula + data
   - Barra de progresso
   - Lista de membros com PresenceToggle
   - Botão "Confirmar presença" (só habilita se houver alterações)
   - Ao confirmar: POST /api/events/[id]/attendance + invalida cache
5. Criar `src/hooks/use-attendance.ts`:
   - `useEventAttendance(eventId)`
   - `useRegisterAttendance()` (mutation)

**Contrato de Entrega:**
- [ ] Lista de eventos da célula do Bruno
- [ ] Tela de presença com toggles funcionando
- [ ] Barra de progresso atualiza em tempo real
- [ ] Confirmação envia para API e invalida cache
- [ ] Offline: TanStack Query cacheia os dados (não precisa sync complexo ainda)
- [ ] Testes de integração do fluxo completo

---

### 🌊 Onda 5 — App Bruno: Ações e Anotações
**Objetivo:** Fila de tarefas do líder + anotação rápida.

**Tarefas:**
1. Criar tela `/(app)/lider/acoes/page.tsx`:
   - Header: "O que precisa do seu coração"
   - Seção "Urgente": tasks com prazo < 48h
   - Seção "Esta semana": tasks normais
   - Card de task: prioridade (cor), descrição, quem, prazo
2. Criar `src/components/features/task-card.tsx`:
   - Dot colorido indicando prioridade
   - Descrição em texto legível
   - Badge de prazo (vermelho se vencido, verde se ok)
3. Criar API `GET /api/tasks/mine`:
   - Retorna tasks do líder logado
   - Ordenado por prioridade + dueAt
4. Criar modal/drawer de anotação rápida:
   - Textarea com placeholder: "O que aconteceu?..."
   - Botão "Salvar" grande, largura total
   - Sem categorização obrigatória (o sistema categoriza depois)
5. Criar API `POST /api/interactions`:
   - `{ personId, kind: 'note', content }`
   - `authorId` pega do token JWT
6. Criar `src/components/features/prayer-toast.tsx`:
   - Toast central que aparece ao registrar oração
   - Ícone 🙏 + "Oração registrada" + subtítulo opcional

**Contrato de Entrega:**
- [ ] Tasks do Bruno aparecem ordenadas por urgência
- [ ] Anotação rápida funciona em < 3 toques
- [ ] Toast de confirmação suave
- [ ] Testes dos hooks de tasks

---

### 🌊 Onda 6 — App Ana: Visão e Células
**Objetivo:** Supervisora navega entre células. Visão de leitura.

**Tarefas:**
1. Criar layout `/(app)/supervisor/layout.tsx`:
   - Bottom nav: Visão, Células, Eventos, Ações
2. Criar tela `/(app)/supervisor/page.tsx`:
   - Saudação "Boa noite, Ana."
   - Pulse card: resumo da região (células em risco, follow-ups atrasados)
   - Lista das células com status
3. Criar tela `/(app)/supervisor/celulas/page.tsx`:
   - Lista de TODAS as células da supervisora
   - Card com: nome, líder, presença, badge de status
   - Cards clicáveis → detalhe da célula
4. Criar tela `/(app)/supervisor/celulas/[id]/page.tsx` (⚠️ params é Promise):
   - Header: nome da célula + líder
   - Lista de membros (leitura, NÃO edita presença)
   - Se presença não registrada: badge "Bruno não registrou ainda"
   - Se presença registrada: mostra resultado
   - Botão "Cobrar Bruno" → cria task para o líder
5. Criar API `GET /api/supervisor/groups`:
   - Retorna grupos onde `supervisorId` = person do user logado
6. Criar API `GET /api/supervisor/groups/[id]` (⚠️ params é Promise):
   - Retorna membros + última presença

**Regra de ouro da Ana:**
- Ana NUNCA registra presença. Ela cobra o Bruno.
- O backend garante: rotas de attendance rejeitam role `supervisor`.

**Contrato de Entrega:**
- [ ] Ana vê todas as suas células
- [ ] Navegação entre células funciona
- [ ] Não consegue registrar presença (botão ausente ou desabilitado)
- [ ] "Cobrar Bruno" cria task no sistema
- [ ] Testes de permissão (supervisor não acessa POST attendance)

---

### 🌊 Onda 7 — App Ana: Eventos e Ações
**Objetivo:** Eventos da região + fila de cobranças.

**Tarefas:**
1. Criar tela `/(app)/supervisor/eventos/page.tsx`:
   - Eventos de TODAS as células agrupados por célula
   - Card com: célula, data, presença, membros em risco
   - Leitura apenas
2. Criar tela `/(app)/supervisor/acoes/page.tsx`:
   - Tasks da Ana (cobranças de líderes, acompanhamentos)
   - Seção "Urgente" / "Esta semana"
   - Ação de "Marcar como feito"
3. Criar API `GET /api/supervisor/events`
4. Criar API `GET /api/supervisor/tasks`
5. Criar API `PATCH /api/tasks/[id]/complete` (⚠️ params é Promise)

**Contrato de Entrega:**
- [ ] Eventos da região visíveis
- [ ] Tasks da Ana funcionam
- [ ] Marcar como feito atualiza status

---

### 🌊 Onda 8 — App Roberto: Visão e Busca
**Objetivo:** Pastor vê macro. Busca de emergência < 2s.

**Tarefas:**
1. Criar layout `/(app)/pastor/layout.tsx`:
   - Bottom nav: Visão, Equipe, Eventos, Buscar (Buscar em vez de Ações)
2. Criar tela `/(app)/pastor/page.tsx`:
   - Saudação com delay teatral (0ms → 500ms → 1000ms)
   - Pulse card: "3 pessoas estão escapando pelos dedos"
   - Lista dos 2 supervisores com status
   - 2 alertas da semana (cards âmbar)
3. Criar `src/components/features/search-hero.tsx`:
   - Barra de busca sticky no topo
   - Ícone de lupa grande
   - Placeholder: "Buscar pessoa..."
   - Debounce de 300ms
   - Resultados em cards com: nome, célula, status, último contato
4. Criar tela `/(app)/pastor/busca/page.tsx`:
   - SearchHero no topo
   - Lista de resultados
   - Estado vazio: "Digite pelo menos 2 letras"
5. Criar API `GET /api/people?search=`:
   - Usa `ILIKE` no PostgreSQL
   - Limit 20
   - Index no campo `name` (ou full-text se necessário)
   - Retorna em < 200ms
6. Criar `src/hooks/use-search.ts` (TanStack Query + debounce)

**Regra de ouro do Roberto:**
- Roberto NUNCA vê formulários complexos no mobile.
- Tudo é leitura, busca, ou ação de 1 toque.
- Drill-down: Roberto → Supervisor → Célula (somente leitura)

**Contrato de Entrega:**
- [ ] Visão com frase dinâmica
- [ ] Busca funciona em < 2s com debounce
- [ ] Resultados mostram nome, célula, status, último contato
- [ ] Zero formulários na visão do pastor
- [ ] Testes de performance da busca

---

### 🌊 Onda 9 — App Roberto: Equipe e Eventos
**Objetivo:** Supervisores em detalhe + resumo semanal por tipo.

**Tarefas:**
1. Criar tela `/(app)/pastor/equipe/page.tsx`:
   - Cards dos supervisores com mini-barras de status
   - Ana: 68% presença, 2 líderes risco, 5 atrasados
   - Marcos: 82% presença, 0 risco
   - Cards clicáveis → detalhe do supervisor
2. Criar tela `/(app)/pastor/equipe/[id]/page.tsx` (⚠️ params é Promise):
   - Perfil do supervisor
   - Células da região com status
   - Follow-ups atrasados
3. Criar tela `/(app)/pastor/eventos/page.tsx`:
   - Resumo semanal por tipo de evento
   - Células: 74% (▼ 3pts)
   - Cultos: 81% (estável)
   - EMC: 88% (▲ 5pts)
   - Barras de progresso coloridas
4. Criar API `GET /api/pastor/dashboard`
5. Criar API `GET /api/pastor/supervisors`
6. Criar API `GET /api/pastor/events/summary`

**Contrato de Entrega:**
- [ ] Supervisores com barras de status
- [ ] Drill-down funciona
- [ ] Eventos por tipo com tendência (▲▼)
- [ ] Tudo em leitura, sem formulários

---

### 🌊 Onda 10 — Motor de Risco v1 (Scoring Ingênuo)
**Objetivo:** Calcular risco básico para alimentar as telas. Sem job automático ainda.

**Tarefas:**
1. Criar função `calculateRiskScore` em `src/domain/use-cases/risk/`:
   ```typescript
   export function calculateRiskScore(input: RiskInput): RiskScore {
     let score = 100
     // Regra 1: faltas consecutivas (últimas 6 ocorrências)
     const consecutiveAbsences = countConsecutiveAbsences(input.recentAttendances)
     score -= consecutiveAbsences * 15
     // Regra 2: sem contato do líder
     const daysSinceContact = input.lastContactDate
       ? daysBetween(input.lastContactDate, new Date())
       : 999
     if (daysSinceContact > 21) score -= 20
     if (daysSinceContact > 14) score -= 10
     // Regra 3: necessidade alta em aberto
     if (input.hasHighNeed) score -= 25
     // Regra 4: membro novo sem acompanhamento
     if (input.isNewWithoutCare) score -= 15
     const clamped = Math.max(0, Math.min(100, score))
     return {
       personId: input.personId,
       score: clamped,
       level: scoreToLevel(clamped),
       reasons: buildReasons(input),
       updatedAt: new Date(),
     }
   }
   ```
2. Criar API `POST /api/risk/calculate` (ou calcular on-demand):
   - Chamado ao carregar a tela de membros
   - Atualiza `RiskScore` no banco
3. Criar API `GET /api/people/[id]/risk` (⚠️ params é Promise):
   - Retorna score atual + reasons
4. Atualizar telas para usar `RiskScore`:
   - MemberCard mostra badge baseado no level
   - PulseCard mostra contagem de "em risco"

**Contrato de Entrega:**
- [ ] Função `calculateRiskScore` com 100% de cobertura de testes
- [ ] Score atualiza ao carregar tela de membros
- [ ] Badges de risco refletem score real
- [ ] Reasons explicam por que a pessoa está em risco

---

### 🌊 Onda 11 — Tema Noturno + Polish UX
**Objetivo:** Dark mode pastoral, micro-transições, empty states, refinamento visual.

**Tarefas:**
1. Configurar `next-themes` (já instalado na Onda 0)
2. Criar `src/components/layout/theme-provider.tsx`:
   - Detecta preferência do sistema
   - Das 21h às 6h, força dark mode (se usuário não tiver preferência explícita)
   - Toggle manual no header (🌙/☀️)
3. Atualizar `tailwind.config.ts` com cores dark:
   - `dark:bg-[#141412]` (quase preto, quente)
   - `dark:text-[#e8e4df]` (branco quente)
   - Cards: `dark:bg-[#1e1e1c]`
   - Bordas: `dark:border-[#2a2a28]`
4. Criar `src/components/features/empty-state.tsx`:
   - Ícone 🌙 flutuando (animação `float`)
   - "Tudo quieto. Durma em paz, pastor."
   - Usado quando não há alertas
5. Refinar animações:
   - Delay teatral na entrada (0ms → 300ms → 600ms → 1000ms)
   - `fade-up` suave nos cards
   - `gentle-pulse` no indicador de atualização
6. Refinar tipografia:
   - Garantir que nenhum texto seja menor que 13px no mobile
   - Inputs com `text-base` (16px) para evitar zoom do iOS
   - Touch targets mínimo 48x48px em TODOS os botões
7. Criar `src/components/features/member-card-swipe.tsx`:
   - Swipe para esquerda → revela "🙏 Orei"
   - Ao completar o swipe: vibração leve + toast "Oração registrada"
   - Cria interaction do tipo `prayer`
8. Acessibilidade:
   - `aria-label` em todos os botões
   - `role` nos toggles de presença
   - Contraste mínimo 4.5:1

**Contrato de Entrega:**
- [ ] Dark mode funciona em todas as telas
- [ ] Transição entre temas é suave (transition-colors duration-500)
- [ ] Empty state "Durma em paz" aparece quando não há alertas
- [ ] Swipe "Orei" funciona no mobile
- [ ] Nenhum texto menor que 13px
- [ ] Todos os touch targets ≥ 48x48px
- [ ] Testes de acessibilidade (contrastes, roles)

---

### 🌊 Onda 12 — Motor de Risco v2 + Playbooks Automáticos
**Objetivo:** Job diário, scoring inteligente, geração automática de tasks.

**Tarefas:**
1. Criar job `src/app/api/jobs/risk-calculator/route.ts`:
   - Roda via cron (Vercel Cron ou trigger externo)
   - Protegido por `CRON_SECRET`
   - Calcula score de TODOS os membros ativos
   - Atualiza `RiskScore`
2. Criar playbooks automáticos:
   | Gatilho | Ação |
   |---|---|
   | Score vermelho + sem task aberta | Cria task para o líder (48h) |
   | 21 dias sem contato | Cria task de cobrança para supervisor |
   | Novo membro 30 dias sem interação | Alerta na tela do líder |
   | Líder com 3+ tasks vencidas | Alerta na tela do supervisor |
3. Criar API `GET /api/pastor/alerts`:
   - Retorna alertas sistêmicos ordenados por urgência
4. Criar API `GET /api/leader/alerts`
5. Criar API `GET /api/supervisor/alerts`
6. Atualizar telas para mostrar alertas dos playbooks

**Contrato de Entrega:**
- [ ] Job calcula scores diariamente
- [ ] Playbooks geram tasks automaticamente
- [ ] Alertas aparecem nas telas corretas
- [ ] Testes de integração do fluxo completo: ausência → score → alerta → task

---

### 🌊 Onda 13 — Analytics e Relatórios
**Objetivo:** Dashboards web desktop, tendências, exportação.

**Tarefas:**
1. Criar rotas web desktop (Next.js pages com layout desktop):
   - `/dashboard/pastor` — visão consolidada
   - `/dashboard/supervisor` — visão da região
2. Criar componentes de gráficos simples:
   - Barra de presença por célula (últimas 4 semanas)
   - Linha de tendência de frequência
   - Números grandes com setas (▲▼)
3. Criar API `GET /api/analytics/presence-trend`:
   - Query SQL otimizada com índices
   - Cache de 1 hora (TanStack Query staleTime)
4. Criar API `GET /api/analytics/retention`
5. Criar exportação CSV/PDF (biblioteca leve como `jspdf` ou `papaparse`)
6. Criar mapa de calor de presença (tabela simples, não gráfico complexo)

**Contrato de Entrega:**
- [ ] Dashboards desktop funcionando
- [ ] Queries otimizadas (< 500ms)
- [ ] Cache implementado
- [ ] Exportação CSV funciona
- [ ] Zero gráficos de pizza complexos no mobile

---

### 🌊 Onda 14 — PWA + Deploy
**Objetivo:** App instalável, offline básico, publicação.

**Tarefas:**
1. Configurar `next-pwa` no `next.config.mjs`:
   - Gera `manifest.json`
   - Gera Service Worker
   - Cache de páginas estáticas
2. Criar ícones:
   - 192x192 (para Android)
   - 512x512 (para splash screen)
   - 180x180 (para iOS)
3. Configurar `manifest.json`:
   - `display: standalone`
   - `theme_color: #FAF6F1`
   - `background_color: #FAF6F1`
4. Testar instalação:
   - Android: Chrome → "Adicionar à tela inicial"
   - iOS: Safari → "Adicionar à Tela de Início"
5. Configurar deploy:
   - Vercel (frontend)
   - Neon (PostgreSQL)
   - Variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`
6. Configurar domínio customizado (opcional)
7. Documentar onboarding para novas igrejas:
   - URL do app
   - Como instalar no celular
   - Como convidar líderes

**Contrato de Entrega:**
- [ ] App instala na tela inicial (Android e iOS)
- [ ] Funciona sem barra de endereço
- [ ] Splash screen com ícone
- [ ] Offline: última tela acessada funciona (cache do Service Worker)
- [ ] Deploy em produção acessível
- [ ] README com instruções de instalação

---

## 🧠 Regras de Ouro para a IA

Estas regras valem para TODAS as ondas. Cole no início de cada prompt:

```
Você está desenvolvendo o Koinonia, sistema de gestão de células para igrejas.

Stack: Next.js 16 (App Router) + TypeScript strict + Tailwind CSS + Prisma + PostgreSQL.
Node.js 20+ obrigatório. Turbopack é o bundler padrão em dev.

REGRAS ABSOLUTAS:
1. TypeScript strict: true. Zero any. Use unknown + narrowing se necessário.
2. Cada caso de uso é um arquivo isolado em src/domain/use-cases/. Sem god classes.
3. Todo input de API passa por Zod antes de chegar no domínio.
4. Repositórios são interfaces em src/domain/repositories/. Implementações ficam em src/app/api/_repositories/.
5. Erros de negócio usam neverthrow (Result<T, E>) para fluxos previsíveis. Throws são aceitáveis apenas para erros irrecuperáveis (configuração ausente, falhas de infra).
6. Componentes React recebem apenas props. Lógica de negócio fica em hooks ou casos de uso.
7. Nenhum texto menor que 13px no mobile. Touch targets mínimo 48x48px.
8. Cores de status: risk (#993C1D), ok (#3B6D11), warn (#854F0B), new (#185FA5). NUNCA vermelho puro.
9. Animações suaves (fade-up, gentle-pulse). Sem parallax pesado.
10. Testes unitários para domínio. Testes de integração para rotas críticas.

NEXT.JS 16 — ATENÇÃO:
- O arquivo de interceptação de requisões é `src/proxy.ts` (antigo `middleware.ts`).
- `proxy.ts` roda no Node.js runtime. Use para APIs apenas. NÃO redirecione páginas (o client-side cuida disso).
- Params de rotas dinâmicas são Promise. SEMPRE use await params.
- fetch() NÃO é cacheado por padrão. Declare cache explicitamente se necessário.
- Turbopack já vem ativado em dev (`next dev` não precisa de flag).

PERSONAS E RESTRIÇÕES:
- Bruno (líder): vê APENAS sua célula. Registra presença. Anota cuidado.
- Ana (supervisora): navega entre células. NÃO registra presença. Cobra líderes.
- Roberto (pastor): vê supervisores e padrões macro. Busca global. Não vê formulários no mobile.

ONDA ATUAL: [INFORMAR]
TAREFA ATUAL: [INFORMAR]
```

---

## 🗣️ Prompts Prontos por Onda

### Prompt Onda 0
```
Implemente a Onda 0 do Koinonia na pasta vazia atual.

IMPORTANTE: Use Next.js 16 (versão estável atual).
- Node.js mínimo: 20.x
- Turbopack é o bundler padrão em dev (next dev já usa automaticamente)
- Params de rotas dinâmicas são Promise (async/await)

Comando de instalação:
npx create-next-app@latest koinonia --typescript --tailwind --eslint --app --src-dir

Requisitos:
1. Crie o projeto Next.js 16 com App Router, TypeScript, Tailwind CSS.
2. Instale: prisma, @prisma/client, zod, react-hook-form, @hookform/resolvers,
   lucide-react, framer-motion, clsx, tailwind-merge, bcryptjs, jose,
   next-themes, @tanstack/react-query, vitest, @testing-library/react,
   @testing-library/jest-dom, jsdom, dotenv.
3. Configure Prisma com PostgreSQL. O DATABASE_URL está no arquivo .env
   na raiz do projeto. NÃO modifique o .env. O schema deve usar
   env("DATABASE_URL").
4. Crie o schema.prisma completo conforme o modelo fornecido no documento.
   Inclua @@index nos campos de filtro frequentes (churchId, groupId, personId,
   leaderId, supervisorId, eventTypeId, assigneeId, needId).
5. Crie prisma/seed.ts com dados fictícios: Igreja "Comunidade Esperança",
   Roberto (pastor), Ana (supervisora), Bruno (líder), 10 membros,
   3 células, 2 event types, 3 eventos com presenças variadas.
   IMPORTANTE: crie Membership também para os líderes e supervisores
   nas células que pertencem (senão eles não aparecem na lista de membros).
6. Configure tailwind.config.ts com o tema pastoral (cores, fonte Inter,
   animações). Não inclua ./src/pages/**/* no content (usamos App Router).
7. Crie src/lib/utils.ts (cn helper) e src/lib/prisma.ts (singleton).
8. Crie src/types/index.ts com tipos globais.
9. Crie .gitignore excluindo node_modules, .next, .env, *.log.
10. Gere a migration inicial e rode o seed.

O arquivo .env já existe na raiz com DATABASE_URL configurado.
NÃO exponha a connection string em nenhum arquivo do projeto.
```

### Prompt Onda 1
```
Implemente a Onda 1: Autenticação e Onboarding.

IMPORTANTE: Next.js 16 usa proxy.ts (antigo middleware.ts). Não crie middleware.ts.
Arquitetura de auth dual:
- APIs: src/proxy.ts valida Bearer token e injeta headers x-user-*.
- Páginas: src/app/(app)/layout.tsx (client component) verifica sessão e redireciona.

1. Crie src/lib/auth.ts com hash, verify, sign/verify JWT (access + refresh), extractBearerToken.
2. Crie src/lib/auth-storage.ts (localStorage para tokens) e src/lib/auth-service.ts (lógica de negócio).
3. Crie src/lib/api-response.ts (helpers padronizados de resposta HTTP).
4. Crie as API routes: POST /api/auth/login, POST /api/auth/logout (deleta refresh token do banco),
   POST /api/auth/refresh, GET /api/auth/me, POST /api/auth/onboarding.
   TODAS as rotas com body devem usar Zod para validação.
5. Crie src/proxy.ts (função proxy, matcher /api/:path*). Protege APIs, não redireciona páginas.
6. Crie a tela de login mobile-first com React Hook Form + Zod.
7. Crie a tela de onboarding (primeira igreja) com React Hook Form + Zod.
8. Crie src/hooks/use-auth.ts com useMe, useLogin, useLogout, useOnboarding, useStoredSessionState.
   useLogout deve chamar POST /api/auth/logout antes de limpar o localStorage.
9. Crie src/app/(app)/layout.tsx (client component) que protege páginas via useMe + redirect.
10. Crie o PersonaGuard que redireciona por role.
11. Escreva testes unitários em src/lib/auth.test.ts (hash, verify, JWT, bearer token).

Entregue: login funciona, refresh renova sessão, logout invalida no servidor,
F5 em páginas protegidas funciona, redirect por persona funciona, testes passam.
```

### Prompt Onda 3
```
Implemente a Onda 3: App Bruno — Visão e Membros.

IMPORTANTE: Next.js 16 — params é Promise. Exemplo:
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}

1. Crie o layout do líder com bottom nav (Visão, Membros, Eventos, Ações).
2. Crie o componente PulseCard com animação fade-up e delays escalonados.
3. Crie o componente MemberCard com avatar, badge de risco, nota curta.
4. Crie a tela /lider (Visão): saudação, pulse card, 3 membros urgentes.
5. Crie a tela /lider/membros: feed dividido em "Em risco", "Visitantes", "Regulares".
6. Crie a tela /lider/membros/[id]: perfil com timeline de presença (6 bolinhas) e histórico.
   Use await params para pegar o id.
7. Crie os hooks use-group-health e use-members.

Regra: Bruno vê SÓ sua célula. O backend filtra por groupId do líder logado.
Entregue: telas funcionando com dados reais, animações suaves, touch targets corretos.
```

---

## 📊 Checklist Final de Qualidade

Antes de considerar o Koinonia pronto, verifique:

- [ ] Roberto consegue abrir o app às 22h, no escuro, sem óculos, e entender o estado da igreja em 3 segundos
- [ ] A busca encontra "Cláudio" em < 2 segundos digitando "Clau"
- [ ] Bruno registra presença de 10 pessoas em < 30 segundos
- [ ] Ana cobra um líder em 2 toques
- [ ] O app funciona offline parcial (última tela acessada)
- [ ] O app instala na tela inicial do celular
- [ ] Dark mode não queima os olhos
- [ ] Nenhuma tela do mobile tem mais de 1 formulário com > 3 campos
- [ ] Nenhuma tabela é exibida no mobile (só cards e feeds)
- [ ] O sistema gera alertas automáticos quando alguém está sumindo

---

*Plano v2.1 — Koinonia Development Plan*
*Next.js 16 · Otimizado para desenvolvimento com IA · Uma onda por vez*
