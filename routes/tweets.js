
const express = require('express');
const { 
  createTweet, 
  getTweets, 
  getTweet, 
  deleteTweet, 
  likeTweet, 
  unlikeTweet, 
  retweet, 
  unretweet, 
  replyToTweet, 
  getTimeline
} = require('../controllers/tweets');
const { protect, optionalAuth } = require('../middleware/auth');
const { 
  tweetValidator, 
  tweetIdValidator, 
  validateRequest 
} = require('../middleware/validators');

const router = express.Router();

// Public/optional auth routes
router.get('/', optionalAuth, getTweets);
router.get('/timeline', protect, getTimeline);
router.get('/:id', tweetIdValidator, validateRequest, optionalAuth, getTweet);

// Protected routes
router.post('/', protect, tweetValidator, validateRequest, createTweet);
router.delete('/:id', protect, tweetIdValidator, validateRequest, deleteTweet);
router.post('/:id/like', protect, tweetIdValidator, validateRequest, likeTweet);
router.delete('/:id/like', protect, tweetIdValidator, validateRequest, unlikeTweet);
router.post('/:id/retweet', protect, tweetIdValidator, validateRequest, retweet);
router.delete('/:id/retweet', protect, tweetIdValidator, validateRequest, unretweet);
router.post('/:id/reply', protect, tweetIdValidator, tweetValidator, validateRequest, replyToTweet);

module.exports = router;
