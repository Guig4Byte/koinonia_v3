# Koinonia

Base da Onda 0 do Koinonia construída com Next.js 16, App Router, TypeScript strict,
Tailwind CSS, Prisma e PostgreSQL.

## Stack

- Next.js 16 com App Router
- React 19
- Tailwind CSS com tema pastoral
- Prisma 6 + PostgreSQL
- React Hook Form + Zod
- TanStack Query
- Vitest + Testing Library
- next-pwa para geração do service worker no build

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Seed

Usuários iniciais criados pela seed:

- `roberto@comunidadeesperanca.org`
- `ana@comunidadeesperanca.org`
- `bruno@comunidadeesperanca.org`

Senha comum:

- `koinonia123`

## Observações

- O `DATABASE_URL` é lido do `.env` existente na raiz do projeto.
- O build de produção usa `next build --webpack` porque `next-pwa` ainda depende de
  configuração webpack. O desenvolvimento continua em Turbopack via `npm run dev`.
