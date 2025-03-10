// cartModel.js
const db = require('../config/db'); // Adjust the path to your database configuration

const Cart = {
  // Add a product to the cart
  addToCart: async (userId, productId) => {
    const result = await db.query(
      'INSERT INTO cart (user_id, product_id) VALUES ($1, $2) RETURNING *',
      [userId, productId]
    );
    return result.rows[0].id;
  },

  // Get all cart items for a user
  getCartByUserId: async (userId) => {

    const result = await db.query(
      `SELECT *
       FROM cart 
       WHERE user_id = $1`,
      [userId]
    );
    
   
    return result.rows;
  },

  // Remove a product from the cart
  removeFromCart: async (userId, productId) => {
    const result = await db.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    return result.rowCount > 0;
  },

  // Update product quantity in the cart
  updateCartQuantity: async (userId, productId, quantity) => {
    const [result] = await db.query(
      'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
      [quantity, userId, productId]
    );
    return result.rowCount > 0;
  },
};

module.exports = Cart;
