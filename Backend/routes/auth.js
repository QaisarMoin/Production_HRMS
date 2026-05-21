const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const ApiResponse = require('../utils/apiResponse');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    // body('department').trim().notEmpty().withMessage('Department is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      console.log('Registration request received:', req.body);
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return ApiResponse.validationError(res, 'Validation failed', errors.array());
      }

      const { firstName, lastName, email, mobile, password } = req.body;
      console.log('Extracted data:', { firstName, lastName, email, mobile });

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('User already exists:', email);
        return ApiResponse.error(res, 'User with this email already exists', null, 400);
      }

      // Find department by name, create if not exists
      // let dept = await Department.findOne({ name: department });
      // if (!dept) {
      //   console.log('Creating new department:', department);
      //   dept = await Department.create({
      //     name: department,
      //     code: department.toUpperCase().substring(0, 3),
      //     description: `${department} Department`,
      //     isActive: true
      //   });
      //   console.log('Department created:', dept);
      // }

      // Create user
      console.log('Creating user...');
      const user = await User.create({
        firstName,
        lastName,
        email,
        mobile,
        password,
        // department: dept._id,
        role: req.body.role || 'admin', // Default to admin for full dynamic config access
        isActive: true
      });
      console.log('User created:', user._id);

      // Create token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      console.log('Token created');

      // Remove password from response and populate department
      const userResponse = await User.findById(user._id).populate('department').select('-password');
      console.log('Sending response');

      return ApiResponse.created(res, 'Registration successful', {
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error stack:', error.stack);
      return ApiResponse.error(res, error.message || 'Error during registration', null, 500);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, 'Validation failed', errors.array());
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        return ApiResponse.unauthorized(res, 'Your account has been deactivated');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Create token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return ApiResponse.success(res, 'Login successful', {
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return ApiResponse.error(res, 'Error during login', null, 500);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // User will be set by auth middleware
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authorized');
    }

    return ApiResponse.success(res, 'User fetched successfully', req.user);
  } catch (error) {
    console.error('Get user error:', error);
    return ApiResponse.error(res, 'Error fetching user', null, 500);
  }
});

module.exports = router;