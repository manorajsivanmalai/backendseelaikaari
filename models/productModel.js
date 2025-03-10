const db = require('../config/db');

const createProduct = async ({ id, name, price, description, image }) => {
  const result = await db.query(
    'INSERT INTO products (id, name, price, description, image) VALUES ($1, $2, $3, $4, $5)',
    [id, name, price, description, image]
  );
  return result.insertId;
};

const getAllProducts = async () => {

  const result = await db.query('SELECT * FROM products');

  return result.rows;
};

const getProductById = async (id) => {
  const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

  return result.rows;
};

const updateProduct = async (id, { name, price, description, image }) => {
  const result = await db.query(
    'UPDATE products SET name = $1, price = $2, description = $3, image = $4 WHERE id = $5',
    [name, price, description, image, id]
  );
  return result.affectedRows > 0;
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct };
