// Seed repetível (P1 · Banco de dados)
// -------------------------------------------------------------
// Popula o banco com dados FICTÍCIOS e DETERMINÍSTICOS:
//   - 4 estações (3 com leituras + 1 sem nenhuma, para demonstrar série vazia)
//   - 4 operadores e os vínculos N:N estação ↔ operador
//   - leituras horárias de nível (m) e chuva (mm/h) em 73 horários (72 h)
//   - LACUNAS de propósito: alguns horários simplesmente não são gravados
//
// Rodar várias vezes NÃO duplica nada:
//   - estações     → ON CONFLICT(code) DO NOTHING
//   - operadores   → ON CONFLICT(email) DO NOTHING
//   - vínculos     → ON CONFLICT(station_id, operator_id) DO NOTHING
//   - leituras     → ON CONFLICT(station_id, metric, observed_at) DO NOTHING
// Tudo dentro de UMA transação: ou grava o conjunto inteiro, ou nada.
// As datas são fixas (não dependem do relógio), por isso o resultado é sempre igual.

require('dotenv').config();
const db = require('./connection');

// ---------- Dados de base ----------

// Última hora da amostra. As 72 h anteriores também são geradas.
const END = '2026-11-10T12:00:00Z';
const HOURS = 72; // 73 horários: END-72h ... END

const STATIONS = [
  { code: 'EST-001', name: 'Estação Aurora', river: 'Rio Aurora', municipality: 'Vila Aurora', state: 'DF', latitude: -15.7801, longitude: -47.9292 },
  { code: 'EST-002', name: 'Estação Bela Vista', river: 'Ribeirão Bela Vista', municipality: 'Bela Vista do Cerrado', state: 'GO', latitude: -16.0412, longitude: -48.1127 },
  { code: 'EST-003', name: 'Estação Cachoeira Azul', river: 'Rio Azul', municipality: 'Cachoeira Azul', state: 'MG', latitude: -16.4635, longitude: -46.9071 },
  // Estação recém-instalada: ainda sem leituras (summary com null e série vazia)
  { code: 'EST-004', name: 'Estação Dourada', river: 'Córrego Dourado', municipality: 'Vale Dourado', state: 'DF', latitude: -15.6012, longitude: -47.6544 },
];

const OPERATORS = [
  { name: 'Ana Técnica', email: 'ana.tecnica@cogmo.test', phone: '61990000001', type: 'tecnico' },
  { name: 'Bruno Supervisor', email: 'bruno.supervisor@cogmo.test', phone: '61990000002', type: 'supervisor' },
  { name: 'Carla Pesquisadora', email: 'carla.pesquisadora@cogmo.test', phone: null, type: 'pesquisador' },
  { name: 'Diego Campo', email: 'diego.campo@cogmo.test', phone: '61990000004', type: 'tecnico' },
];

// Vínculos N:N (estação ↔ operador) com a função de cada um
const LINKS = [
  { code: 'EST-001', email: 'ana.tecnica@cogmo.test', role: 'técnica de campo' },
  { code: 'EST-001', email: 'bruno.supervisor@cogmo.test', role: 'supervisor regional' },
  { code: 'EST-002', email: 'diego.campo@cogmo.test', role: 'técnico de campo' },
  { code: 'EST-002', email: 'bruno.supervisor@cogmo.test', role: 'supervisor regional' },
  { code: 'EST-003', email: 'ana.tecnica@cogmo.test', role: 'técnica de campo' },
  { code: 'EST-003', email: 'carla.pesquisadora@cogmo.test', role: 'análise de dados' },
  { code: 'EST-004', email: 'diego.campo@cogmo.test', role: 'instalação' },
];

// Perfil de cada estação para gerar as leituras.
// gaps = deslocamentos (em horas antes de END) que NÃO serão gravados.
// levelStopsAt = sensor de nível parou X horas antes de END (cada métrica tem seu próprio horário).
const PROFILES = {
  'EST-001': {
    levelBase: 1.35, levelAmp: 0.08, phase: 0.0, responsible: 'ana.tecnica@cogmo.test',
    rainEvents: [{ start: 26, end: 18, peak: 7.5 }],
    gaps: { level: [5, 6], rain: [10] },
    levelStopsAt: 0,
  },
  'EST-002': {
    levelBase: 2.10, levelAmp: 0.12, phase: 1.3, responsible: 'diego.campo@cogmo.test',
    rainEvents: [{ start: 14, end: 8, peak: 12.0 }],
    gaps: { level: [15], rain: [25, 26, 27, 28, 29, 30] },
    levelStopsAt: 0,
  },
  'EST-003': {
    levelBase: 0.85, levelAmp: 0.05, phase: 2.6, responsible: 'ana.tecnica@cogmo.test',
    rainEvents: [{ start: 52, end: 45, peak: 4.2 }],
    gaps: { level: [], rain: [3] },
    levelStopsAt: 2,
  },
  // EST-004 não tem perfil: fica sem leituras.
};

// ---------- Geração determinística ----------

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const endMs = Date.parse(END);
const isoAt = (hoursBefore) => new Date(endMs - hoursBefore * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

// Chuva (mm/h): forma triangular dentro do evento; garoa fraca e regular fora dele
function rainAt(profile, h) {
  for (const ev of profile.rainEvents) {
    if (h <= ev.start && h >= ev.end) {
      const mid = (ev.start + ev.end) / 2;
      const half = (ev.start - ev.end) / 2 || 1;
      return round(ev.peak * (1 - Math.abs(h - mid) / (half + 1)), 1);
    }
  }
  return h % 9 === 0 ? 0.2 : 0;
}

// Nível (m): oscilação diária + resposta à chuva acumulada nas 6 h anteriores
function levelAt(profile, h) {
  const daily = profile.levelAmp * Math.sin((2 * Math.PI * (HOURS - h)) / 24 + profile.phase);
  let rain6h = 0;
  for (let k = h; k <= h + 6; k += 1) rain6h += rainAt(profile, k);
  return round(profile.levelBase + daily + 0.02 * rain6h, 2);
}

function buildObservations(code) {
  const p = PROFILES[code];
  if (!p) return [];
  const rows = [];
  for (let h = HOURS; h >= 0; h -= 1) {
    if (h >= p.levelStopsAt && !p.gaps.level.includes(h)) {
      rows.push({ metric: 'level', unit: 'm', value: levelAt(p, h), observed_at: isoAt(h), responsible: p.responsible });
    }
    if (!p.gaps.rain.includes(h)) {
      // pluviômetro automático: leitura de chuva sem operador responsável (responsible_id = NULL)
      rows.push({ metric: 'rain', unit: 'mm/h', value: rainAt(p, h), observed_at: isoAt(h), responsible: null });
    }
  }
  return rows;
}

// ---------- Gravação ----------

function assertSchema() {
  const needed = ['stations', 'operators', 'station_operators', 'observations'];
  const found = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
  const missing = needed.filter((t) => !found.includes(t));
  if (missing.length) {
    console.error(`Tabelas ausentes: ${missing.join(', ')}. Rode antes: npm run db:migrate`);
    process.exit(1);
  }
}

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n; // nome de tabela fixo no código, não vem do usuário
}

function runSeed() {
  assertSchema();

  const insertStation = db.prepare(`
    INSERT INTO stations (code, name, river, municipality, state, latitude, longitude)
    VALUES (@code, @name, @river, @municipality, @state, @latitude, @longitude)
    ON CONFLICT(code) DO NOTHING
  `);
  const insertOperator = db.prepare(`
    INSERT INTO operators (name, email, phone, type)
    VALUES (@name, @email, @phone, @type)
    ON CONFLICT(email) DO NOTHING
  `);
  const insertLink = db.prepare(`
    INSERT INTO station_operators (station_id, operator_id, role)
    VALUES (?, ?, ?)
    ON CONFLICT(station_id, operator_id) DO NOTHING
  `);
  const insertObservation = db.prepare(`
    INSERT INTO observations (station_id, metric, value, unit, observed_at, responsible_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(station_id, metric, observed_at) DO NOTHING
  `);
  const stationIdByCode = db.prepare('SELECT id FROM stations WHERE code = ?');
  const operatorIdByEmail = db.prepare('SELECT id FROM operators WHERE email = ?');

  const inserted = { stations: 0, operators: 0, station_operators: 0, observations: 0 };

  const seedAll = db.transaction(() => {
    for (const s of STATIONS) inserted.stations += insertStation.run(s).changes;
    for (const o of OPERATORS) inserted.operators += insertOperator.run(o).changes;

    // Os ids são buscados pelo código/e-mail: funciona mesmo se o banco já tinha outros registros
    for (const l of LINKS) {
      const st = stationIdByCode.get(l.code);
      const op = operatorIdByEmail.get(l.email);
      inserted.station_operators += insertLink.run(st.id, op.id, l.role).changes;
    }

    for (const s of STATIONS) {
      const st = stationIdByCode.get(s.code);
      for (const r of buildObservations(s.code)) {
        const resp = r.responsible ? operatorIdByEmail.get(r.responsible).id : null;
        inserted.observations += insertObservation.run(st.id, r.metric, r.value, r.unit, r.observed_at, resp).changes;
      }
    }
  });

  seedAll();

  const rows = Object.keys(inserted).map((t) => ({ tabela: t, inseridos_agora: inserted[t], total_no_banco: count(t) }));
  console.log('Seed concluído (dados SIMULADOS, sem finalidade operacional).');
  console.table(rows);
  if (Object.values(inserted).every((n) => n === 0)) {
    console.log('Nada novo foi inserido: o seed já tinha sido aplicado (repetível, sem duplicar).');
  }
  return inserted;
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed, buildObservations, END };
