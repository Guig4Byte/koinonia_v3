# Koinonia — Instruções para Agentes de IA

> **Projeto:** Koinonia v2.4 — PWA de gestão de células para igrejas
> **Stack:** Next.js 16 + React 19 + TypeScript Strict + Tailwind CSS + Prisma + PostgreSQL
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

## 🏗️ Decisões Arquiteturais Críticas

### Tema / Dark Mode
- **Manual (sem `next-themes`)** — Script inline no `<head>` aplica classe `dark` antes do render
- Variáveis CSS em `:root` e `.dark` — nunca use `dark:` prefix do Tailwind em novos componentes
- Cores sensíveis: `bg`, `card`, `text`, `border` são nomes reservados do Tailwind — usar `bg-[var(--bg)]`, `text-[var(--text-primary)]`

### Auth / Proxy (Next.js 16)
- **File MUST be `src/proxy.ts`** com `export async function proxy()` — Next.js 16 renomeou `middleware.ts` para `proxy.ts`
- JWT em localStorage (access + refresh tokens)
- Proxy injeta headers: `x-user-id`, `x-user-role`, `x-person-id`, `x-church-id`

### Banco de Dados
- Prisma + PostgreSQL (Neon)
- **Nunca** rode `prisma migrate dev` sem confirmar com o usuário
- Seed: `npx prisma db seed` — cria 3 usuários (senha: `koinonia123`)

### APIs
- Todas as APIs de `/api/*` (exceto `/api/auth/*`) passam pelo proxy
- Permission guards: `requireGroupAccess`, `requireEventAccess`
- Audit logging: `writeAuditLog()` em todas as operações sensíveis

### Testes
- Vitest + jsdom (32 tests passando)
- **Sempre rode** `npm run typecheck`, `npm run build`, `npx vitest run` antes de considerar uma etapa concluída

---

## 🌊 Roadmap por Ondas (v2.4)

| # | Onda | Status | Descrição |
|---|------|--------|-----------|
| ✅ 0 | Fundação | Concluída | Config, Prisma, Tailwind, PWA base |
| ✅ 1 | Autenticação | Concluída | Login, onboarding, JWT, proxy |
| ✅ 2 | Domínio Core | Concluída | Entidades, repositórios, use cases |
| ✅ 2.5 | Schema Evolution | Concluída | Tag, PersonTag, EventRecurrence, ConsentLog, AuditLog |
| ✅ 3 | App Bruno (Líder) | **Concluída** | Visão, Membros, Perfil, Eventos, Presença, Ações, Tema, Search |
| ✅ 4 | App Roberto (Pastor) | Concluída | Visão macro, Alertas automáticos, Busca global |
| ⏳ 5 | App Roberto + Ana | Pendente | Equipe do pastor + Visão da supervisora |
| ⏳ 6 | Motor de Risco v1 | Pendente | Scoring por regras (faltas, contato, etc.) |
| ⏳ 7 | Playbooks + Polish | Pendente | Tasks automáticas, swipe "Orei", toast de oração |
| ⏳ 8 | Analytics | Pendente | Dashboard desktop, gráficos, exportação CSV |
| ⏳ 9 | PWA e Publicação | Pendente | App instalável, offline básico, Vercel |
| ⏳ 10 | Recorrência | Pendente | Eventos recorrentes, job de geração |
| ⏳ 11 | Notificações | Pendente | Push, email semanal |
| ⏳ 12 | QR Check-in | Pendente | QR code por evento, geolocalização |

**Prioridade estratégica:** Pastor (quem decide) → Supervisora (quem cobra) → Motor de Risco → Playbooks automáticos

---

## 📁 Estrutura de Pastas Relevante

```
src/
  app/
    (app)/           # Rotas autenticadas (lider, pastor, supervisor)
    (auth)/          # Login, onboarding
    api/             # API Routes
      leader/        # APIs do líder (dashboard, members, events, tasks)
      pastor/        # APIs do pastor (dashboard, search)
      tasks/         # APIs de tasks (PATCH para completar)
  components/
    features/        # Componentes de domínio (MemberCard, PulseCard, RiskBadge)
    layout/          # BottomNav, ThemeProvider
    pastor/          # Componentes do pastor (SummaryCard, AlertCard, GroupCard)
  hooks/             # TanStack Query hooks (use-auth, use-leader-dashboard, use-pastor-dashboard, use-pastor-search)
  domain/            # Lógica pura (entities, repositories, use-cases)
```

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
- Sempre validar `groupId` pertence ao usuário logado antes de retornar dados

---

## 📝 Convenções de Código

- **TypeScript strict:** `strict: true`, `exactOptionalPropertyTypes: true`
- **Params é Promise** no Next.js 16: `async function Page({ params }: { params: Promise<{ id: string }> })`
- **Hooks:** prefixo `use-`, TanStack Query com invalidação de cache
- **APIs:** `route.ts` com try/catch, `domainErrorResponse` para erros conhecidos
- **Componentes:** `export function Nome()` (não default, exceto pages)

---

> **Quando em dúvida:** pergunte ao usuário. Não suponha. Clareza > esperteza.
