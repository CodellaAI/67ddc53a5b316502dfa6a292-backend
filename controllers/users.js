
const User = require('../models/User');
const Tweet = require('../models/Tweet');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public (with optional auth)
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the logged-in user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = user.followers.includes(req.user.id);
    }

    // Format the response
    const userProfile = {
      ...user.toObject(),
      isFollowing
    };

    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, location, website } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (website !== undefined) updateFields.website = website;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to follow themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if already following
    if (userToFollow.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Add to following/followers
    await User.findByIdAndUpdate(req.user.id, {
      $push: { following: userToFollow._id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user.id }
    });

    // Update counts
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    
    await currentUser.updateCounts();
    await targetUser.updateCounts();

    // Create notification
    await Notification.create({
      user: userToFollow._id,
      from: req.user.id,
      type: 'follow'
    });

    res.status(200).json({ 
      success: true,
      message: `You are now following ${userToFollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    // Check if user exists
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if actually following
    if (!userToUnfollow.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Remove from following/followers
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: userToUnfollow._id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id }
    });

    // Update counts
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    
    await currentUser.updateCounts();
    await targetUser.updateCounts();

    res.status(200).json({ 
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user tweets
// @route   GET /api/users/:username/tweets
// @access  Public (with optional auth)
exports.getUserTweets = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find({ user: user._id })
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

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Public (with optional auth)
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
    
    let query = {};
    
    // If user is logged in, exclude users they already follow
    if (req.user) {
      query = {
        _id: { $ne: req.user.id },
        followers: { $ne: req.user.id }
      };
    }
    
    const users = await User.find(query)
      .select('name username profileImageUrl bio')
      .limit(limit);
    
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user followers
// @route   GET /api/users/:username/followers
// @access  Public (with optional auth)
exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const followers = await User.find({ _id: { $in: user.followers } })
      .select('name username profileImageUrl bio')
      .skip(skip)
      .limit(limit);

    res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:username/following
// @access  Public (with optional auth)
exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const following = await User.find({ _id: { $in: user.following } })
      .select('name username profileImageUrl bio')
      .skip(skip)
      .limit(limit);

    res.status(200).json(following);
  } catch (error) {
    next(error);
  }
};
