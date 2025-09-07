const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const storage = require('../storage/memory');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;

// Validation rules
const signUpValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('phone')
    .isMobilePhone()
    .withMessage('Must be a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const signInValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', signUpValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = storage.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    storage.users.push(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signup',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', signInValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = storage.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login',
    });
  }
});

module.exports = router;