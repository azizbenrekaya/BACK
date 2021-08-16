const User = require('../models/user');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcrypt");
var geo = require('mapbox-geocoding');
var NodeGeocoder = require('node-geocoder');
geo.setAccessToken('pk.eyJ1IjoiYXppemJlbnJla2F5YSIsImEiOiJja24zbXBncmExZnUzMnBxdWkzdDRwbnlsIn0.845vZZjC-1vASHA1sS70wg');
var ACCESS_TOKEN = 'pk.eyJ1IjoiYXppemJlbnJla2F5YSIsImEiOiJja24zbXBncmExZnUzMnBxdWkzdDRwbnlsIn0.845vZZjC-1vASHA1sS70wg';
module.exports.signUp = async (req, res) => {
    try {
      //const user = await User.create({nom, prenom, email, password });
      //res.status(201).json({ user: user._id});
      User.findOne({ email: req.body.email }).then(user => {
        if (!user) {
          var user = new User({
            nom : req.body.nom,
            prenom : req.body.prenom,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
          }); 
          user.save((err, user) => {
            if (err) res.json(err);
            else res.status(201).json("User Created");
          });
    }
    else {
        res.status(403).json("User already exist")
      }

    }) }

    catch(err) {
      //const errors = signUpErrors(err);
      res.json("erreur")
    }
  }


  module.exports.login = async (req, res) => { 
    try {
      User.findOne({email:req.body.email},(err,user)=>{
        if(err) res.json(err)
        if(!user) res.json("check your logins");
        else {
          if(bcrypt.compareSync(req.body.password,user.password)){
            var token = jwt.sign({user},'secret',{expiresIn:3600})
              res.status(200).json({
        id: user._id,
        nom: user.nom,
        prenom : user.prenom,
        email: user.email,
        accessToken: token
      });
          }else{
            res.json("incorrect password")
          }
        }
      })
    }
    catch {
      res.json("error")
    }
   

  }

  module.exports.testgeo = async (req, res) => {
    try {
      geo.geocode('mapbox.places', req.body.place, function (err, geoData) {
        res.json(geoData);
    })
     }

    catch(err) {
      //const errors = signUpErrors(err);
      res.json("erreur")
    }
  }

  var geocoder = NodeGeocoder({
    provider: 'opencage',
    apiKey: '67135ca3236e43da8bbe4d54eb06f753',
    countrycode:"tn",
    language:"fr"
  });

  module.exports.geocode = async (req, res) => {
    try {
      geocoder.geocode(req.body.place, function(err, geo) {
        res.json(geo)
      });
     }

    catch(err) {
      //const errors = signUpErrors(err);
      res.json("erreur")
    }
  }
