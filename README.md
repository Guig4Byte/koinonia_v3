# Koinonia

PWA de gestão pastoral de células/pequenos grupos para igrejas, construído com Next.js 16, React 19, TypeScript strict, Tailwind CSS, Prisma e PostgreSQL.

> **Documento oficial de estado atual:** [`docs/estado-atual-do-projeto.md`](docs/estado-atual-do-projeto.md)
>
> Os arquivos de plano em `docs/koinonia-plano-completo-v*.md`, `docs/Koinonia.txt` e `docs/Perfil.txt` são referências históricas/de produto. Quando houver divergência, o estado atual do projeto e o código prevalecem.

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
npm run dev          # desenvolvimento com Turbopack
npm run build        # build de produção com Webpack por causa do next-pwa
npm run lint
npm run typecheck
npm run test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
npm run pwa:clean
```

## Banco de desenvolvimento

Para desenvolvimento local, quando os dados podem ser descartados, o caminho mais simples é recriar o banco pelo schema atual:

```bash
npx prisma db push --force-reset
npx prisma generate
npm run db:seed
```

Para validar histórico versionado de banco, use migrations:

```bash
npm run db:migrate
```

## Seed

Usuários iniciais criados pela seed:

- `roberto@comunidadeesperanca.org` — pastor
- `ana@comunidadeesperanca.org` — supervisora
- `bruno@comunidadeesperanca.org` — líder

Senha comum:

- `koinonia123`

## Validação recomendada

Antes de considerar uma mudança pronta:

```bash
npm run typecheck
npm test
npm run build
```

## Observações importantes

- `DATABASE_URL` é lido do `.env` na raiz do projeto.
- O build de produção usa `next build --webpack` porque `next-pwa` depende de configuração Webpack.
- O desenvolvimento usa Turbopack via `npm run dev`.
- O refresh token fica em cookie HttpOnly; o access token fica apenas em memória no frontend.
- O service worker não deve cachear respostas de `/api/*`.
