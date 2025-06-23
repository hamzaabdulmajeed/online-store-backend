import express from 'express';
import Product from '../models/product.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
const router = express.Router();

// POST /api/products/addProduct - Add a new product
router.post('/addProduct', protectAdmin, async (req, res) => {
  try {
    const { title, description, price, image, colors, sizes } = req.body;

    const newProduct = new Product({ 
      title, 
      description, 
      price, 
      image,
      colors: colors || [], // Default to empty array if not provided
      sizes: sizes || []    // Default to empty array if not provided
    });
    
    await newProduct.save();

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id - Get a product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).send('Server error');
  }
});

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdOn: -1 }).limit(100);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Server error');
  }
});

export default router;
