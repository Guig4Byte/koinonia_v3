# Koinonia — Estado Atual do Projeto

> **Data:** 25/04/2026
> **Status:** MVP técnico em endurecimento
> **Fonte de verdade:** este documento + código atual + `prisma/schema.prisma`

---

## 1. Resumo executivo

O Koinonia é um PWA mobile-first para gestão pastoral de células/pequenos grupos.

O projeto já possui base funcional com:

- autenticação com access token e refresh token;
- papéis pastor, supervisor, leader, host e member;
- escopo por igreja;
- dashboards por persona;
- grupos/células;
- membros/pessoas;
- eventos e presença;
- tarefas;
- interações pastorais;
- risco pastoral `green | yellow | red`;
- auditoria;
- testes unitários e de integração.

A fase atual não deve priorizar novas telas grandes. A prioridade é manter a base consistente, segura e testável.

---

## 2. Stack atual

```txt
Next.js            16.2.4
React              19
TypeScript         strict
Tailwind CSS       3.x
Prisma             6.x
PostgreSQL         Neon/local PostgreSQL
TanStack Query     5.x
Vitest             4.x
next-pwa           geração de service worker no build
```

Scripts principais:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run pwa:clean
```

---

## 3. Estado atual por área

### 3.1 Autenticação

Estado vigente:

- access token fica apenas em memória no frontend;
- refresh token fica em cookie HttpOnly;
- login/onboarding enviam o refresh token via cookie, não no JSON público;
- refresh token é persistido como `tokenId` + `tokenHash`;
- refresh token é rotacionado;
- reutilização de refresh token revogado invalida sessões remanescentes do usuário;
- logout remove token do banco e limpa cookie;
- chamadas autenticadas usam `apiRequestWithAuth`.

Arquivos principais:

```txt
src/lib/auth.ts
src/lib/auth-service.ts
src/lib/auth-cookies.ts
src/lib/auth-storage.ts
src/lib/api-client.ts
src/app/api/auth/login/route.ts
src/app/api/auth/refresh/route.ts
src/app/api/auth/logout/route.ts
src/app/api/auth/me/route.ts
```

Ponto de atenção:

- access token em memória implica que reload depende do refresh via cookie para restaurar sessão.

---

### 3.2 Autorização

Estado vigente:

- existe matriz central em `src/lib/api-authorization.ts`;
- rotas de persona são separadas;
- endpoints sensíveis aplicam papel + contexto;
- pastor acessa dados ativos da própria igreja;
- supervisor acessa células supervisionadas por `supervisorUserId`;
- líder acessa célula liderada por `leaderUserId`;
- host/member acessam apenas o próprio perfil quando permitido;
- rota de busca global de pessoas é restrita ao pastor.

Arquivos principais:

```txt
src/lib/api-authorization.ts
src/lib/permissions.ts
src/app/api/_helpers/require-group-access.ts
src/app/api/members/[id]/route.ts
src/app/api/people/[id]/route.ts
src/app/api/interactions/route.ts
```

---

### 3.3 User vs Person

Decisão vigente:

- `User` é conta de login;
- `Person` é entidade pastoral;
- `Group.leaderUserId` aponta para `User.id`;
- `Group.supervisorUserId` aponta para `User.id`;
- esses campos têm relações Prisma explícitas com `User`.

Não usar em código novo:

```txt
leaderId
supervisorId
```

Usar:

```txt
leaderUserId
supervisorUserId
```

---

### 3.4 Banco e schema

Modelos centrais:

```txt
User
RefreshToken
Church
Person
Group
Membership
EventType
Event
Attendance
Interaction
Need
Task
RiskScore
Tag
PersonTag
ConsentLog
AuditLog
EventRecurrence
```

Regras importantes:

- `RiskLevel` é `green | yellow | red`;
- soft delete deve ser respeitado em leituras de pessoa, grupo, evento e task;
- `Membership.leftAt: null` indica vínculo ativo;
- `Event.occurredAt` indica evento realizado;
- registrar presença deve marcar `occurredAt` se ainda estiver vazio;
- presença não deve assumir todos como presentes por padrão.

Para desenvolvimento descartável:

```bash
npx prisma db push --force-reset
npx prisma generate
npm run db:seed
```

Para evolução versionada:

```bash
npm run db:migrate
```

---

### 3.5 Auditoria

Estado vigente:

- operações sensíveis usam `writeAuditLog` com `await`;
- audit log exige `churchId`;
- operações críticas devem falhar se a auditoria obrigatória falhar;
- algumas escritas sensíveis gravam operação + auditoria de forma transacional;
- testes verificam campos reais de auditoria em fluxos importantes.

Arquivo principal:

```txt
src/app/api/_helpers/audit-log.ts
```

---

### 3.6 PWA e cache

Estado vigente:

- `/api/*` não deve ser cacheado pelo service worker;
- rotas `/api/:path*` recebem `Cache-Control: no-store`;
- `cacheStartUrl`/`dynamicStartUrl` não devem introduzir cache indevido de sessão;
- artefatos `public/sw.js` e `public/workbox-*.js` são gerados e devem ser limpos quando necessário.

Arquivos principais:

```txt
next.config.mjs
scripts/clean-pwa-artifacts.mjs
public/manifest.json
```

Comando útil:

```bash
npm run pwa:clean
```

---

### 3.7 Dashboards e services

Estado vigente:

- cálculo principal do dashboard foi extraído de route handlers;
- existe service de dashboard em `src/app/api/_services/dashboard.service.ts`;
- `buildDashboard` permanece em domínio/use-case;
- routes devem continuar finas: autenticação, autorização, chamada de service e resposta.

Arquivos principais:

```txt
src/app/api/_services/dashboard.service.ts
src/domain/use-cases/dashboard/build-dashboard.use-case.ts
src/app/api/pastor/dashboard/route.ts
src/app/api/supervisor/dashboard/route.ts
```

---

### 3.8 Presença e eventos

Estado vigente:

- presença rejeita pessoa fora do grupo do evento;
- presença rejeita duplicidade no payload;
- tela de presença usa três estados: presente, ausente e não marcado;
- salvar presença exige que todos estejam marcados;
- registro de presença marca o evento como realizado em `occurredAt` quando necessário.

Arquivos principais:

```txt
src/domain/use-cases/attendance/register-attendance.use-case.ts
src/app/api/_repositories/attendance.prisma-repository.ts
src/app/(app)/lider/eventos/[id]/presenca/page.tsx
```

---

### 3.9 Tarefas

Estado vigente:

A criação de task valida:

- grupo ativo da igreja;
- supervisor restrito ao grupo supervisionado;
- `assigneeId` ativo e da mesma igreja;
- `assigneeId` deve ser líder ou supervisor do grupo;
- `targetType = person` exige pessoa ativa e membro ativo do grupo;
- `targetType = group` exige `targetId === groupId`;
- `targetType = leader` exige `targetId === group.leaderUserId`.

Arquivo principal:

```txt
src/app/api/tasks/route.ts
```

---

### 3.10 Testes

Estado vigente:

Há testes unitários e de integração cobrindo partes sensíveis, incluindo:

- auth, senha, refresh e reutilização de token;
- rate limit;
- autorização por papel;
- cross-church access;
- perfil de pessoa/membro por contexto;
- interações pastorais;
- tasks válidas e inválidas;
- presença;
- auditoria;
- matriz de autorização.

Comandos:

```bash
npm run typecheck
npm test
npm run build
```

---

## 4. Rotas principais

### Auth

```txt
/api/auth/login
/api/auth/logout
/api/auth/me
/api/auth/onboarding
/api/auth/refresh
```

### Pastor

```txt
/api/pastor/dashboard
/api/pastor/search
/api/pastor/supervisors
/api/pastor/supervisors/[id]
```

### Supervisor

```txt
/api/supervisor/dashboard
/api/supervisor/groups
/api/supervisor/groups/[id]
```

### Líder

```txt
/api/leader/dashboard
/api/leader/events
/api/leader/events/[id]/attendance
/api/leader/members
/api/leader/members/[id]
/api/leader/tasks
```

### Compartilhadas

```txt
/api/members/[id]
/api/people
/api/people/[id]
/api/tasks
/api/tasks/[id]
/api/interactions
/api/events/[id]
/api/events/[id]/attendance
/api/groups/[id]
/api/groups/[id]/health
```

---

## 5. Seed atual

Usuários principais:

```txt
roberto@comunidadeesperanca.org  pastor
ana@comunidadeesperanca.org      supervisor
bruno@comunidadeesperanca.org    leader
```

Senha comum:

```txt
koinonia123
```

---

## 6. Riscos ainda conhecidos

Mesmo com a base endurecida, ainda não tratar como produção real sem validar:

1. deploy completo em ambiente alvo;
2. configuração real de cookies em HTTPS;
3. política LGPD completa;
4. retenção/anonimização de dados;
5. observabilidade/logs de produção;
6. backup/restore do banco;
7. revisão de acessibilidade mobile;
8. performance de dashboards com volume maior;
9. revisão manual final das rotas com dados sensíveis.

---

## 7. Regras para próximas alterações

Não avançar funcionalidade grande antes de manter:

- `npm run typecheck` verde;
- `npm test` verde;
- `npm run build` verde;
- documentação atualizada quando decisão estrutural mudar;
- seed compatível com schema atual;
- nenhum retorno de `passwordHash`, refresh token ou dados fora de escopo.

---

## 8. Documentos históricos

Os documentos abaixo são úteis para visão e planejamento, mas podem conter termos/decisões antigas:

```txt
docs/Koinonia.txt
docs/Perfil.txt
docs/koinonia-plano-completo-v2.1.md
docs/koinonia-plano-completo-v2.2.md
docs/koinonia-plano-completo-v2.3.md
docs/koinonia-plano-completo-v2.4.md
docs/koinonia-plano-completo-v2.5.md
docs/koinonia_v2_hierarquia.html
```

Eles não devem ser usados como fonte única para implementar código novo.
