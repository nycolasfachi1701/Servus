# Servus — Gestão da Igreja

Sistema web de gestão para igrejas (ERP eclesiástico): membros, ministérios,
tipos de culto, **escalas com rodízio justo**, eventos e calendário — pensado
para uso no **celular** e em **português do Brasil**.

Stack: **Next.js (App Router) + TypeScript + Tailwind CSS** no front e
**Supabase** (Postgres + Auth + RLS + Storage) no back. Tudo roda em plano
gratuito (Vercel + Supabase).

## Rodando localmente

1. **Crie um projeto no Supabase** (supabase.com → New project, plano free).
2. Copie as chaves em *Project Settings → API* e crie o `.env.local`:

   ```bash
   cp .env.example .env.local
   # preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Aplique as migrations.** No SQL Editor do Supabase, rode na ordem os
   arquivos de `supabase/migrations/`. Com a CLI do Supabase:

   ```bash
   supabase link --project-ref <ref-do-projeto>
   supabase db push
   ```

4. **(Opcional) Popule os dados de exemplo** rodando `supabase/seed.sql`.
5. Instale e suba o projeto:

   ```bash
   npm install
   npm run dev
   ```

6. Acesse http://localhost:3000, clique em **Criar minha conta** e cadastre-se.
   O **primeiro usuário criado vira administrador** automaticamente.

## Papéis

| Papel | O que faz |
| --- | --- |
| **Admin** | Acesso total: membros, ministérios, cultos, escalas, eventos, configurações. |
| **Líder de ministério** | Gerencia escalas e pessoas do(s) ministério(s) que lidera. |
| **Membro/obreiro** | Vê suas escalas, confirma presença, informa disponibilidade e acompanha a programação. |

Tudo é garantido no banco por **Row Level Security** — não só na interface.

## Estrutura

```
src/app/(auth)      login, cadastro
src/app/(app)       área autenticada (painel, membros, escalas, …)
src/components      UI e layout
src/lib             tipos, sessão, utilidades e acesso a dados
supabase/migrations schema, RLS e storage
supabase/seed.sql   dados de demonstração
```
