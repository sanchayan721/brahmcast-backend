const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');

router.post('/add-new-creator', creatorController.handleNewCreator);

module.exports = router;