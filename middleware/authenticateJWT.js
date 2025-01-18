const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const user = jwt.verify(token, "jv6HvejFUWfQR//1ghNM0JiHGw47N6QLcLNIBsRiCMg=");
      console.log('Decoded JWT:', user); // Log the decoded token
      req.user = user;
      next();
    } catch (err) {
      console.error('JWT verification failed:', err);
      return res.sendStatus(403);
    }
  } else {
    console.log('Authorization header not found');
    res.sendStatus(401);
  }
};

module.exports = { authenticateJWT }; 