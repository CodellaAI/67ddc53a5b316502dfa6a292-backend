
const { body, param, validationResult } = require('express-validator');

// Helper function to check validation results
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validators
exports.registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 15 }).withMessage('Username must be between 3 and 15 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password').trim().notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

exports.loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password').trim().notEmpty().withMessage('Password is required')
];

// Tweet validators
exports.tweetValidator = [
  body('content').trim().notEmpty().withMessage('Tweet content is required')
    .isLength({ max: 280 }).withMessage('Tweet cannot exceed 280 characters')
];

exports.tweetIdValidator = [
  param('id').isMongoId().withMessage('Invalid tweet ID')
];

// User validators
exports.usernameValidator = [
  param('username').trim().notEmpty().withMessage('Username is required')
];

exports.userIdValidator = [
  param('id').isMongoId().withMessage('Invalid user ID')
];

exports.profileUpdateValidator = [
  body('name').optional().trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('bio').optional().trim()
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('location').optional().trim()
    .isLength({ max: 30 }).withMessage('Location cannot exceed 30 characters'),
  body('website').optional().trim()
    .isURL({ require_protocol: false }).withMessage('Please provide a valid URL')
];

// Search validators
exports.searchValidator = [
  body('query').trim().notEmpty().withMessage('Search query is required')
];
