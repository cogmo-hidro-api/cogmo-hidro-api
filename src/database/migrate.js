const fs = require('fs');
const path = require('path');
const db = require('./connection');

// Garante que a pasta 'data' existe para salvar o hidro.db
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Lê o arquivo .sql dentro de migrations
const migrationPath = path.resolve(__dirname, 'migrations', '001_init.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Executa as migrações no banco
db.exec(sql);
console.log('Migrações executadas com sucesso!');