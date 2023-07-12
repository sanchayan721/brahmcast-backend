const express = require('express');
const router = express.Router();
const studioController = require('../controllers/studioController');

router.post('/add-new-studio', studioController.handleNewStudio);

module.exports = router;