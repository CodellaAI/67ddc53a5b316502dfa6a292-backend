
const express = require('express');
const { search } = require('../controllers/search');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, search);

module.exports = router;
