
const User = require('../models/User');
const Tweet = require('../models/Tweet');

// @desc    Search for users and tweets
// @route   GET /api/search
// @access  Public (with optional auth)
exports.search = async (req, res, next) => {
  try {
    const { q: query, type = 'all' } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let results = [];

    // Search based on type
    if (type === 'users' || type === 'all') {
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } }
        ]
      })
        .select('name username profileImageUrl bio')
        .limit(type === 'users' ? limit : 5);

      if (type === 'users') {
        results = users;
      } else {
        results.push(...users.map(user => ({ ...user.toObject(), type: 'user' })));
      }
    }

    if (type === 'tweets' || type === 'all') {
      const tweets = await Tweet.find({
        content: { $regex: query, $options: 'i' }
      })
        .sort({ createdAt: -1 })
        .skip(type === 'tweets' ? skip : 0)
        .limit(type === 'tweets' ? limit : 10)
        .populate('user', 'name username profileImageUrl');

      if (type === 'tweets') {
        results = tweets;
      } else {
        results.push(...tweets.map(tweet => ({ ...tweet.toObject(), type: 'tweet' })));
      }
    }

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
