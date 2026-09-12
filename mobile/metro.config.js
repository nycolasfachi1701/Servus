// Configuração do Metro.
// 1) o banco da Bíblia (.db) entra como asset, para ser embutido no app;
// 2) a pasta `compartilhado/` (rodízio e mensagem da escala) fica fora do
//    projeto, então precisa ser observada e resolvida explicitamente.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const raizDoProjeto = __dirname;
const compartilhado = path.resolve(raizDoProjeto, "..", "compartilhado");

const config = getDefaultConfig(raizDoProjeto);

config.resolver.assetExts.push("db");
config.watchFolders = [compartilhado];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@compartilhado": compartilhado,
};

module.exports = config;
