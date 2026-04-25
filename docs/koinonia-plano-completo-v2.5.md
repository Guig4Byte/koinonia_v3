# Koinonia — Plano de Desenvolvimento por Ondas
> **Versão 2.5** · Next.js 16 · TypeScript Strict · PWA · UX Pastoral · AI-Ready · LGPD-First
>
> **Nota de replanejamento (v2.5):** Planos v2.1–v2.4 foram executados. Onda 5 concluída com a adição da tela compartilhada de perfil de membro. Próxima parada: Onda 6 (Motor de Risco).

---

## 📋 Leia antes de começar

Este documento foi reescrito para ser **executado por Inteligência Artificial**.
Cada onda é um **contrato de entrega**: a IA deve implementar exatamente o que está escrito, testar, e só então avançar.

**Regra de ouro:** Nunca peça para a IA implementar duas ondas ao mesmo tempo. Uma onda por sessão.

**Regra técnica:** Este plano usa **Next.js 16** (versão estável atual). Não use Next.js 14.

---

## 🎯 Visão Consolidada

O Koinonia é um **PWA (Progressive Web App)** de gestão de células para igrejas.
Não é um app nativo. É um site que funciona como app: instala na tela inicial, funciona offline parcialmente, e entrega notificações push.

**A experiência central:** O pastor Roberto (52 anos) abre o celular às 22h, sem óculos, no escuro. Em 3 segundos ele sabe se a igreja está bem ou se alguém precisa dele. Em 5 segundos ele encontra qualquer pessoa pelo nome. Em 1 toque ele registra que orou por alguém.

**Três personas, três visões:**
- **Bruno (Líder):** Vê SÓ sua célula. Registra presença. Anota cuidados.
- **Ana (Supervisora):** Navega entre células. NÃO registra presença. Cobra líderes.
- **Roberto (Pastor):** Vê padrões macro. Busca global. Não vê formulários.

**Princípio LGPD-First:** Dados de fé, religião e anotações pastorais são dados sensíveis. Consentimento explícito, minimização de dados e auditoria de acesso são obrigatórios desde o MVP.

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
Frontend (Web + Mobile)  → Next.js 16.2.4 (App Router) + React Server Components
Bundler dev              → Turbopack (padrão no Next.js 16)
Bundler prod             → Webpack (next-pwa requer webpack)
Estilos                  → Tailwind CSS + variáveis CSS manuais
Animações                → Framer Motion (quando necessário)
Ícones                   → Lucide React
Fonte                    → Inter (Google Fonts)
Query/Cache              → TanStack Query (React Query)
Formulários              → React Hook Form + Zod
Backend/API              → Next.js Route Handlers (API Routes)
ORM                      → Prisma 6
Banco                    → PostgreSQL (Neon)
Auth                     → JWT (jose) + bcryptjs + Refresh Token
Validação                → Zod (100% dos inputs)
Testes                   → Vitest + jsdom + Testing Library
Deploy                   → Vercel (frontend) + Neon (PostgreSQL)
PWA                      → next-pwa (manifest, service worker, ícones)
```

**Requisito de ambiente:**
- **Node.js 20 LTS ou superior**
- **npm 10+**

---

## ⚠️ Breaking Changes do Next.js 16

### 1. Params de rotas dinâmicas são Promise (async)
Em rotas com `[id]`, `params` agora é uma **Promise**. Sempre use `await`.

```typescript
// ❌ ERRADO (era assim no Next.js 14)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// ✅ CORRETO (Next.js 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>{id}</div>
}
```

### 2. Middleware renomeado para Proxy
O arquivo é `src/proxy.ts` com `export async function proxy()`.
NUNCA use `src/middleware.ts` — não funciona no Next.js 16.

### 3. Turbopack por padrão em dev
`npm run dev` usa Turbopack. `npm run build` usa Webpack (por causa do next-pwa).

---

## 🗺️ Roadmap por Ondas (v2.5)

| # | Onda | Status | Descrição |
|---|------|--------|-----------|
| 0 | Fundação | ✅ Concluída | Config, Prisma, Tailwind, PWA base |
| 1 | Autenticação | ✅ Concluída | Login, onboarding, JWT, proxy |
| 2 | Domínio Core | ✅ Concluída | Entidades, repositórios, use cases |
| 2.5 | Schema Evolution | ✅ Concluída | Tag, PersonTag, EventRecurrence, ConsentLog, AuditLog |
| 3 | App Bruno (Líder) | ✅ Concluída | Visão, Membros, Perfil, Eventos, Presença, Ações, Tema, Search |
| 4 | App Roberto (Pastor) | ✅ Concluída | Visão macro, Alertas automáticos, Busca global |
| 5 | App Roberto + Ana | ✅ Concluída | Equipe do pastor + Visão da supervisora + Células + Acompanhar |
| 5.5 | Perfil Compartilhado | ✅ Concluída | Tela `/membro/[id]` read-only acessível por todos os papéis |
| **6** | **Motor de Risco v1** | **🎯 PRÓXIMA** | **Scoring por regras (faltas, contato, etc.)** |
| 7 | Playbooks + Polish | Pendente | Tasks automáticas, swipe "Orei", toast de oração |
| 8 | Analytics | Pendente | Dashboard desktop, gráficos, exportação CSV |
| 9 | PWA e Publicação | Pendente | App instalável, offline básico, Vercel |
| 10 | Recorrência | Pendente | Eventos recorrentes, job de geração |
| 11 | Notificações | Pendente | Push, email semanal |
| 12 | QR Check-in | Pendente | QR code por evento, geolocalização |

**Prioridade estratégica:** Pastor (quem decide) > Supervisora (quem cobra) > Motor de Risco > Playbooks automáticos

---

## ✅ Ondas Concluídas (Resumo)

### 🌊 Onda 0 — Fundação
- Prisma schema completo
- Tailwind + CSS variables
- PWA base (next-pwa, manifest)
- Vitest configurado

### 🌊 Onda 1 — Autenticação
- Login JWT (jose + bcryptjs)
- Refresh token rotation
- Onboarding com church selection
- Proxy (`src/proxy.ts`) injetando headers

### 🌊 Onda 2 — Domínio Core
- Entidades: Person, Group, Event, Attendance, Interaction, Task, etc.
- Use cases com testes unitários
- Repositórios Prisma

### 🌊 Onda 2.5 — Schema Evolution
- Tag, PersonTag, EventRecurrence, ConsentLog, AuditLog
- Migrações aplicadas

### 🌊 Onda 3 — App Bruno (Líder)
- Layout com BottomNav e RoleGuard
- Tema claro/escuro manual
- Dashboard `/lider` com PulseCard
- Feed de membros `/lider/membros` (Em risco, Visitantes, Regulares)
- Perfil do membro `/lider/membros/[id]` com timeline de presença e interações
- Eventos `/lider/eventos` + registro de presença `/lider/eventos/[id]/presenca`
- Ações `/lider/acoes` (tasks do líder)
- Search de membros

### 🌊 Onda 4 — App Roberto (Pastor)
- Layout com BottomNav customizado (Visão, Células, Busca, Equipe)
- Dashboard `/pastor` com summary cards, alertas, lista de células
- Busca global `/pastor/busca` (pessoas, grupos, eventos)
- APIs: `/api/pastor/dashboard`, `/api/pastor/search`

### 🌊 Onda 5 — App Roberto + Ana

**Etapa 1 (Pastor):**
- `/pastor/equipe` — Cards de supervisores com métricas
- `/pastor/equipe/[id]` — Perfil do supervisor com células e tasks atrasadas
- APIs: `/api/pastor/supervisors`, `/api/pastor/supervisors/[id]`

**Etapa 2 (Supervisor):**
- `/supervisor` — Dashboard scoped ao `supervisorId`
- `/supervisor/layout.tsx` com BottomNav + RoleGuard
- API: `/api/supervisor/dashboard`

**Etapa 3 (Supervisor):**
- `/supervisor/celulas` — Lista de células com gradiente, listra decorativa, estado visual
- `/supervisor/celulas/[id]` — Detalhe da célula com membros, eventos, tasks do líder, botão "Acompanhar"
- Botão "Acompanhar [Líder]" cria task para o líder
- APIs: `/api/supervisor/groups`, `/api/supervisor/groups/[id]`, `POST /api/tasks`

### 🌊 Onda 5.5 — Perfil Compartilhado (Quick Fix)
- **Motivação:** Links de supervisor/pastor apontavam para `/lider/membros/[id]` que é bloqueado por RoleGuard
- **Solução:** Tela compartilhada `/membro/[id]` acessível por todos os papéis
- **API:** `GET /api/members/[id]` — church-scoped, retorna dados básicos + presença + interações + risk score
- **UI:** Header com avatar/nome, dados básicos, presença (últimos 6), interações recentes
- **Hook:** `useSharedMemberProfile` com autenticação via Bearer token
- **Links atualizados:** Todas as telas agora apontam para `/membro/[id]`
- **Redirecionamento:** `/lider/membros/[id]` redireciona para `/membro/[id]`
- **Botão voltar:** Adicionado em telas de detalhe (`/supervisor/celulas/[id]`, `/pastor/equipe/[id]`)
- **Melhoria visual:** Cards de célula com gradiente sutil, listra decorativa, cores de estado

---

## 🎯 Onda 6 — Motor de Risco v1 (Scoring por Regras)

**Objetivo:** Calcular risco de TODOS os membros ativos. Sem job automático ainda — cálculo sob demanda.

**Tarefas:**
1. Criar `src/domain/use-cases/risk/calculate-risk-score.ts`:
   - Regras: faltas consecutivas (-15 cada), dias sem contato do líder (-10), novo membro 30 dias sem interação (-20)
   - Retorna score (0-100) + level (green/yellow/red) + reasons
2. Criar API `GET /api/people/[id]/risk`:
   - Retorna score atual + reasons
3. Atualizar telas para usar RiskScore:
   - MemberCard mostra badge baseado no level
   - PulseCard mostra contagem de "em risco"
4. Criar testes unitários para `calculateRiskScore` (100% cobertura)

**Contrato de Entrega:**
- [ ] Função `calculateRiskScore` com 100% de cobertura de testes
- [ ] API retorna score + reasons
- [ ] Telas usam o score para badges e contagem

---

## 🌊 Onda 7 — Playbooks Automáticos + Polish UX

**Objetivo:** O sistema detecta problemas e propõe ações automaticamente. A aba "Ações" finalmente brilha.

**Tarefas:**
1. Criar job `src/app/api/jobs/risk-calculator/route.ts`:
   - Roda via cron (Vercel Cron), protegido por `CRON_SECRET`
   - Calcula score de todos os membros ativos diariamente
2. Criar playbooks automáticos:
   | Gatilho | Ação |
   |---|---|
   | Score vermelho + sem task aberta | Cria task para o líder (48h) |
   | 21 dias sem contato | Cria task de cobrança para supervisor |
   | Novo membro 30 dias sem interação | Alerta na tela do líder |
   | Líder com 3+ tasks vencidas | Alerta na tela do supervisor |
3. Criar APIs de alertas:
   - `GET /api/pastor/alerts`
   - `GET /api/leader/alerts`
   - `GET /api/supervisor/alerts`
4. Criar `src/components/features/prayer-toast.tsx`:
   - Toast central: "Oração registrada" 🙏
5. Refinar micro-interações:
   - Swipe "Orei" no MemberCard (vibração leve + toast)
   - Empty states ilustrados
   - Animações de entrada suaves em todas as telas

**Contrato de Entrega:**
- [ ] Job calcula scores diariamente
- [ ] Playbooks geram tasks automaticamente
- [ ] Alertas aparecem nas telas corretas
- [ ] Anotação rápida em < 3 toques
- [ ] Toast de oração funciona
- [ ] Testes de integração: ausência → score → alerta → task

---

## 🌊 Onda 8 — Analytics e Relatórios

**Objetivo:** Dashboards web desktop, tendências, exportação.

**Tarefas:**
1. Criar rotas web desktop (`/admin/dashboard`):
   - Layout desktop (sidebar + conteúdo)
   - Gráficos de presença ao longo do tempo
   - Tendências por célula e por tipo de evento
2. Criar API `GET /api/analytics/attendance-trends`
3. Exportação CSV/PDF (biblioteca leve)

**Contrato de Entrega:**
- [ ] Dashboard desktop funciona
- [ ] Exportação CSV funciona
- [ ] Gráficos mostram tendências reais

---

## 🌊 Onda 9 — PWA e Publicação

**Objetivo:** App instalável, offline básico, publicação.

**Tarefas:**
1. Configurar `next-pwa` com ícones e manifest (parcialmente feito)
2. Estratégia de cache offline para dados críticos
3. Testar instalação em iOS e Android
4. Publicar na Vercel

**Contrato de Entrega:**
- [ ] App instala na tela inicial
- [ ] Funciona offline para leitura
- [ ] Publicado e acessível

---

## 🌊 Onda 10 — Recorrência de Eventos

**Objetivo:** Permitir que o líder crie eventos recorrentes ("toda quinta, 20h").

**Tarefas:**
1. Criar API `POST /api/event-recurrences`
2. Criar API `POST /api/jobs/generate-events` (CRON_SECRET)
3. Atualizar tela de eventos com badge "Recorrente"

**Contrato de Entrega:**
- [ ] Líder cria regra de recorrência
- [ ] Job gera eventos automaticamente
- [ ] Sem duplicatas

---

## 🌊 Onda 11 — Notificações Push e Email

**Objetivo:** Alertas proativos para o pastor e supervisora.

**Tarefas:**
1. Configurar VAPID keys para Push API
2. Criar serviço de notificação:
   - "Esperança: 0% de presença esta semana"
   - "Cláudio está em risco há 7 dias"
3. Configurar envio de email (Resend/Postmark):
   - Relatório semanal para o pastor
   - Alerta de task vencida

**Contrato de Entrega:**
- [ ] Push notification funciona no mobile
- [ ] Email semanal enviado com resumo

---

## 🌊 Onda 12 — Check-in com QR e Geolocalização

**Objetivo:** Membro marca presença sozinho via QR code.

**Tarefas:**
1. Gerar QR code por evento
2. Validação de proximidade (geofence simples)
3. API `POST /api/attendance/check-in`

**Contrato de Entrega:**
- [ ] QR code gera por evento
- [ ] Membro escaneia e registra presença
- [ ] Valálidação de proximidade funciona

---

## 📁 Decisões Documentadas

### Busca accent-insensitive
- PostgreSQL `ILIKE` não faz unaccent (ex: "esperanca" não encontra "Esperança")
- Solução futura: usar extensão `unaccent` do PostgreSQL ou normalizar no client
- Status: **Limitação conhecida**, não bloqueante para o MVP

### Tela compartilhada de perfil
- `/membro/[id]` é a rota única para visualização de perfil
- Todas as personas (pastor, supervisor, líder) usam a mesma rota
- Modo leitura — sem ações de edição
- Ações futuras a discutir: "Registrar interação" (todos), "Criar tarefa" (pastor/supervisor)

### Task auto-completion
- Quando Bruno registra presença, a task da Ana não auto-fecha
- Intencionalmente adiado — será resolvido na Onda 7 (Playbooks)

---

> **Fim do plano v2.5** — Koinonia — Cuidado pastoral em suas mãos.
