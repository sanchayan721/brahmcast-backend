const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

router.post('/validate-login-info', registerController.validateLoginInfo);
router.post('/resend-otp', registerController.resendOTP);
router.post('/validate-otp', registerController.validateOTP);
/* router.post('/', registerController.handleNewUser); */

module.exports = router;