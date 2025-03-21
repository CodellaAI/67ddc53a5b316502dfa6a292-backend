
const express = require('express');
const { 
  getUserProfile, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  getUserTweets, 
  getSuggestedUsers, 
  getFollowers, 
  getFollowing 
} = require('../controllers/users');
const { protect, optionalAuth } = require('../middleware/auth');
const { 
  usernameValidator, 
  userIdValidator, 
  profileUpdateValidator, 
  validateRequest 
} = require('../middleware/validators');

const router = express.Router();

router.get('/suggestions', optionalAuth, getSuggestedUsers);
router.get('/:username', usernameValidator, validateRequest, optionalAuth, getUserProfile);
router.get('/:username/tweets', usernameValidator, validateRequest, optionalAuth, getUserTweets);
router.get('/:username/followers', usernameValidator, validateRequest, optionalAuth, getFollowers);
router.get('/:username/following', usernameValidator, validateRequest, optionalAuth, getFollowing);

// Protected routes
router.put('/profile', protect, profileUpdateValidator, validateRequest, updateProfile);
router.post('/:id/follow', protect, userIdValidator, validateRequest, followUser);
router.delete('/:id/follow', protect, userIdValidator, validateRequest, unfollowUser);

module.exports = router;
