const Device = require('../models/device');

module.exports.update = async (req,res) => {
  try {
    Device.findOneAndUpdate({_id : req.body._id } , req.body , { res: true} , function (err,d) {
     
     res.json(d)
  });

  }
  catch(err) {
     res.json("error")
  }

}

module.exports.adddevice = async (req, res) => {
    try {
      //const user = await User.create({nom, prenom, email, password });
      //res.status(201).json({ user: user._id});
      Device.findOne({ id_device: req.body.iddevice }).then(dev => {
        if (!dev) {
          var dev = new Device({
            id_device : req.body.iddevice,
            cite : req.body.cite
          }); 
          dev.save((err, user) => {
            if (err) res.json(err);
            else res.status(201).json("Device Created");
          });
    }
    else {
        res.status(403).json("Device already exist")
      }

    }) }

    catch(err) {
      //const errors = signUpErrors(err);
      res.json("erreur")
    }
  }

  module.exports.getalldevices = async (req, res) => { 
    try { 
      Device.find((err, c) => {

        if(err)
            res.json(err)
        else
            res.json(c)
    });
    }
    catch(err){res.json("error")}

  }