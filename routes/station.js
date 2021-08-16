var express = require('express')
var router = express.Router()
const stationController = require('../controllers/station.controller');

router.post("/addstation", stationController.addstation);
router.get("/getallstations", stationController.getallstations);
router.post("/updatestation",stationController.updatestation);
router.post("/delete",stationController.delete);





module.exports = router;