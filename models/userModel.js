const db = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async ({ name, email, phone=null, password=null}) => {
  const createdAt = new Date();
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10); // Only hash if password is provided
  }

  const result = await db.query(
    'INSERT INTO seelaikaari_users (name, email, phone, password,createdAt) VALUES ($1,$2, $3, $4, $5) RETURNING *',
    [name, email, phone, hashedPassword,createdAt]
  );

  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM seelaikaari_users WHERE email = $1', [email]);

  return result.rows[0];
};
const updateUserById = async (id, updatedFields) => {

  const result = await db.query(
    'UPDATE seelaikaari_users SET name = $1, email = $2, phone = $3 WHERE id = $4',
    [updatedFields.name, updatedFields.email, updatedFields.phone, id]
  );

  const updatedUser = await getUserById(id);
  return updatedUser;
};

const getUserById = async (id) => {
  const result = await db.query('SELECT * FROM seelaikaari_users WHERE id = $1', [id]);
  return result.rows;
};

module.exports = { createUser, getUserByEmail,updateUserById,getUserById};