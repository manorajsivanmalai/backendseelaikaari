const productModel = require('../models/productModel');

const getAllProducts = async (req, res) => {
  try {
   
    const products = await productModel.getAllProducts();
  
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

const getProductById = async (req, res) => {
  try {
   
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.'});
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to fetch product.'});
  }
};

const createProduct = async (req, res) => {
  try {
    const { id, name, price, description, image } = req.body;
    const productId = await productModel.createProduct({ id, name, price, description, image });
    res.status(201).json({ message: 'Product created', productId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const success = await productModel.updateProduct(productId, req.body);
    if (!success) return res.status(404).json({ error: 'Product not found or not updated.' });
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct };
