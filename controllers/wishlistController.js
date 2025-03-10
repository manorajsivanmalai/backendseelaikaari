const Wishlist = require("../models/wishListModel");

// ➤ Add Product to Wishlist
const addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "User ID and Product ID are required" });
    }

    const wishlistId = await Wishlist.addToWishlist(userId, productId);
    res.status(201).json({ message: "Added to wishlist", wishlistId });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ➤ Get User Wishlist
const getUserWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
   
    const wishlistItems = await Wishlist.getWishlistByUserId(userId);
    res.status(200).json(wishlistItems);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ➤ Remove Product from Wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const removed = await Wishlist.removeFromWishlist(userId, productId);
    if (!removed) return res.status(404).json({ error: "Item not found" });

    res.status(200).json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { addToWishlist, getUserWishlist, removeFromWishlist };
