var express = require('express')
var router = express.Router()
const devController = require('../controllers/device.controller');

router.post("/add", devController.adddevice);
router.get("/getall",devController.getalldevices)





module.exports = router;