
const Trend = require('../models/Trend');

// @desc    Get trending topics
// @route   GET /api/trends
// @access  Public (with optional auth)
exports.getTrends = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    // For demo purposes, create some sample trends if none exist
    const trendsCount = await Trend.countDocuments();
    
    if (trendsCount === 0) {
      const sampleTrends = [
        { topic: '#JavaScript', tweetCount: 12500, location: 'Worldwide' },
        { topic: '#ReactJS', tweetCount: 8300, location: 'United States' },
        { topic: '#WebDevelopment', tweetCount: 5200, location: 'Worldwide' },
        { topic: '#NextJS', tweetCount: 4100, location: 'United Kingdom' },
        { topic: '#TailwindCSS', tweetCount: 3700, location: 'Worldwide' },
        { topic: '#MongoDB', tweetCount: 2900, location: 'India' },
        { topic: '#NodeJS', tweetCount: 2600, location: 'Worldwide' },
        { topic: '#ExpressJS', tweetCount: 1800, location: 'Canada' },
        { topic: '#FullStack', tweetCount: 1500, location: 'Worldwide' },
        { topic: '#ChirpSocial', tweetCount: 1200, location: 'Worldwide', promoted: true }
      ];
      
      await Trend.insertMany(sampleTrends);
    }

    const trends = await Trend.find()
      .sort({ tweetCount: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json(trends);
  } catch (error) {
    next(error);
  }
};
