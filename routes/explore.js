
const express = require('express');
const { getExploreContent } = require('../controllers/explore');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getExploreContent);

module.exports = router;
