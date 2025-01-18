const jwt = require('jsonwebtoken');

const generateJWT = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
  };

  const token = jwt.sign(payload, "jv6HvejFUWfQR//1ghNM0JiHGw47N6QLcLNIBsRiCMg=", {
    expiresIn: '1h', // Token expires in 1 hour
  });

  return token;
};

module.exports = generateJWT;