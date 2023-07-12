const Creator = require('../model/Creator');

const handleNewProjectOwner = (req, res) => {

}

module.exports = { handleNewProjectOwner };

const express = require('express');
const router = express.Router();
const projectOwnerController = require('../controllers/projectOwnerController');

router.post('/add-new-projectOwner', projectOwnerController.handleNewProjectOwner);

module.exports = router;