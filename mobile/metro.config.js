// Configuração do Metro: o banco da Bíblia (.db) precisa entrar como asset
// para ser embutido no app e aberto offline.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("db");

module.exports = config;
