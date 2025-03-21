
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a tweet
// @route   POST /api/tweets
// @access  Private
exports.createTweet = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    const tweet = await Tweet.create({
      user: req.user.id,
      content,
      image
    });

    // Populate user details
    await tweet.populate('user', 'name username profileImageUrl');

    res.status(201).json(tweet);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tweets (with filters)
// @route   GET /api/tweets
// @access  Public (with optional auth)
exports.getTweets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};
    
    // If replyTo query param is provided, filter by it
    if (req.query.replyTo) {
      query.replyTo = req.query.replyTo;
    }

    const tweets = await Tweet.find(query)
      .sort({ createdAt: -1 })
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

// @desc    Get a single tweet
// @route   GET /api/tweets/:id
// @access  Public (with optional auth)
exports.getTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
      .populate('user', 'name username profileImageUrl')
      .populate({
        path: 'originalTweet',
        populate: {
          path: 'user',
          select: 'name username profileImageUrl'
        }
      });

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Get replies to this tweet
    const replies = await Tweet.find({ replyTo: tweet._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name username profileImageUrl');

    res.status(200).json({
      tweet,
      replies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tweet
// @route   DELETE /api/tweets/:id
// @access  Private
exports.deleteTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check tweet belongs to user
    if (tweet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this tweet' });
    }

    await tweet.deleteOne();

    // Delete all notifications related to this tweet
    await Notification.deleteMany({ tweetId: req.params.id });

    res.status(200).json({ success: true, message: 'Tweet deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a tweet
// @route   POST /api/tweets/:id/like
// @access  Private
exports.likeTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if tweet is already liked
    if (tweet.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Tweet already liked' });
    }

    // Add user to likes array
    tweet.likes.push(req.user.id);
    await tweet.save();

    // Create notification (if the tweet is not from the same user)
    if (tweet.user.toString() !== req.user.id) {
      await Notification.create({
        user: tweet.user,
        from: req.user.id,
        type: 'like',
        tweetId: tweet._id
      });
    }

    res.status(200).json({ success: true, message: 'Tweet liked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a tweet
// @route   DELETE /api/tweets/:id/like
// @access  Private
exports.unlikeTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if tweet is not liked
    if (!tweet.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Tweet not liked yet' });
    }

    // Remove user from likes array
    tweet.likes = tweet.likes.filter(
      id => id.toString() !== req.user.id
    );
    await tweet.save();

    // Delete the notification if it exists
    await Notification.deleteOne({
      user: tweet.user,
      from: req.user.id,
      type: 'like',
      tweetId: tweet._id
    });

    res.status(200).json({ success: true, message: 'Tweet unliked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Retweet a tweet
// @route   POST /api/tweets/:id/retweet
// @access  Private
exports.retweet = async (req, res, next) => {
  try {
    const originalTweet = await Tweet.findById(req.params.id);

    if (!originalTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if already retweeted
    if (originalTweet.retweetedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already retweeted' });
    }

    // Create retweet
    const retweet = await Tweet.create({
      user: req.user.id,
      content: originalTweet.content,
      image: originalTweet.image,
      isRetweet: true,
      originalTweet: originalTweet._id
    });

    // Update original tweet
    originalTweet.retweetedBy.push(req.user.id);
    originalTweet.retweetCount += 1;
    await originalTweet.save();

    // Create notification (if the tweet is not from the same user)
    if (originalTweet.user.toString() !== req.user.id) {
      await Notification.create({
        user: originalTweet.user,
        from: req.user.id,
        type: 'retweet',
        tweetId: originalTweet._id
      });
    }

    // Populate response
    await retweet.populate('user', 'name username profileImageUrl');
    await retweet.populate({
      path: 'originalTweet',
      populate: {
        path: 'user',
        select: 'name username profileImageUrl'
      }
    });

    res.status(201).json(retweet);
  } catch (error) {
    next(error);
  }
};

// @desc    Undo a retweet
// @route   DELETE /api/tweets/:id/retweet
// @access  Private
exports.unretweet = async (req, res, next) => {
  try {
    const originalTweet = await Tweet.findById(req.params.id);

    if (!originalTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if not retweeted
    if (!originalTweet.retweetedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'Not retweeted yet' });
    }

    // Find and delete the retweet
    await Tweet.deleteOne({
      user: req.user.id,
      originalTweet: originalTweet._id,
      isRetweet: true
    });

    // Update original tweet
    originalTweet.retweetedBy = originalTweet.retweetedBy.filter(
      id => id.toString() !== req.user.id
    );
    originalTweet.retweetCount = Math.max(0, originalTweet.retweetCount - 1);
    await originalTweet.save();

    // Delete the notification if it exists
    await Notification.deleteOne({
      user: originalTweet.user,
      from: req.user.id,
      type: 'retweet',
      tweetId: originalTweet._id
    });

    res.status(200).json({ success: true, message: 'Retweet removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a tweet
// @route   POST /api/tweets/:id/reply
// @access  Private
exports.replyToTweet = async (req, res, next) => {
  try {
    const parentTweet = await Tweet.findById(req.params.id);

    if (!parentTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    const { content, image } = req.body;

    // Create the reply
    const reply = await Tweet.create({
      user: req.user.id,
      content,
      image,
      replyTo: parentTweet._id,
      isReply: true
    });

    // Populate user details
    await reply.populate('user', 'name username profileImageUrl');

    // Create notification (if the tweet is not from the same user)
    if (parentTweet.user.toString() !== req.user.id) {
      await Notification.create({
        user: parentTweet.user,
        from: req.user.id,
        type: 'reply',
        tweetId: parentTweet._id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      });
    }

    res.status(201).json(reply);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user timeline (tweets from followed users)
// @route   GET /api/tweets/timeline
// @access  Private
exports.getTimeline = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get list of users the current user is following
    const user = await User.findById(req.user.id);
    const following = [...user.following, req.user.id]; // Include current user's tweets

    // Find tweets from these users
    const tweets = await Tweet.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
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
