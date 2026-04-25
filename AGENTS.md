# Koinonia — Instruções para Agentes de IA

> **Projeto:** Koinonia v2.5 — PWA de gestão de células para igrejas
> **Stack:** Next.js 16.2.4 + React 19 + TypeScript Strict + Tailwind CSS + Prisma 6 + PostgreSQL
> **Data da última atualização:** 24/04/2026

---

## 🧭 Princípios de Desenvolvimento

Regras não negociáveis para todo código escrito neste projeto:

1. **Clareza > esperteza** — Código que outro dev entende em 10 segundos é melhor que código "genial" que demora 5 minutos.
2. **Funções com uma única responsabilidade** — Uma função faz uma coisa. Se o nome precisa de "e", é duas funções.
3. **Não repetir código (DRY)** — Se repete 3 vezes, extrai. Se repete 2 vezes, avalia.
4. **Simplicidade sempre (KISS)** — A solução mais simples que funciona é a correta.
5. **Não antecipar necessidade (YAGNI)** — Não constrói para um futuro hipotético. Constrói para o problema de hoje.
6. **Baixo acoplamento, alta coesão** — Módulos devem ser independentes. Componentes devem ser focados.
7. **Nomes claros e do domínio** — `registerAttendance` > `handleClick`. `MemberCard` > `ItemComponent`.
8. **Código fácil de testar** — Se é difícil de testar, está mal projetado.
9. **Comportamento previsível** — Mesma entrada, mesma saída. Sem surpresas laterais.
10. **Refatorar só quando agrega valor** — Não muda código que funciona só por estética. Muda quando adiciona clareza, performance ou remove duplicação.

**Protocolo de execução por etapa:**
- Uma etapa por vez. Terminou, revalida (build + typecheck + tests).
- Revisou o que fez. Perguntou ao usuário se está bom.
- Só então passa para a próxima.

---

## 🏗️ Stack Definitiva

```
Frontend (Web + Mobile)  → Next.js 16.2.4 (App Router) + React 19
Bundler dev              → Turbopack (npm run dev)
Bundler prod             → Webpack (next-pwa requer webpack)
Estilos                  → Tailwind CSS + variáveis CSS manuais
Ícones                   → Lucide React
Query/Cache              → TanStack Query
Formulários              → React Hook Form + Zod
Backend/API              → Next.js Route Handlers (API Routes)
ORM                      → Prisma 6
Banco                    → PostgreSQL (Neon)
Auth                     → JWT (jose) + bcryptjs + Refresh Token
Testes                   → Vitest + jsdom + Testing Library
Deploy                   → Vercel + Neon
PWA                      → next-pwa
```

**Requisito de ambiente:** Node.js 20 LTS+, npm 10+

---

## ⚠️ Decisões Arquiteturais Críticas

### Tema / Dark Mode
- **Manual (sem `next-themes`)** — Script inline no `<head>` aplica classe `dark` antes do render
- Variáveis CSS em `:root` e `.dark` — nunca use `dark:` prefix do Tailwind em novos componentes
- Cores sensíveis: `bg`, `card`, `text`, `border` são nomes reservados do Tailwind — usar `bg-[var(--bg)]`, `text-[var(--text-primary)]`

### Auth / Proxy (Next.js 16)
- **File MUST be `src/proxy.ts`** com `export async function proxy()` — Next.js 16 renomeou `middleware.ts` para `proxy.ts`
- JWT em localStorage (access + refresh tokens)
- Proxy injeta headers: `x-user-id`, `x-user-role`, `x-person-id`, `x-church-id`
- `useLogin` faz redirect por role: pastor→`/pastor`, supervisor→`/supervisor`, leader→`/lider`

### Banco de Dados
- Prisma + PostgreSQL (Neon)
- **Nunca** rode `prisma migrate dev` sem confirmar com o usuário
- Seed: `npx prisma db seed` — cria 3 usuários (senha: `koinonia123`)
- Dados de seed: Roberto=pastor, Ana=supervisor, Bruno=leader, 3 grupos, 10 membros

### APIs
- Todas as APIs de `/api/*` (exceto `/api/auth/*`) passam pelo proxy
- Permission guards: `requireGroupAccess`, `requireEventAccess`
- Audit logging: `writeAuditLog()` em todas as operações sensíveis
- **Church scoping obrigatório** em todas as queries de dados

### Testes
- Vitest + jsdom (32 tests passando)
- **Sempre rode** `npm run build`, `npx vitest run` antes de considerar uma etapa concluída

---

## 🗂️ Estrutura de Pastas Relevante

```
src/
  app/
    (app)/           # Rotas autenticadas (lider, pastor, supervisor, membro)
    (auth)/          # Login, onboarding
    api/             # API Routes
      leader/        # APIs do líder (dashboard, members, events, tasks)
      pastor/        # APIs do pastor (dashboard, search, supervisors)
      supervisor/    # APIs da supervisora (dashboard, groups)
      members/       # API compartilhada de perfil de membro (read-only)
      tasks/         # APIs de tasks
  components/
    features/        # Componentes de domínio (MemberCard, PulseCard, RiskBadge)
    layout/          # BottomNav, ThemeProvider, RoleGuard
    pastor/          # Componentes do pastor (SummaryCard, AlertCard, GroupCard)
  hooks/             # TanStack Query hooks (use-auth, use-leader-dashboard, etc.)
  domain/            # Lógica pura (entities, repositories, use-cases)
  lib/               # Utilitários (prisma, api-client, auth, etc.)
```

**Rotas de persona:**
- `/lider/*` — App do líder (Bruno)
- `/pastor/*` — App do pastor (Roberto)
- `/supervisor/*` — App da supervisora (Ana)
- `/membro/[id]` — Tela compartilhada de perfil (acessível por todos os papéis)

---

## 🎨 Sistema de Cores (via CSS Variables)

Nunca use cores fixas do Tailwind (`text-stone-800`, `bg-white`) em novos componentes. Sempre use as variáveis CSS:

```css
/* Fundos */
--bg, --card, --surface

/* Textos */
--text-primary, --text-secondary, --text-muted

/* Status */
--risk, --risk-bg  |  --warn, --warn-bg  |  --ok, --ok-bg  |  --new, --new-bg

/* Acento */
--accent, --accent-light

/* Input / Bordas */
--input-bg, --input-border, --border, --border-light

/* Pulse Card (escuro) */
--pulse-card-bg
```

---

## 🔐 Regras de Segurança

- Nunca exponha `passwordHash` em nenhuma API
- `AuditLog` registra TODAS as leituras e escritas em dados sensíveis
- Pastor vê tudo. Supervisora vê suas células. Líder vê SÓ sua célula.
- Sempre validar `churchId` antes de retornar dados
- **CRITICAL FIX aplicado:** `leaderId` é `User.id`, não `Person.id`. Todas as APIs de permissão já foram corrigidas.
- `RoleGuard` em todos os layouts de persona — redireciona não-autorizados

---

## 📝 Convenções de Código

- **TypeScript strict:** `strict: true`, `exactOptionalPropertyTypes: true`
- **Params é Promise** no Next.js 16: `async function Page({ params }: { params: Promise<{ id: string }> })`
- **Hooks:** prefixo `use-`, TanStack Query com invalidação de cache (`queryClient.clear()` no login/logout)
- **APIs:** `route.ts` com try/catch, `domainErrorResponse` para erros conhecidos
- **Componentes:** `export function Nome()` (não default, exceto pages)
- **Requisições autenticadas:** Todas as chamadas de API devem incluir `Authorization: Bearer <token>` via `getStoredAccessToken()`

---

## 🚨 Checklist antes de entregar

- [ ] `npm run build` passa com zero warnings
- [ ] `npx vitest run` passa (32 tests)
- [ ] TypeScript sem erros
- [ ] Não quebrou nenhuma tela existente
- [ ] Novos links apontam para rotas corretas

---

> **Quando em dúvida:** pergunte ao usuário. Não suponha. Clareza > esperteza.
