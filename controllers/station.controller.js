const Station = require('../models/station');
module.exports.addstation = async (req, res) => {
    try {
        //const user = await User.create({nom, prenom, email, password });
        //res.status(201).json({ user: user._id});
        Station.findOne({ name: req.body.name}).then(station => {
          if (!station) {
            var station = new Station({
              name:req.body.name,
              localisation : req.body.localisation,
              cite:req.body.cite
            }); 
           station.save((err, user) => {
              if (err) res.json(err);
              else res.status(201).json("StationCreated");
            });
      }
      else {
          res.status(403).json("Station already exist")
        }
  
      }) }
  
      catch(err) {
        //const errors = signUpErrors(err);
        res.json("erreur")
      }
  }

  module.exports.getallstations= async (req, res) => { 
    try { 
      Station.find((err, c) => {

        if(err)
            res.json(err)
        else
            res.json(c)
    });
    }
    catch(err){res.json("error")}

  }
  module.exports.updatestation= async (req, res) => { 
    try { 
      Station.findOneAndUpdate({_id : req.body._id} , req.body , { res: true} , function (err,u) {
        if (err) res.json(err)
        else res.json(u)
    });
    }
    catch(err){res.json("error")}

  }
  
  module.exports.delete= async (req, res) => { 
    try { 
      Station.remove({ _id : req.body.id } , function (err, obj) {
        if (err) throw err;
    });

    }
    catch(err){res.json("error")}

  }