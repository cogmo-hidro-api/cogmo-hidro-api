// Apaga o arquivo do banco para recomeçar do zero (usado por: npm run db:fresh).
// Depois disso o db:fresh roda db:reset (migrate + seed).
// Não importa connection.js de propósito: o arquivo não pode estar aberto ao ser apagado.
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/hidro.db');

for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`, `${dbPath}-journal`]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Removido: ${file}`);
  }
}
console.log('Banco apagado. Recriando com migrate + seed...');
