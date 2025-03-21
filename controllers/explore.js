
const Tweet = require('../models/Tweet');
const User = require('../models/User');

// @desc    Get content for explore page
// @route   GET /api/explore
// @access  Public (with optional auth)
exports.getExploreContent = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get popular tweets (most likes and retweets)
    const tweets = await Tweet.find()
      .sort({ 
        retweetCount: -1, 
        'likes.length': -1, 
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username profileImageUrl')
      .populate({
        path: 'originalTweet',
        populate: {
          path: 'user',
          select: 'name username profileImageUrl'
        }
      });

    res.status(200).json(tweets);
  } catch (error) {
    next(error);
  }
};
