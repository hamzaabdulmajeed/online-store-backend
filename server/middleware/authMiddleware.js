// // middleware/authMiddleware.js
// import jwt from 'jsonwebtoken';

// const auth = (req, res, next) => {
//   const token = req.headers.authorization;
//   if (!token) return res.status(401).json({ message: 'No token provided' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

//  const protectAdmin = (req, res, next) => {
//    const token = req.headers.authorization?.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (decoded.isAdmin) {
//       req.user = decoded;
//       next();
//     } else {
//       res.status(403).json({ message: 'Admin access required' });
//     }
//   } catch {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };
// export default auth;
// export {protectAdmin} 
// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, isAdmin }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isAdmin) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default auth;
export { protectAdmin };
