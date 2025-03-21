
const express = require('express');
const { 
  register, 
  login, 
  logout, 
  getMe, 
  updatePassword 
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { 
  registerValidator, 
  loginValidator, 
  validateRequest 
} = require('../middleware/validators');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
