const crypto = require('crypto');

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('base64');
};

const secretKey = generateSecretKey();
console.log('Generated JWT Secret Key:', secretKey);

