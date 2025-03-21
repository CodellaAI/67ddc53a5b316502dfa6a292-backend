
const express = require('express');
const { getTrends } = require('../controllers/trends');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getTrends);

module.exports = router;
