// cartController.js
const Cart = require('../models/addtocartModel');

// ➤ Add Product to Cart
const addToCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: 'User ID, Product ID, and quantity are required' });
    }
    const cartId = await Cart.addToCart(userId, productId);
    res.status(201).json({ message: 'Added to cart', cartId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ➤ Get User Cart
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;
  
    const cartItems = await Cart.getCartByUserId(userId);
   
    res.status(200).json(cartItems);
  } catch (error) {
  
    res.status(500).json({ error: 'Server error' });
  }
};

// ➤ Remove Product from Cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const removed = await Cart.removeFromCart(userId, productId);
    if (!removed) return res.status(404).json({ error: 'Item not found' });

    res.status(200).json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ➤ Update Product Quantity in Cart
const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const updated = await Cart.updateCartQuantity(userId, productId, quantity);
    if (!updated) return res.status(404).json({ error: 'Item not found or quantity unchanged' });

    res.status(200).json({ message: 'Cart quantity updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { addToCart, getUserCart, removeFromCart, updateCartQuantity };
