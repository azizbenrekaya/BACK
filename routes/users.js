var express = require('express')
var router = express.Router()
const authController = require('../controllers/auth.controller');

router.post("/register", authController.signUp);
router.post("/login", authController.login);
router.post("/geo", authController.testgeo);
router.post("/geocode", authController.geocode);




module.exports = router;