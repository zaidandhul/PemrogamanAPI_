const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, authController.getMe);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
