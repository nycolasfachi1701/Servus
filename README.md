# Servus — Gestão da Igreja

Sistema web de gestão para igrejas (ERP eclesiástico): **membros, ministérios,
tipos de culto, escalas com rodízio justo, eventos e calendário** — feito para
uso no **celular** (mobile-first) e em **português do Brasil**.

- **Front:** Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **Back:** Supabase — Postgres, Auth, Row Level Security e Storage
- **Hospedagem:** Vercel (free) + Supabase (free)
- **Visual:** vinho e preto, temas claro e escuro (escuro é o principal)

---

## 1. Rodando localmente

### 1.1 Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project** (plano free).
2. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.

### 1.2 Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-anon-publica
# opcional: fuso usado para exibir e digitar datas de eventos
# NEXT_PUBLIC_FUSO_IGREJA=America/Sao_Paulo
```

> Nunca versione o `.env.local`. Só a chave **anon** é usada — o acesso aos
> dados é decidido pelo RLS no banco, não pelo front.

### 1.3 Aplique as migrations

Com a [CLI do Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ref-do-projeto>
supabase db push
```

Ou, pelo painel: **SQL Editor** → cole e rode, **nesta ordem**:

1. `supabase/migrations/20260101000000_init.sql` — tabelas, views e funções
2. `supabase/migrations/20260101000100_rls.sql` — políticas de segurança
3. `supabase/migrations/20260101000200_storage.sql` — bucket de fotos

### 1.4 (Opcional) Dados de demonstração

Rode `supabase/seed.sql` para criar uma igreja de exemplo: 16 membros, 5
ministérios com funções, 3 tipos de culto com vagas, cultos das últimas e
próximas 3 semanas (os passados já finalizados, alimentando o rodízio) e
alguns eventos.

### 1.5 Suba o projeto

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # testes do algoritmo de rodízio
npm run build     # build de produção
```

### 1.6 Primeiro acesso

Abra `/cadastro` e crie sua conta. **O primeiro usuário do sistema vira
administrador automaticamente.** Depois, em **Configurações**, você convida as
demais pessoas (o convite pré-define o papel e o membro vinculado).

> Em **Authentication → Providers → Email**, deixe *Confirm email* ligado
> (recomendado) e cadastre a URL do site em **Authentication → URL
> Configuration** para os links de e-mail funcionarem em produção.

---

## 2. Papéis e permissões

| Papel | O que pode fazer |
| --- | --- |
| **Admin (liderança)** | Tudo: membros, ministérios, tipos de culto, escalas, eventos, configurações e usuários. |
| **Líder de ministério** | Escalas e equipe **do(s) seu(s) ministério(s)**; consulta membros; cria eventos e cultos. |
| **Membro/obreiro** | Vê as escalas em que está, confirma presença, informa disponibilidade e acompanha o calendário. |

Tudo isso é garantido por **Row Level Security no Postgres**, não apenas na
interface. Um membro autenticado que chamasse a API direto continuaria sem ver
telefone, endereço ou observações de outras pessoas.

### LGPD

- A tabela `pessoas` (dados pessoais completos) só é legível pela liderança —
  e pela própria pessoa, no seu registro.
- Nomes e fotos usados em escalas vêm da view `pessoas_publicas`, que expõe
  apenas `id`, `nome`, `foto_url` e `status`.
- Observações são explicitamente marcadas como visíveis só para a liderança.
- Exportação CSV é restrita à liderança.

---

## 3. Modelo de dados

| Tabela | Para que serve |
| --- | --- |
| `pessoas` | Cadastro de membros (contato, nascimento, batismo, endereço, status). |
| `usuarios` | Liga `auth.users` a uma pessoa e guarda o papel. |
| `convites` | E-mails pré-autorizados com papel e pessoa definidos. |
| `ministerios` / `ministerio_lideres` | Equipes e suas lideranças. |
| `funcoes` / `pessoa_funcao` | Funções/instrumentos e quem os exerce. |
| `tipos_culto` / `tipo_culto_vaga` | Cultos recorrentes e as vagas por função. |
| `cultos` | Ocorrência concreta (recorrente ou avulsa), com `finalizado_em`. |
| `disponibilidade` | Quem avisou que pode/não pode em cada culto. |
| `escala_itens` | Cada vaga da escala (pessoa pode ser nula = em aberto) + confirmação. |
| `eventos` | Programação da igreja. |
| `configuracoes` | Nome, logo, cor, mensagem do WhatsApp e pesos do rodízio. |

Views auxiliares: `pessoas_publicas` (diretório mínimo) e `rodizio_carga`
(quantas vezes cada pessoa serviu em cada função, contando **só cultos
finalizados**).

---

## 4. Como funciona o rodízio justo

Implementado em `src/lib/escala/rodizio.ts` (módulo puro, coberto por testes em
`tests/rodizio.test.ts`):

1. As vagas são ordenadas **da mais escassa para a mais fácil** de preencher
   (menos candidatos primeiro) — assim o único baixista não é "gasto" no violão.
2. Para cada vaga, entre quem **exerce a função**, está **disponível** e não
   estourou o **limite do período**, escolhe-se quem tem a **menor carga
   acumulada**.
3. Ao escalar alguém, a carga sobe — é isso que distribui ao longo do período.
4. Pesos ajustáveis em Configurações: **rodízio** (principal), **preferência de
   dia** e **duplas**.
5. Vagas sem ninguém elegível ficam **explicitamente em aberto** (com o motivo),
   nunca preenchidas "no silêncio".

A carga real só sobe quando o culto é marcado como **finalizado** — contamos o
que de fato aconteceu. Dá para desfazer.

**Fluxo de uso:** *Cultos* → gerar as ocorrências das próximas semanas →
*Escalas* → “Gerar escala” do período → ajustar manualmente onde quiser →
**Enviar pro WhatsApp** (abre o app com o texto pronto; você escolhe o grupo) →
depois do culto, marcar **Finalizado**.

---

## 5. Publicando de graça

### Supabase
Já está pronto: o mesmo projeto usado localmente serve para produção. Confira
em **Authentication → URL Configuration** a *Site URL* (ex.:
`https://servus.vercel.app`) e as *Redirect URLs* (inclua
`https://seu-dominio/auth/confirmar`).

### Vercel
1. Suba o repositório para o GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repo.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. O Next.js é detectado automaticamente (sem configuração extra).

---

## 6. Estrutura do projeto

```
src/app/(auth)          login, cadastro e callback de e-mail
src/app/(app)           área autenticada
  painel                dashboard
  membros               CRUD, busca, aniversariantes e exportação CSV
  ministerios           ministérios, funções, equipe e liderança
  cultos                tipos de culto, vagas e ocorrências
  escalas               geração, edição manual, WhatsApp e finalização
  minhas-escalas        portal do membro (confirmação de presença)
  disponibilidade       "posso / não posso" por culto
  eventos               programação da igreja
  calendario            cultos + eventos + aniversários
  configuracoes         igreja, mensagem, pesos, usuários e convites
src/components          UI (botões, campos, cartões) e layout
src/lib                 tipos, sessão, utilidades, acesso a dados e rodízio
supabase/migrations     schema, RLS e storage
supabase/seed.sql       dados de demonstração
tests                   testes do rodízio (node:test)
```

## 7. Acessibilidade e mobile

- Navegação por barra inferior no celular e menu lateral no desktop.
- Foco visível, rótulos em todos os campos, `aria-*` nos controles e contraste
  conferido nos dois temas.
- `prefers-reduced-motion` respeitado.
