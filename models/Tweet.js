
const mongoose = require('mongoose');

const TweetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide tweet content'],
    trim: true,
    maxlength: [280, 'Tweet cannot be more than 280 characters']
  },
  image: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  retweetedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  retweetCount: {
    type: Number,
    default: 0
  },
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tweet'
  },
  isReply: {
    type: Boolean,
    default: false
  },
  isRetweet: {
    type: Boolean,
    default: false
  },
  originalTweet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tweet'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for replies
TweetSchema.virtual('replies', {
  ref: 'Tweet',
  localField: '_id',
  foreignField: 'replyTo',
  justOne: false
});

// Define indexes
TweetSchema.index({ user: 1, createdAt: -1 });
TweetSchema.index({ content: 'text' });

module.exports = mongoose.model('Tweet', TweetSchema);
