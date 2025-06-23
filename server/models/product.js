import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: [String], // Array of image URLs
  colors: [String], // Array of available colors
  sizes: [String], // Array of available sizes
  createdOn: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

export default Product;

