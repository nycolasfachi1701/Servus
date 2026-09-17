# Servus — aplicativo (Android e iOS)

App do Servus em **Expo / React Native**, com **Bíblia offline** e anotações.
Usa o mesmo Supabase do sistema web: os dados, os papéis e o RLS são os
mesmos — quem é admin no site é admin no app.

## Rodando no seu celular

1. Instale as dependências:

   ```bash
   cd mobile
   npm install
   ```

2. Configure as chaves do Supabase:

   ```bash
   cp .env.example .env
   ```

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```

3. Suba o servidor de desenvolvimento:

   ```bash
   npx expo start
   ```

4. No celular, instale o app **Expo Go** (Play Store / App Store) e aponte a
   câmera para o QR Code que aparece no terminal.

> O celular e o computador precisam estar na mesma rede Wi-Fi. Se a empresa/
> igreja tiver rede isolada, rode `npx expo start --tunnel`.

## A Bíblia

- Texto: **Almeida Revisada Imprensa Bíblica (1914)** — domínio público.
- **Palavras no original:** cada versículo pode ser aberto em hebraico ou
  grego, palavra por palavra, com transliteração, número de Strong,
  significado e a definição completa do léxico. 425.454 palavras etiquetadas
  e 14.197 verbetes — 98,6% das palavras têm verbete.
- Fica em `assets/db/biblia.db`, um SQLite de 40 MB embutido no app: abre
  **sem internet** e a busca é instantânea.
- A busca ignora acentos e maiúsculas (“coracao” acha “coração”) e exige que
  todas as palavras apareçam no versículo.
- Destaques e anotações ficam no Supabase (tabela `biblia_anotacoes`), são
  **privados** — nem a liderança vê — e acompanham a pessoa se ela trocar de
  celular.

### Fontes e créditos

| Fonte | O que traz | Licença |
| --- | --- | --- |
| [Almeida Revisada IB 1914](https://github.com/thiagobodruk/biblia) | texto bíblico em português | domínio público |
| [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data) (TAHOT/TAGNT) | hebraico e grego etiquetados com Strong e morfologia | CC BY 4.0 |
| [Open Scriptures Strongs](https://github.com/openscriptures/strongs) | definições do léxico de Strong | CC BY-SA |

As licenças exigem crédito — ele aparece no rodapé da tela da Bíblia e no
painel de palavras no original. Não remova.

> As definições de Strong estão em **inglês** (é o original de 1890/1894);
> o espanhol de cada palavra vem do STEPBible e ajuda bastante o leitor
> brasileiro. Uma camada em português pode ser acrescentada depois, sem
> mexer no resto.

Para regerar o banco (não é necessário no dia a dia):

```bash
# texto em português
curl -L -o .cache/aa.json https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json
python3 scripts/gerar-biblia.py .cache/aa.json assets/db/biblia.db

# palavras no original + léxico (baixe antes os .txt do STEPBible e os
# dicionários do Open Scriptures para .cache/)
python3 scripts/gerar-originais.py .cache/step .cache assets/db/biblia.db
```

## O que dá para fazer pelo app

**Qualquer membro:** ver as próximas escalas e confirmar presença, informar
disponibilidade por culto, acompanhar cultos e eventos, ler a Bíblia, destacar
versículos e escrever anotações.

**Liderança (líder de ministério e admin):** tudo acima, mais —

- **Escalas:** gerar a escala de um período com o rodízio justo, trocar
  qualquer pessoa manualmente, adicionar/remover vagas, marcar o culto como
  finalizado e enviar a escala pronta no WhatsApp.
- **Membros:** cadastro completo com foto, busca, filtro por status, funções.
- **Ministérios:** funções, equipe de cada função e liderança.
- **Cultos:** tipos recorrentes, vagas por função, geração das ocorrências e
  cultos avulsos.
- **Eventos:** programação da igreja com imagem, local e ministério.
- **Configurações (só admin):** dados da igreja, mensagem do WhatsApp, limite
  do rodízio, papéis dos usuários e convites de acesso.

Um líder só mexe nas funções do próprio ministério — quem garante isso é o
RLS no banco, não a interface.

## Estrutura

```
app/                    rotas (expo-router)
  (auth)/               login e cadastro
  (tabs)/               Início, Escalas, Bíblia, Mais
    biblia/             índice, leitor e busca
  gestao/               área da liderança
    escalas/            lista, geração e escala de cada culto
    membros/            lista, ficha e cadastro
    ministerios/        lista e detalhe (funções, equipe, liderança)
    cultos.tsx          tipos de culto, vagas e ocorrências
    eventos.tsx         programação
    configuracoes.tsx   igreja, usuários e convites
  disponibilidade.tsx   "posso / não posso" por culto
  anotacoes.tsx         o que a pessoa marcou na Bíblia
src/lib/                supabase, sessão, tema, dados, gestão, bíblia
src/componentes/        UI (botões, cartões, campos), seletor e ícones
assets/db/biblia.db     Bíblia embutida
scripts/gerar-biblia.py gerador do banco da Bíblia
```

> O algoritmo do rodízio mora em `../compartilhado/escala/`, usado pelo app e
> pelo site — uma regra só, num lugar só.

## Publicando nas lojas

O build é feito pelo **EAS** (serviço da Expo; o plano free cobre builds
esporádicos):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # APK para instalar e testar
eas build --platform android --profile production
eas build --platform ios --profile production
```

Custos das lojas: **Google Play US$ 25 (uma vez)** e **Apple US$ 99/ano**.
O restante da stack (Supabase + EAS free) continua sem custo.

## Comandos

```bash
npx expo start        # desenvolvimento
npm run typecheck     # conferência de tipos
npx expo export --platform android   # empacota o bundle (teste de build)
```
