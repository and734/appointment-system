const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Function to generate JWT
const generateToken = (user) => {
  // Create payload: include only non-sensitive info needed by frontend/JWT strategy
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
    // DO NOT include password hash or other sensitive data
  };

  // Sign the token
  const token = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return token;
};

module.exports = {
  generateToken,
};
