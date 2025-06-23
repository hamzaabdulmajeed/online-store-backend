// import mongoose from 'mongoose';

// const orderSchema = new mongoose.Schema({
//   // Customer Information
//   customerName: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },
//   address: { type: String, required: true },
  
//   // Product Information
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   productTitle: { type: String, required: true },
//   productPrice: { type: Number, required: true },
  
//   // Order Specifications
//   size: { type: String, required: true },
//   color: { type: String, required: true },
//   quantity: { type: Number, required: true, min: 1 },
//   specialInstructions: { type: String, default: '' },
  
//   // Order Details
//   totalAmount: { type: Number, required: true },
//   orderStatus: { 
//     type: String, 
//     enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending'
//   },
  
//   // Timestamps
//   orderDate: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // Update the updatedAt field before saving
// orderSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const Order = mongoose.model('Order', orderSchema);

// export default Order;
// import mongoose from 'mongoose';

// const orderSchema = new mongoose.Schema({
//   user: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   customerName: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },
//   address: { type: String, required: true },

//   productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   productTitle: { type: String, required: true },
//   productPrice: { type: Number, required: true },

//   size: { type: String, required: true },
//   color: { type: String, required: true },
//   quantity: { type: Number, required: true, min: 1 },
//   specialInstructions: { type: String, default: '' },

//   totalAmount: { type: Number, required: true },
//   orderStatus: { 
//     type: String, 
//     enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending'
//   },

//   orderDate: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// orderSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const Order = mongoose.model('Order', orderSchema);

// export default Order;

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // User and Product References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Customer Information
  customerName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },

  // Product Details
  productImage: {
    type: [String],
    required: true
  },
  productTitle: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },

  // Order Specifications
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: {
    type: String,
    default: ''
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'cod', 'online'], // Added 'cod' to the enum
    required: true,
    default: 'cod' // Changed default to 'cod'
  },
  paymentSlip: {
    type: String, // URL of the uploaded payment slip
    required: function() {
      return this.paymentMethod === 'online';
    }
  },

  // Order Details
  totalAmount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
orderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;