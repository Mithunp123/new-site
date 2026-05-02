const bcrypt = require('bcrypt');
exports.hashPassword = (password) => bcrypt.hash(password, 10);
exports.comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
