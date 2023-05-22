const express = require('express');
const { registration, login, getRefreshToken } = require('../controller/authContoller');

const router = express.Router();

router.route('/signup')
    .post(registration)

router.route('/login')
    .post(login)

router.route('/getRefresh').post(getRefreshToken);

module.exports = router;