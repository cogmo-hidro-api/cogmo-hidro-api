PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  river TEXT NOT NULL,
  municipality TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('tecnico', 'supervisor', 'pesquisador'))
);

CREATE TABLE IF NOT EXISTS station_operators (
  station_id INTEGER NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
  operator_id INTEGER NOT NULL REFERENCES operators (id) ON DELETE CASCADE,
  role TEXT,
  linked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (station_id, operator_id)
);

CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
    metric TEXT NOT NULL CHECK (metric IN ('level', 'rain')),
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    observed_at TEXT NOT NULL, -- ISO 8601 UTC: ex. 2026-11-03T12:00:00Z
    responsible_id INTEGER REFERENCES operators (id) ON DELETE SET NULL,
    
    CHECK (
        (metric = 'level' AND unit = 'm') OR
        (metric = 'rain' AND unit = 'mm/h')
    ),
    UNIQUE (station_id, metric, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_obs_series
    ON observations (station_id, metric, observed_at);