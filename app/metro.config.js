const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Spot data and photos live in ../data (see docs/roadmap.md, repo layout).
config.watchFolders = [path.resolve(__dirname, '../data')];

module.exports = config;
