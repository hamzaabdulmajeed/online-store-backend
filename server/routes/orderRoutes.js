import express from 'express';
import Order from '../models/order.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      productId,
      productImage,
      productTitle,
      productPrice,
      size,
      color,
      quantity,
      specialInstructions,
      totalAmount,
      user,
      paymentMethod,
      paymentSlip
    } = req.body;

    // Validation: if payment is online, slip must be present
    if (paymentMethod === 'online' && !paymentSlip) {
      return res.status(400).json({ 
        message: 'Payment slip is required for online payments.',
        error: 'PAYMENT_SLIP_REQUIRED'
      });
    }

    // Additional validations
    if (!customerName || !email || !phone || !address) {
      return res.status(400).json({
        message: 'Required customer information is missing',
        error: 'MISSING_CUSTOMER_INFO'
      });
    }

    if (!productId || !totalAmount || !user) {
      return res.status(400).json({
        message: 'Required order information is missing',
        error: 'MISSING_ORDER_INFO'
      });
    }

    const newOrder = new Order({
      customerName,
      email,
      phone,
      address,
      productId,
      productImage,
      productTitle,
      productPrice,
      size,
      color,
      quantity,
      specialInstructions,
      totalAmount,
      user,
      paymentMethod,
      paymentSlip
    });

    await newOrder.save();

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: newOrder,
      orderId: newOrder._id 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid data format', 
        error: 'INVALID_DATA_FORMAT'
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error', 
      error: 'SERVER_ERROR',
      details: error.message 
    });
  }
});

// GET /api/orders - Get all orders (admin only)

router.get('/', protectAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('productId', 'title image colors sizes') // Added colors and sizes
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id - Get single order (admin only)

router.get('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId', 'title image price colors sizes'); // Added colors and sizes
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/user/:userId - Get orders for a specific user (public)
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('productId', 'title image price colors sizes') // Added colors and sizes
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      customerName,
      email,
      phone,
      address,
      size,
      color,
      quantity,
      specialInstructions
    } = req.body;

    // Find the order first
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Check if order can be updated (use orderStatus instead of status)
    const nonUpdatableStatuses = ['shipped', 'delivered', 'cancelled'];
    if (nonUpdatableStatuses.includes(order.orderStatus?.toLowerCase())) {
      return res.status(409).json({ 
        error: `Order cannot be updated. Current status: ${order.orderStatus}` 
      });
    }

    // ... rest of validation code stays the same ...

    // Calculate new total amount
    const newTotalAmount = order.productPrice * quantity;

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        customerName,
        email,
        phone,
        address,
        size,
        color,
        quantity,
        specialInstructions,
        totalAmount: newTotalAmount,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('productId', 'title image price');

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid order ID format' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error while updating order' 
    });
  }
});

// Fix for Cancel Order Route
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order first
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Check if order can be cancelled (use orderStatus instead of status)
    const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled'];
    if (nonCancellableStatuses.includes(order.orderStatus?.toLowerCase())) {
      return res.status(409).json({ 
        error: `Order cannot be cancelled. Current status: ${order.orderStatus}` 
      });
    }

    // Update order status to cancelled (use orderStatus field)
    const cancelledOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'cancelled', // Changed from status to orderStatus
        cancelledAt: new Date(),
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('productId', 'title image price');

    res.json({
      message: 'Order cancelled successfully',
      order: cancelledOrder
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid order ID format' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error while cancelling order' 
    });
  }
});


// Optional: Get single order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('productId', 'title image price colors sizes') // Added colors and sizes
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    res.json(order);

  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid order ID format' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error while fetching order' 
    });
  }
});

// GET /api/orders/stats/summary - Get order statistics (admin only)

router.get('/stats/summary', protectAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('productId', 'title colors sizes') // Added colors and sizes
      .sort({ orderDate: -1 })
      .limit(5);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;


// import Order from '../models/order.js';
// import { protectAdmin } from '../middleware/authMiddleware.js';
// import auth from '../middleware/authMiddleware.js';

// const router = express.Router();

// // POST /api/orders - Create a new order (authenticated users)
// router.post('/', auth, async (req, res) => {
//   try {
//     const {
//       customerName,
//       email,
//       phone,
//       address,
//       productId,
//       productTitle,
//       productPrice,
//       size,
//       color,
//       quantity,
//       specialInstructions,
//       totalAmount
//     } = req.body;

//     const newOrder = new Order({
//       customerName,
//       email,
//       phone,
//       address,
//       productId,
//       productTitle,
//       productPrice,
//       size,
//       color,
//       quantity,
//       specialInstructions,
//       totalAmount,
//       user: req.user.userId // Link order to authenticated user
//     });

//     await newOrder.save();

//     res.status(201).json({ 
//       message: 'Order placed successfully', 
//       order: newOrder,
//       orderId: newOrder._id 
//     });
//   } catch (error) {
//     console.error('Error creating order:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // GET /api/orders/my-orders - Get current user's orders
// router.get('/my-orders', auth, async (req, res) => {
//   try {
//     const { status, page = 1, limit = 10 } = req.query;
    
//     let query = { user: req.user.userId };
//     if (status && status !== 'all') {
//       query.orderStatus = status;
//     }

//     const orders = await Order.find(query)
//       .populate('productId', 'title image')
//       .sort({ orderDate: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Order.countDocuments(query);

//     res.json({
//       orders,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching user orders:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/orders/my-orders/:id - Get single user order
// router.get('/my-orders/:id', auth, async (req, res) => {
//   try {
//     const order = await Order.findOne({ 
//       _id: req.params.id, 
//       user: req.user.userId 
//     }).populate('productId');
    
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
//     res.json(order);
//   } catch (error) {
//     console.error('Error fetching order:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // PUT /api/orders/my-orders/:id - Update user's own order (only if pending/confirmed)
// router.put('/my-orders/:id', auth, async (req, res) => {
//   try {
//     const {
//       customerName,
//       email,
//       phone,
//       address,
//       size,
//       color,
//       quantity,
//       specialInstructions
//     } = req.body;

//     // Find the order and check if it belongs to the user
//     const order = await Order.findOne({ 
//       _id: req.params.id, 
//       user: req.user.userId 
//     });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     // Only allow editing if order is pending or confirmed
//     if (!['pending', 'confirmed'].includes(order.orderStatus)) {
//       return res.status(400).json({ 
//         message: 'Cannot edit order. Order is already being processed.' 
//       });
//     }

//     // Calculate new total amount if quantity changed
//     let totalAmount = order.totalAmount;
//     if (quantity && quantity !== order.quantity) {
//       totalAmount = order.productPrice * quantity;
//     }

//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       {
//         customerName: customerName || order.customerName,
//         email: email || order.email,
//         phone: phone || order.phone,
//         address: address || order.address,
//         size: size || order.size,
//         color: color || order.color,
//         quantity: quantity || order.quantity,
//         specialInstructions: specialInstructions !== undefined ? specialInstructions : order.specialInstructions,
//         totalAmount,
//         updatedAt: Date.now()
//       },
//       { new: true }
//     ).populate('productId');

//     res.json({ 
//       message: 'Order updated successfully', 
//       order: updatedOrder 
//     });
//   } catch (error) {
//     console.error('Error updating order:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // PUT /api/orders/my-orders/:id/cancel - Cancel user's own order
// router.put('/my-orders/:id/cancel', auth, async (req, res) => {
//   try {
//     const order = await Order.findOne({ 
//       _id: req.params.id, 
//       user: req.user.userId 
//     });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     // Only allow cancelling if order is not delivered or already cancelled
//     if (['delivered', 'cancelled'].includes(order.orderStatus)) {
//       return res.status(400).json({ 
//         message: `Cannot cancel order. Order is already ${order.orderStatus}.` 
//       });
//     }

//     const cancelledOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       { 
//         orderStatus: 'cancelled', 
//         updatedAt: Date.now() 
//       },
//       { new: true }
//     ).populate('productId');

//     res.json({ 
//       message: 'Order cancelled successfully', 
//       order: cancelledOrder 
//     });
//   } catch (error) {
//     console.error('Error cancelling order:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Admin routes (existing)
// // GET /api/orders - Get all orders (admin only)
// router.get('/', protectAdmin, async (req, res) => {
//   try {
//     const { status, page = 1, limit = 20 } = req.query;
    
//     let query = {};
//     if (status && status !== 'all') {
//       query.orderStatus = status;
//     }

//     const orders = await Order.find(query)
//       .populate('productId', 'title image')
//       .populate('user', 'email')
//       .sort({ orderDate: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Order.countDocuments(query);

//     res.json({
//       orders,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/orders/:id - Get single order (admin only)
// router.get('/:id', protectAdmin, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('productId')
//       .populate('user', 'email');
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
//     res.json(order);
//   } catch (error) {
//     console.error('Error fetching order:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // PUT /api/orders/:id/status - Update order status (admin only)
// router.put('/:id/status', protectAdmin, async (req, res) => {
//   try {
//     const { status } = req.body;
    
//     const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: 'Invalid status' });
//     }

//     const order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { orderStatus: status, updatedAt: Date.now() },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     res.json({ message: 'Order status updated', order });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET /api/orders/stats/summary - Get order statistics (admin only)
// router.get('/stats/summary', protectAdmin, async (req, res) => {
//   try {
//     const totalOrders = await Order.countDocuments();
//     const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
//     const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    
//     const totalRevenue = await Order.aggregate([
//       { $match: { orderStatus: { $ne: 'cancelled' } } },
//       { $group: { _id: null, total: { $sum: '$totalAmount' } } }
//     ]);

//     const recentOrders = await Order.find()
//       .populate('productId', 'title')
//       .populate('user', 'email')
//       .sort({ orderDate: -1 })
//       .limit(5);

//     res.json({
//       totalOrders,
//       pendingOrders,
//       completedOrders,
//       totalRevenue: totalRevenue[0]?.total || 0,
//       recentOrders
//     });
//   } catch (error) {
//     console.error('Error fetching order stats:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// export default router;