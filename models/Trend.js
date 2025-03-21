
const mongoose = require('mongoose');

const TrendSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tweetCount: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: 'Worldwide'
  },
  promoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Define indexes
TrendSchema.index({ tweetCount: -1 });

module.exports = mongoose.model('Trend', TrendSchema);
