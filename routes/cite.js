var express = require('express')
var router = express.Router()
const citeController = require('../controllers/cite.controller');

router.post("/addcite", citeController.addcite);
router.get("/getallcites", citeController.getallcite);
router.post("/gettemp",citeController.gettemp);
router.post("/getalldata",citeController.getalldata);
router.post("/update",citeController.update)
router.post("/delete",citeController.delete)
router.post("/getcurrent",citeController.getcurrentweather)




module.exports = router;