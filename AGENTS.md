# Koinonia — Instruções para Agentes de IA

> **Projeto:** Koinonia — PWA de gestão pastoral de células para igrejas
> **Stack:** Next.js 16.2.4 + React 19 + TypeScript Strict + Tailwind CSS + Prisma 6 + PostgreSQL
> **Documento oficial de estado:** [`docs/estado-atual-do-projeto.md`](docs/estado-atual-do-projeto.md)
> **Última revisão documental:** 25/04/2026

---

## 1. Fonte de verdade

Antes de qualquer alteração, leia:

1. `docs/estado-atual-do-projeto.md`
2. `prisma/schema.prisma`
3. O arquivo/rota/hook/teste diretamente envolvido na tarefa

Os documentos antigos em `docs/koinonia-plano-completo-v*.md`, `docs/Koinonia.txt` e `docs/Perfil.txt` são referência histórica/de produto. Eles **não** substituem o estado atual nem o código real.

Quando houver divergência:

```txt
Código atual + schema.prisma + docs/estado-atual-do-projeto.md > planos antigos
```

---

## 2. Princípios de desenvolvimento

1. **Clareza > esperteza** — código legível vence solução “genial”.
2. **Uma responsabilidade por função** — se o nome precisa de “e”, provavelmente são duas funções.
3. **DRY com bom senso** — extraia repetição real, não crie abstração prematura.
4. **Simplicidade sempre** — resolva o problema de hoje com a menor superfície segura.
5. **YAGNI** — não implemente futuro hipotético.
6. **Baixo acoplamento, alta coesão** — domínio, API e UI devem ter limites claros.
7. **Nomes do domínio** — prefira nomes pastorais e explícitos.
8. **Código testável** — regra sensível precisa ser coberta por teste.
9. **Comportamento previsível** — sem efeitos colaterais ocultos.
10. **Refatore só com ganho real** — clareza, segurança, consistência ou remoção de duplicação.

Protocolo por etapa:

```txt
alterar pouco -> validar -> revisar -> só então avançar
```

---

## 3. Stack atual

```txt
Frontend                Next.js 16.2.4 + React 19 + App Router
Dev bundler             Turbopack
Prod build              Webpack, por causa do next-pwa
Estilos                 Tailwind CSS + variáveis CSS
Ícones                  Lucide React
Query/cache             TanStack Query
Formulários             React Hook Form + Zod
Backend/API             Next.js Route Handlers
ORM                     Prisma 6
Banco                   PostgreSQL / Neon
Auth                    JWT access token + refresh token em cookie HttpOnly
Senha                   bcryptjs
Testes                  Vitest + jsdom + Testing Library
PWA                     next-pwa, sem cache de respostas de API
```

Requisito recomendado: Node.js 20 LTS+ e npm 10+.

---

## 4. Autenticação e sessão

Estado atual correto:

- Access token fica **apenas em memória** no frontend.
- Refresh token fica em cookie **HttpOnly**.
- Cookie de refresh usa `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.
- Refresh token é persistido no banco por `tokenId` + `tokenHash`.
- Refresh token é rotacionado.
- Reutilização de refresh token revogado deve invalidar sessões remanescentes do usuário.
- Chamadas autenticadas no frontend devem usar `apiRequestWithAuth`.
- Não reintroduza `refreshToken` no `localStorage`.
- Não crie header manual `Authorization` em tela/hook comum; centralize no `api-client`.

Arquivos relevantes:

```txt
src/lib/auth.ts
src/lib/auth-service.ts
src/lib/auth-cookies.ts
src/lib/auth-storage.ts
src/lib/api-client.ts
src/app/api/auth/*
```

---

## 5. Autorização

Existe matriz explícita em:

```txt
src/lib/api-authorization.ts
```

Regras de escopo:

- Pastor: vê dados ativos da própria igreja.
- Supervisor: vê células supervisionadas por `supervisorUserId`.
- Líder: vê célula liderada por `leaderUserId`.
- Host/membro: acesso restrito ao próprio perfil quando a rota permitir.

Regras importantes:

- `Group.leaderUserId` aponta para `User.id`.
- `Group.supervisorUserId` aponta para `User.id`.
- Não usar `leaderId`/`supervisorId` em código novo.
- Não confundir `User` com `Person`: usuário é conta de login; pessoa é entidade pastoral.
- Toda leitura/escrita sensível precisa validar `churchId` e contexto real.

---

## 6. Auditoria

Operações sensíveis devem registrar `AuditLog` de forma aguardada e verificável.

Regras:

- Não usar fire-and-forget para auditoria sensível.
- Não engolir erro silenciosamente.
- Logs devem ter `churchId`.
- Escritas sensíveis devem, quando possível, gravar operação e auditoria de forma transacional.
- Testes devem validar campos reais do audit log, não apenas contagem.

Helper principal:

```txt
src/app/api/_helpers/audit-log.ts
```

---

## 7. Banco e domínio

Pontos de domínio já decididos:

- `RiskLevel` é somente `green | yellow | red`.
- `Group.leaderUserId` e `Group.supervisorUserId` têm relação Prisma explícita com `User`.
- Soft delete deve ser respeitado em leituras de `Person`, `Group`, `Event` e `Task`.
- Membership ativa exige `leftAt: null` e pessoa/grupo ativos.
- Registro de presença deve marcar evento como realizado em `occurredAt` quando necessário.
- Tela de presença não pode assumir todos como presentes por padrão.
- Criação de task precisa validar coerência entre `groupId`, `assigneeId`, `targetType` e `targetId`.

Para desenvolvimento, se os dados puderem ser descartados:

```bash
npx prisma db push --force-reset
npx prisma generate
npm run db:seed
```

Para validar histórico versionado:

```bash
npm run db:migrate
```

---

## 8. PWA e cache

Regras atuais:

- Service worker não deve cachear respostas de `/api/*`.
- Rotas `/api/:path*` devem ter `Cache-Control: no-store`.
- `public/sw.js` e `public/workbox-*.js` são artefatos gerados e não devem ser tratados como fonte de verdade.
- Use `npm run pwa:clean` quando precisar remover artefatos gerados.

Arquivos relevantes:

```txt
next.config.mjs
scripts/clean-pwa-artifacts.mjs
public/manifest.json
```

---

## 9. Estrutura relevante

```txt
src/
  app/
    (app)/           rotas autenticadas de persona
    (auth)/          login/onboarding
    api/             route handlers
      auth/
      leader/
      pastor/
      supervisor/
      members/
      people/
      tasks/
      interactions/
      events/
      groups/
  components/
  hooks/
  domain/
    entities/
    repositories/
    use-cases/
  lib/
  types/
prisma/
  schema.prisma
  seed.ts
  migrations/
docs/
  estado-atual-do-projeto.md
```

Rotas de persona:

```txt
/lider/*
/pastor/*
/supervisor/*
/membro/[id]
```

---

## 10. Testes e validação

Antes de entregar mudança:

```bash
npm run typecheck
npm test
npm run build
```

Não mantenha testes passando “sem testes”. O script de teste deve falhar se houver erro real.

Coberturas sensíveis esperadas:

- login, logout, refresh e reutilização de refresh token;
- cookies de sessão;
- autorização por papel;
- cross-church access;
- acesso contextual a pessoa/membro;
- criação de interação;
- criação/atualização de task;
- presença e evento realizado;
- auditoria detalhada.

---

## 11. Convenções de UI/produto

- Mobile-first.
- Linguagem pastoral, não administrativa.
- Líder precisa saber “o que faço agora?”.
- Supervisor precisa saber “quais células precisam de apoio?”.
- Pastor precisa saber “onde há risco pastoral sistêmico?”.
- Evitar telas com excesso de tabela, métrica ou formulário longo.
- Priorizar estados vazios, loading, erro, permissão negada e sessão expirada.

---

## 12. Checklist rápido para agentes

Antes de alterar:

- [ ] Li `docs/estado-atual-do-projeto.md`.
- [ ] Conferi o código real envolvido.
- [ ] Não estou seguindo plano antigo como se fosse estado atual.

Antes de devolver:

- [ ] Mantive nomes `leaderUserId`/`supervisorUserId`.
- [ ] Não reintroduzi refresh token no localStorage.
- [ ] Usei `apiRequestWithAuth` em chamadas protegidas do frontend.
- [ ] Respeitei soft delete e church scope.
- [ ] Atualizei/adaptei testes se mexi em regra sensível.
- [ ] Recomendei rodar `npm run typecheck`, `npm test` e `npm run build`.
