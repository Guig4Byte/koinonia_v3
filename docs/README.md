# Documentação do Koinonia

Este diretório contém documentos de dois tipos:

## 1. Estado atual oficial

- [`estado-atual-do-projeto.md`](estado-atual-do-projeto.md)

Este é o documento que deve ser lido primeiro. Ele descreve o estado real do projeto neste momento, decisões vigentes, comandos de validação e riscos ainda conhecidos.

## 2. Referências históricas/de produto

- `Koinonia.txt`
- `Perfil.txt`
- `koinonia-plano-completo-v2.1.md`
- `koinonia-plano-completo-v2.2.md`
- `koinonia-plano-completo-v2.3.md`
- `koinonia-plano-completo-v2.4.md`
- `koinonia-plano-completo-v2.5.md`
- `koinonia_v2_hierarquia.html`

Esses documentos ajudam a entender visão, produto, personas e planos anteriores. Eles não devem ser tratados como implementação atual quando divergirem do código.

## Regra de precedência

```txt
Código atual + prisma/schema.prisma + estado-atual-do-projeto.md > planos antigos
```

## Quando atualizar

Atualize `estado-atual-do-projeto.md` sempre que uma decisão estrutural mudar, por exemplo:

- autenticação/sessão;
- autorização por papel;
- schema Prisma;
- regras de auditoria;
- cache/PWA;
- rotas principais;
- scripts oficiais;
- status de produção/MVP.
