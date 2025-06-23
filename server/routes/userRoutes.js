// import express from 'express';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// import User from '../models/user.js';

// const router = express.Router();

// // POST /api/auth/login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) return res.status(400).json({ message: 'User not found' });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign(
//     { userId: user._id, isAdmin: user.isAdmin },
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );

//   res.json({ token });
// });

// export default router;

// import express from 'express';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// import User from '../models/user.js';

// const router = express.Router();

// // POST /api/auth/signup (User Signup)
// router.post('/signup', async (req, res) => {
//   try {
//     const { email, password, name } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: 'User already exists' });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({
//       email,
//       password: hashedPassword,
//       name,
//       isAdmin: false, // by default, normal users are not admins
//     });

//     await newUser.save();

//     const token = jwt.sign(
//       { userId: newUser._id, isAdmin: newUser.isAdmin },
//       process.env.JWT_SECRET,
//       { expiresIn: '1d' }
//     );

//     res.status(201).json({ token });
//   } catch (err) {
//     res.status(500).json({ message: 'Error signing up user' });
//   }
// });

// POST /api/auth/login (User/Admin Login)
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
  
//   const user = await User.findOne({ email });
//   if (!user) return res.status(400).json({ message: 'User not found' });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign(
//     { userId: user._id, isAdmin: user.isAdmin },
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );

//   res.json({ token });
// });
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
  
//   const user = await User.findOne({ email });
//   if (!user) return res.status(400).json({ message: 'User not found' });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) return res.status(401).json({ message: 'Invalid credentials' });

//   const token = jwt.sign(
//     { userId: user._id, isAdmin: user.isAdmin },
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );

//   // Return both token and user info
//   res.json({ 
//     token,
//     user: {
//       id: user._id,
//       email: user.email,
//       name: user.name,
//       isAdmin: user.isAdmin
//     }
//   });
// });

// export default router;
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

const router = express.Router();

// POST /api/auth/signup (User Signup)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      isAdmin: false, // by default, normal users are not admins
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, isAdmin: newUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return both token and user info so user doesn't need to login again
    res.status(201).json({ 
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error signing up user' });
  }
});

// POST /api/auth/login (User Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return both token and user info
    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in user' });
  }
});

export default router;