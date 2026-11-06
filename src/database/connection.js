const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/hidro.db');

// Garante que a pasta do banco (data/) exista antes de conectar
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Habilitar FK em toda conexão
db.pragma('foreign_keys = ON');

module.exports = db;