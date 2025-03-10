const db = require("../config/db");

// ➤ Add Product to Wishlist
const addToWishlist = async (userId, productId) => {

  try {
    const result = await db.query(
      "INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *",
      [userId, productId]
    );
   
    return result.rows[0].id;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

// ➤ Get Wishlist Items for a User
const getWishlistByUserId = async (userId) => {
  try {
    const result = await db.query(
      `SELECT product_id
        FROM wishlist
        WHERE user_id = $1;`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    throw error;
  }
};

// ➤ Remove Product from Wishlist
const removeFromWishlist = async (userId, productId) => {

  try {
    const result= await db.query(
      "DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );
   
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

module.exports = { addToWishlist, getWishlistByUserId, removeFromWishlist };
