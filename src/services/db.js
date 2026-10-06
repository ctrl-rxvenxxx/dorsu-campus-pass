import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('pos_inventory.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    );
  `);

  const countRow = db.getFirstSync('SELECT COUNT(*) as count FROM products;');
  if (countRow.count === 0) {
    db.runSync(
      'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?);',
      [
        'Fresh Davao Bananas', 'Produce', 65.00, 48,
        'Mati Brown Rice (5kg)', 'Grains', 280.00, 25,
        'Coconut Virgin Oil', 'Beverages', 150.00, 14,
        'Davao Tablea Chocolate', 'Snacks', 95.00, 20,
        'Durian Candy', 'Snacks', 80.00, 30
      ]
    );
  }
}