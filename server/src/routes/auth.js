const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/creator/register', validate(['name', 'email', 'password']), authController.registerCreator);
router.post('/creator/login', validate(['email', 'password']), authController.loginCreator);

router.post('/brand/register', validate(['name', 'email', 'password']), authController.registerBrand);
router.post('/brand/login', validate(['email', 'password']), authController.loginBrand);

router.post('/login', validate(['email', 'password']), authController.login);
router.post('/google-login', authController.googleLogin);

router.get('/me', verifyToken, authController.getMe);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
