import { db, initDatabase } from './db';

export type InventoryProduct = {
  id: string;
  name: string;
  detail: string;
  price: number;
  stock: number;
  category: string;
};

type ProductRow = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

function mapProduct(row: ProductRow): InventoryProduct {
  return {
    id: String(row.id),
    name: row.name,
    detail: row.category,
    price: row.price,
    stock: row.stock,
    category: row.category,
  };
}

export async function initializeInventory() {
  initDatabase();
}

export async function getInventoryProducts(query = ''): Promise<InventoryProduct[]> {
  const rows = query.trim()
    ? db.getAllSync(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC;',
      [`%${query.trim()}%`]
    )
    : db.getAllSync('SELECT * FROM products ORDER BY id DESC;');

  return (rows as ProductRow[]).map(mapProduct);
}

export async function addInventoryProduct(product: Omit<InventoryProduct, 'id' | 'detail'>) {
  db.runSync(
    'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?);',
    [product.name, product.category, product.price, product.stock]
  );
}

export async function removeInventoryProduct(id: string) {
  db.runSync('DELETE FROM products WHERE id = ?;', [Number(id)]);
}

export async function changeInventoryStock(id: string, adjustment: number): Promise<boolean> {
  const result = db.runSync(
    'UPDATE products SET stock = stock + ? WHERE id = ? AND stock + ? >= 0;',
    [adjustment, Number(id), adjustment]
  );
  return result.changes > 0;
}
