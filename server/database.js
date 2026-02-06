const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

const dbPath = path.join(__dirname, 'chat.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      self_description TEXT DEFAULT '',
      is_online INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      content TEXT NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);

    db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (!err) {
        const hasSelfDescription = columns.some(col => col.name === 'self_description');
        if (!hasSelfDescription) {
          db.run(`ALTER TABLE users ADD COLUMN self_description TEXT DEFAULT ''`, (err) => {
            if (err) {
              console.error('添加 self_description 字段失败:', err.message);
            }
          });
        }
      }
    });
  });
}

module.exports = db;
