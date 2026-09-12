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
- Fica em `assets/db/biblia.db`, um SQLite de 66 livros e 31.104 versículos
  embutido no app: abre **sem internet** e a busca é instantânea.
- A busca ignora acentos e maiúsculas (“coracao” acha “coração”) e exige que
  todas as palavras apareçam no versículo.
- Destaques e anotações ficam no Supabase (tabela `biblia_anotacoes`), são
  **privados** — nem a liderança vê — e acompanham a pessoa se ela trocar de
  celular.

Para regerar o banco (não é necessário no dia a dia):

```bash
curl -L -o .cache/aa.json https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json
python3 scripts/gerar-biblia.py .cache/aa.json assets/db/biblia.db
```

## Estrutura

```
app/                    rotas (expo-router)
  (auth)/               login e cadastro
  (tabs)/               Início, Escalas, Bíblia, Mais
    biblia/             índice, leitor e busca
  disponibilidade.tsx   "posso / não posso" por culto
  anotacoes.tsx         o que a pessoa marcou na Bíblia
src/lib/                supabase, sessão, tema, dados, bíblia, anotações
src/componentes/        UI (botões, cartões, campos) e ícones
assets/db/biblia.db     Bíblia embutida
scripts/gerar-biblia.py gerador do banco da Bíblia
```

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
