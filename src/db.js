'use strict';
// SQLite via Node's built-in node:sqlite (Node >= 22.5). No external dependencies.
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { SEED_PRODUCTS, DEFAULT_SETTINGS } = require('./seed');

function open(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'majookit.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      category    TEXT    NOT NULL,              -- shelves | storage | desk | decor
      model       TEXT    NOT NULL,              -- 3D model key (cube, stair, column, ...)
      spaces      TEXT    NOT NULL DEFAULT '[]', -- JSON array: home | office | small
      width_cm    REAL    NOT NULL DEFAULT 0,
      depth_cm    REAL    NOT NULL DEFAULT 0,
      height_cm   REAL    NOT NULL DEFAULT 0,
      expandable  INTEGER NOT NULL DEFAULT 0,
      compatible  TEXT    NOT NULL DEFAULT '[]', -- JSON array of product ids
      difficulty  INTEGER NOT NULL DEFAULT 1,    -- 1..3
      assembly_min INTEGER NOT NULL DEFAULT 0,
      parts       INTEGER NOT NULL DEFAULT 0,
      price       INTEGER NOT NULL DEFAULT 0,    -- toman
      use_case    TEXT    NOT NULL DEFAULT '',
      description TEXT    NOT NULL DEFAULT '',
      images      TEXT    NOT NULL DEFAULT '[]', -- JSON array of /uploads/... urls
      manual_url  TEXT    NOT NULL DEFAULT '',
      video_url   TEXT    NOT NULL DEFAULT '',
      ref_name    TEXT    NOT NULL DEFAULT '',
      ref_note    TEXT    NOT NULL DEFAULT '',
      ref_url     TEXT    NOT NULL DEFAULT '',
      stock       INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1,
      sort        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL DEFAULT '',
      phone       TEXT    NOT NULL DEFAULT '',
      city        TEXT    NOT NULL DEFAULT '',
      note        TEXT    NOT NULL DEFAULT '',
      items       TEXT    NOT NULL,              -- JSON snapshot [{id,name,price,qty}]
      total       INTEGER NOT NULL DEFAULT 0,
      status      TEXT    NOT NULL DEFAULT 'new', -- new | confirmed | shipped | delivered | canceled
      admin_note  TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      kind        TEXT    NOT NULL,              -- guide | custom-notify | question
      phone       TEXT    NOT NULL DEFAULT '',
      note        TEXT    NOT NULL DEFAULT '',
      handled     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      pass_hash  TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);

  // seed products once
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count === 0) {
    const ins = db.prepare(`INSERT INTO products
      (id,name,category,model,spaces,width_cm,depth_cm,height_cm,expandable,compatible,difficulty,assembly_min,parts,price,use_case,ref_name,ref_note,ref_url,stock,sort)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    db.exec('BEGIN');
    SEED_PRODUCTS.forEach((p, i) => ins.run(
      p.id, p.name, p.cat, p.type, JSON.stringify(p.spaces), p.w, p.d, p.h, p.exp ? 1 : 0,
      JSON.stringify(p.compat), p.diff, p.time, p.parts, p.price, p.use, p.ref[0], p.ref[1], p.ref[2], 20, i));
    db.exec('COMMIT');
  }
  // default settings (only missing keys)
  const insS = db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)');
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insS.run(k, String(v));

  return db;
}

module.exports = { open };
