const express = require('express');
const router = express.Router();
const Sensor = require('../Models/Sensor');
const Data = require('../Models/Data');
var weather = require('openweather-apis');
var nodemailer = require("nodemailer");
//const User = require('../Models/User');
// const Shared = require('./shared');
// var Location = require('../Models/station');
const station = require('../models/station');
weather.setLang('en');
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const kafka = require('kafka-node');
var Kafka = require('no-kafka');
const XOAuth2 = require('nodemailer/lib/xoauth2');
const { json } = require('express');

function verifyToken(req, res, next) {
    let payload;

    if (req.query.token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    try {
        payload = jwt.verify(req.query.token, process.env.token_Key);
    } catch (e) {
        return res.status(400).send('Invalid User');
    }
    if (!payload) {
        return res.status(401).send('Unauthorized request');
    }

    decoded = jwt.decode(req.query.token, {complete: true});
    req.userId = decoded.payload.id;

    next()
}
router.get('/sensorswithrules',async (req,res) => {
    try { 
        Sensor.find({}, {name:1,SensorIdentifier:1,Rules:1}, function (err, sensors) {
            if (err) return next(err);
            let final = []
            for(let i=0;i<sensors.length;i++) {
                
                let SensorIdentifier = sensors[i].SensorIdentifier
                console.log(SensorIdentifier)
                console.log(sensors[i].Rules.length)
                for ( let j =0;j<sensors[i].Rules.length;j++){
                  if (sensors[i].Rules.length != null ){
                  let x = {"SensorIdentifier": SensorIdentifier, "Name":sensors[i].name  , "Rule": sensors[i].Rules[j].Type,
                  "Max":sensors[i].Rules[j].Tmax, "Min":sensors[i].Rules[j].Tmin
                }
                
                 final.push(x)
                }
                       }
             }
             res.json(final)
        }); 
      }
      catch(err){res.json("error")}

})

router.post('/updatesensor',async (req,res) => {
    
    try { 
        Sensor.findOne({_id:req.body._id} ,(err,sens) => {
           let x = {}
           let type = req.body.Type
           let tmin = req.body.Tmin
           let tmax = req.body.Tmax
            x = {Type :type,Tmax :tmax,Tmin :tmin}
            sens.Rules.push(x)
            
            sens.save()
           
            res.json("done")

         })
      }
      catch(err){res.json(err)}

})
router.post('/find',  async (req, res) => {
    try {
        console.log('Sensorid', req.body.Sensorid);
        // user = await User.findById(req.userId);
        // if (!user) {
        //     return res.json({status: "err", message: 'No User Found'});
        // }
        Sens = new Sensor();
        Sens = await Sensor.find({SensorIdentifier: req.body.Sensorid}).select('-data');
        if (Sens.length === 0) {
            console.log('Sens :', Sens);
            return res.json({status: "err", message: 'No Sensor Found !'});
        }
        Loc = await station.find({Sensor_ids: Sens[0]._id});
        console.log('loc', Loc.length);
        console.log('Sens._id', Sens[0].name);
        console.log('Sensor', Sens.length);
        if (Loc.length === 0) {
            return res.json({status: "ok", message: 'New Sensor have been Found !', SensorFoundId: Sens[0]._id});
        }
        return res.json({status: "err", message: 'Already in use'});
    } catch (e) {
        console.log(e);
    }
});

router.post('/Add',  async (req, res) => {
    try {
        //console.log(req.userId);
        ///user = await User.findById(req.userId);
        Loc = new station();
        Loc = await station.findById(req.body.LocationId);
        if (!Loc) {
            return res.status(400).json({status: "err", message: 'No Location Found'});
        }
        // if (!user) {
        //     return res.status(400).json({status: "err", message: 'No User Found'});
        // }
        Sens = await Sensor.findById(req.body.SensorId).select('-data');
        console.log('Sens :', Sens);
        if (Sens) {
            console.log('Sens :', Sens);
            console.log('req.body.SensorName:', req.body.SensorName);
            console.log('req.body.Description:', req.body.Description);
           // console.log('req.body.SensorCoordinates :', req.body.SensorCoordinates);
            Sens.name = req.body.SensorName;
            Sens.Description = req.body.Description;
            Sens.SensorLattitude = req.body.SensorLattitude;
            Sens.SensorLongitude = req.body.SensorLongitude;
            console.log('Loc :', Loc);
            NewSensor = await Sens.save();
            console.log('Sens 11111:', Sens._id);
            Loc.Sensor_ids.push(NewSensor._id);
            //console.log(user);
            await Loc.save();
            return res.json({status: "ok", message: 'New Sensor have been added !'});
        }


        console.log("error");
        return res.status(400).json({status: "err", message: 'Some kind of error'});
    } catch (e) {
        console.log(e);
    }
});
router.get('/', verifyToken, async (req, res) => {
    try {
        All_User_Locations = [];
        All_User_Sensors = [];
        user = await User.findById(req.userId);
        for (const item of user.Location_ids) {
            locationss = await Location.findById(item);
            for (const element of locationss.Sensor_ids) {
                Sens = await Sensor.findById(element).select('-data');
                console.log(Sens);
                All_User_Sensors.push(Sens);
            }
            All_User_Locations.push(locationss);
        }
        res.json({status: "ok", Locations: All_User_Locations, Sensors: All_User_Sensors});
    } catch (e) {
        res.json({message: e});
    }
});
router.post('/AddRules', verifyToken, async (req, res) => {
    try {
        /*{
  SensorId: '5e5f72d8343934062cf6d759',
  Rules: [
    {
      SensorId: '5e5f72d8343934062cf6d759',
      date: 'Wed Jun 24 2020 10:05:19 GMT+0100 (West Africa Standard Time)',
      Mode: 'Manuel',
      TMax: '80',
      TMin: '50',
      NotifSelection: [Array],
      RelaySelection: []
    }
  ]
}*/
        notif = { SMS : 0 , Email : 0 ,Push : 0};
        req.body.Rules[0].NotifSelection.forEach(item => {
            if (item.item_id === 1 )
            {notif.Email =1}
            if (item.item_id === 3 )
            {notif.SMS = 1}
            if (item.item_id === 2 )
            {notif.Push =1}
        });
        var timeInMillis = Date.parse(req.body.Rules[0].date) /1000;
        Sens = await Sensor.findById(req.body.SensorId).select('-data');
        Sens.Rules[Sens.Rules.length -1 ].Status = false ;
        const rule = { Status : false , StartTime : timeInMillis , Tmax : req.body.Rules[0].TMax , Tmin : req.body.Rules[0].TMin
            , Notifications : notif , Realy_ids : req.body.Rules[0].RelaySelection};
        Sens.Rules.push(rule);
        await Sens.save();
        //console.log(Sens.Rules[0].Realy_ids);
        res.json({status: "ok" , message : "schedule saved" });
    } catch (e) {
        res.json({status: "err",message: e.toString()});
    }
});
router.get('/geoMap', verifyToken, async (req, res) => {
    try {
        geoLocations = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": []
        };
        All_User_Sensors = [];
        All_User_Locations = [];
        All_User_Sensors = [];
        user = await User.findById(req.userId);
        for (const item of user.Location_ids) {
            locationss = await Location.findById(item);
            for (const element of locationss.Sensor_ids) {
                Sens = await Sensor.findById(element).select('-data');
                console.log(Sens);
                feature = {
                    "type": "Feature",
                    "properties": {"id": Sens.id, "SensorType": Sens.SensorType, "name": Sens.name},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [Sens.SensorCoordinates[0], Sens.SensorCoordinates[1], 0.0]
                    }
                };
                geoLocations['features'].push(feature);
                All_User_Sensors.push(Sens);
            }
            All_User_Locations.push(locationss);
        }

        console.log('await User.findById(req.userId)');
        console.log(await User.findById(req.userId));
        res.json(geoLocations);
    } catch (e) {
        res.json({message: e.toString()});
    }
});
router.post('/remove', verifyToken, async (req, res) => {
    console.log('check if location exists');
    Loc = await Location.findById(req.body.LocationId);
    if (!Loc) {
        console.log('location not found');
        console.log(req.body.LocationId);
        res.json({status: "err", message: 'Location not found'});
    }
    console.log('check if Sensor exists');
    Sens = await Sensor.findById(req.body.SensorId);
    if (!Sens) {
        console.log('Sensor not found');
        console.log(req.body.SensorId);
        res.json({status: "err", message: 'Location not found'});
    }
    try {
        console.log(Sens);
        console.log(Loc);
        console.log('-----------------------------------');
        const index = Loc.Sensor_ids.indexOf(req.body.SensorId);
        console.log(index);
        if (index > -1) {
            Loc.Sensor_ids.splice(index, 1);
        }
        console.log(Sens);
        console.log(Loc);
        // Sens.deleteOne();
        Loc = await Loc.save();
        res.json({status: "ok", message: 'Sensor Deleted'});
    } catch (e) {
        res.json({message: e});
        console.log(e);
    }
});
router.post('/AddSensorData', async (req, res) => {
    try {
        /*
        * send data like this
        *         {
                "SensorIdentifier": "123",
                "humidite":"25",
                "temperature":23,
                "batterie":25,
                "humiditéSol":21
                    }
        * */
        Sens = await Sensor.findOne({SensorIdentifier: req.body.SensorIdentifier});
        //console.log(req.body);
        delete req.body.SensorIdentifier;
        req.body.time = Date.now();
        Sens.data.push(req.body);
        // console.log(Sens.data);
        await Sens.save();
        AlertClients(req.body, Sens);
        return res.status(200).json({status: "ok", message: "updated"});
    } catch (e) {
        console.log('error AddSensorData', e);
    }
});
router.post('/dashboard', verifyToken, async (req, res) => {
    /*
    * send data like this
    *         {
            "SensorIdentifier": "123",
            "humidite":"25",
            "temperature":23,
            "batterie":25,
            "humiditéSol":21
                }
    * */
    try{
    user = await User.findById(req.userId);
    // get locations
    var data = [];

    i = 0;
    for (const item of user.Location_ids) {
        var result = {};
        locationss = await Location.findById(item);

        result.location = locationss;
        result.sensor = [];
        for (const element of locationss.Sensor_ids) {
            Sens = await Sensor.findById(element);
            result.sensor.push(Sens);
        }
        data.push(result);
    }
    // Sens = await Sensor.findOne({SensorIdentifier: req.body.SensorIdentifier});


    //console.log(Sens.data);
    //await Sens.save();
    return res.status(200).json({status: "ok", message: data});
    } catch (e) {
        console.log(e.toString());
    }
});
router.post('/StartProcess', verifyToken, async (req, res) => {
    /*
    * send data like this
    *         {
            "SensorIdentifier": "123",
            "humidite":"25",
            "temperature":23,
            "batterie":25,
            "humiditéSol":21
                }
    * */
    try{
        console.log('request ', req.body );
        return res.status(200).json({status: "ok", message: "process Started"});
    } catch (e) {
        console.log(e.toString());
    }
});

//new kafka

var consumer = new Kafka.SimpleConsumer({
    connectionString: '193.95.76.211:9092',
    clientId: 'test'
});

var dataHandler = function (messageSet, topic, partition) {
    messageSet.forEach(function (m) {
        console.log("test")
       console.log(m.message.value.toString('utf8'));
        const obj = JSON.parse(m.message.value.toString('utf8'));
        verify_kafka_data_message (m.message.value.toString('utf8'));
        console.log(obj) ;
        // return io.emit('message', {y: m.message.value.toString('utf8')});
    });
};

consumer.init().then(function () {
// Subscribe partitons 0 and 1 in a topic:
    var v1= consumer.subscribe('AS.Treetronix.v1', dataHandler);
    var arr=[];
    arr.push([v1]);
    console.log("val:"+arr);
    return arr;


});


/*
const sensor = io
    .of('/ensor')
    .on('connection', (socket) => {
        console.log('ensor connected', socket.id);
        socket.emit('item', { news: 'item' });
    });
*/
//get data from kafka
/*
try {
    Consumer = kafka.Consumer,
        client = new kafka.KafkaClient({kafkaHost: process.env.kafka_ip}),
        consumer = new Consumer(
            client,
            [
                {topic: process.env.kafka_Topic, partition: 0}
            ],
            {
                autoCommit: true
            }
        );
    consumer.on('message', function (message) {
        console.log(message);
        console.log('message read');
        verify_kafka_data_message(message.value);
    });
    consumer.on('error', function (err) {
        console.log('error', err);
    });
} catch (e) {
    console.log(e.toString());
}
*/
async function verify_kafka_data_message(x) {
    var y = JSON.parse(x);
    console.log('Sensor Id :',y.DevEUI_uplink.DevEUI );
    console.log('Sensor data :',y.DevEUI_uplink.payload_hex);
    // decrypt
   console.log('y :', Object.keys(y).length);
    if (Object.keys(y).length === 1) {
        console.log('ok', 'data accepted');
        Sens = await Sensor.findOne({SensorIdentifier: y.DevEUI_uplink.DevEUI});
        // delete y.SensorIdentifier;
        console.log('Sensor Id :',y.DevEUI_uplink.DevEUI);
        console.log('Sensor data :',y.DevEUI_uplink.payload_hex);

        // y.time = Date.now();
        if (Sens) {
        console.log('Sensor name:',Sens.name);
        console.log('data', y.DevEUI_uplink.payload_hex);
        // Sens.data.push(decrypt(y.DevEUI_uplink.payload_hex,y.DevEUI_uplink.Time));
        Sens.data.push(decrypt(y.DevEUI_uplink.payload_hex,y.DevEUI_uplink.Time));
        checkRules(Sens._id,decrypt(y.DevEUI_uplink.payload_hex,y.DevEUI_uplink.Time));
        await Sens.save();
        // AlertClients(decrypt(y.DevEUI_uplink.payload_hex,y.DevEUI_uplink.Time), Sens);
      
        return;
        }
        else {
            console.log(Sens , ' not my Sensor');
            return ;
        }
    }
    console.log('error', 'not valid data');
}

/*
Sens = await Sensor.findOne({SensorIdentifier: req.body.SensorIdentifier});
//console.log(req.body);
delete req.body.SensorIdentifier;
req.body.time =  Date.now() ;
Sens.data.push(req.body);
console.log(Sens.data);
await Sens.save();
return res.status(200).json({status: "ok", message: Sens});
*/

router.post('/Xtree', async (req, res) => {
    try {
        //console.log('req.body ', req.body);
        Sens = await Sensor.findOne({SensorIdentifier: req.body.identifier});
        if (Sens) {
           // console.log("duplicate identifier");
            return res.status(400).json({status: "err", message: 'duplicate identifier'});
        }
        //console.log('sens :', req.body.identifier);
        let sensor = new Sensor();
        sensor.SensorIdentifier = req.body.identifier;
        sensor.SensorType = req.body.SensorType;
        //console.log(sensor);
        if (sensor) {
            //console.log(sensor);
            //console.log("Sensor have been added !");
            NewSensor = await sensor.save();
            //console.log(NewSensor._id);
            return res.json({status: "ok", message: 'New Sensor have been added !'});
        }


        console.log("error");
        return res.status(400).json({status: "err", message: 'Some kind of error'});
    } catch (e) {
        console.log(e);
    }
});

router.post('/RelayAction', async (req, res) => {
    try {
        console.log(req.body.id);
        console.log(req.body.state);
        RelayAction(req.body.state, req.body.id);
        return res.json({status: "ok", message: 'action sent'});
    } catch (e) {
        console.log(e);
    }
});
router.post('/delete', function(req, res, next) {
    Sensor.remove({ _id : req.body.id } , function (err, obj) {
        if (err) throw err;
    });

});

router.get('/getall', async (req, res) => {
    try { 
        Sensor.find((err, c) => {
  
          if(err)
              res.json(err)
          else
              res.json(c)
      });
      }
      catch(err){res.json("error")}
});
router.get('/getlatestdata', async (req, res) => {
    try { 
        Sensor.find((err, c) => {
  
          if(err)
              res.json(err)
          else
          
          
              for (let i =0;i<c.length;i++){
                  x = c[i].data
                  console.log('/////////////'+ x.length)
                  c[i].data = c[i].data[x.length-1]
              }
              res.json(c)
      });
      }
      catch(err){res.json("error")}
});

router.post('/decrypt', async (req, res) => {
    try {
        /// 0a28169424
        data = decrypt(req.body.kafkaData,req.body.time);
        return res.json({status: "ok", message: data});
    } catch (e) {
        console.log(e);
    }
});

//CheckRulesStart
async function checkRules(id, data) 
{  
    Sens = await Sensor.findOne({_id: id});
    if (Sens.SensorIdentifier === "CCCCCCCCCCCCCCCC")
    {
     for(i=0 ; i<Sens.Rules.length;i++)
       {
          //témperature
           if (Sens.Rules[i].Type === "Temperature") 
           {
              if (data.temperature > Sens.Rules[i].Tmax || data.temperature < Sens.Rules[i].Tmin)
                {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                          user: 'azizbenrekaya@gmail.com',
                          pass: 'motdepasse012'
                        }
                      });

                      var mailOptions = {
                        to: "medaziz.benrekaya@esprit.tn",
                        from: 'azizbenrekaya@gmail.com',
                        subject: 'AlertClient',
                        text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                            'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                            'Temperature :'+data.temperature +'\n\n'
                            
                         
                      };  
                      smtpTransport.sendMail(mailOptions, function(err) {
                        
                        console.log('mail sent');
                      });
                }
           
            }
            //humidité
            if (Sens.Rules[i].Type === "Humidity") 
           {
              if (data.humidite > Sens.Rules[i].Tmax || data.humidite  < Sens.Rules[i].Tmin)
                {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                          user: 'azizbenrekaya@gmail.com',
                          pass: 'motdepasse012'
                        }
                      });

                      var mailOptions = {
                        to: "medaziz.benrekaya@esprit.tn",
                        from: 'azizbenrekaya@gmail.com',
                        subject: 'AlertClient',
                        text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                            'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                            'Humidity :'+data.humidite  +'\n\n'
                            
                         
                      };  
                      smtpTransport.sendMail(mailOptions, function(err) {
                        
                        console.log('mail sent');
                      });
                }
           
            }

       }
    }
    //2snd Sensor
    if (Sens.SensorIdentifier === "2417BAC2CB0180F2")
    {
     for(i=0 ; i<Sens.Rules.length;i++)
       {
          //CO
           if (Sens.Rules[i].Type === "CO") 
           {
              if (data.CO > Sens.Rules[i].Tmax || data.CO < Sens.Rules[i].Tmin)
                {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                          user: 'azizbenrekaya@gmail.com',
                          pass: 'motdepasse012'
                        }
                      });

                      var mailOptions = {
                        to: "medaziz.benrekaya@esprit.tn",
                        from: 'azizbenrekaya@gmail.com',
                        subject: 'AlertClient',
                        text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                            'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                            'CO :'+data.CO +'\n\n'
                            
                         
                      };  
                      smtpTransport.sendMail(mailOptions, function(err) {
                        
                        console.log('mail sent');
                      });
                }
           
            }
            //CO2
            if (Sens.Rules[i].Type === "CO2") 
           {
              if (data.CO2 > Sens.Rules[i].Tmax || data.CO2  < Sens.Rules[i].Tmin)
                {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                          user: 'azizbenrekaya@gmail.com',
                          pass: 'motdepasse012'
                        }
                      });

                      var mailOptions = {
                        to: "medaziz.benrekaya@esprit.tn",
                        from: 'azizbenrekaya@gmail.com',
                        subject: 'AlertClient',
                        text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                            'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                            'CO2 :'+data.CO2  +'\n\n'
                            
                         
                      };  
                      smtpTransport.sendMail(mailOptions, function(err) {
                        
                        console.log('mail sent');
                      });
                }
           
            }
            //
            if (Sens.Rules[i].Type === "O2") 
            {
               if (data.O2 > Sens.Rules[i].Tmax || data.O2  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'O2 :'+data.O2 +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "CH4") 
            {
               if (data.CH4 > Sens.Rules[i].Tmax || data.CH4  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'CH4 :'+data.CH4 +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Temperature") 
            {
               if (data.temperature > Sens.Rules[i].Tmax || data.temperature  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'temperature :'+data.temperature +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Humidity") 
            {
               if (data.humidity > Sens.Rules[i].Tmax || data.humidity < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'Humidity :'+data.humidity +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Pressure") 
            {
               if (data.temperature > Sens.Rules[i].Tmax || data.temperature  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'Pressure :'+data.pressure +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //

       }
    } 
    //3rd Sensor
    if (Sens.SensorIdentifier === "0004A30B00EF427C")
    {
     for(i=0 ; i<Sens.Rules.length;i++)
       {
          //CO
           if (Sens.Rules[i].Type === "O3") 
           {
              if (data.O3 > Sens.Rules[i].Tmax || data.O3 < Sens.Rules[i].Tmin)
                {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                          user: 'azizbenrekaya@gmail.com',
                          pass: 'motdepasse012'
                        }
                      });

                      var mailOptions = {
                        to: "medaziz.benrekaya@esprit.tn",
                        from: 'azizbenrekaya@gmail.com',
                        subject: 'AlertClient',
                        text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                            'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                            'O3 :'+data.O3 +'\n\n'
                            
                         
                      };  
                      smtpTransport.sendMail(mailOptions, function(err) {
                        
                        console.log('mail sent');
                      });
                }
           
            }
            //CO2
         
            //
            if (Sens.Rules[i].Type === "NO2") 
            {
               if (data.NO2 > Sens.Rules[i].Tmax || data.NO2  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'NO2 :'+data.NO2 +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "NO") 
            {
               if (data.NO > Sens.Rules[i].Tmax || data.NO  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'NO :'+data.NO +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Temperature") 
            {
               if (data.temperature > Sens.Rules[i].Tmax || data.temperature  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'temperature :'+data.temperature +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Humidity") 
            {
               if (data.humidity > Sens.Rules[i].Tmax || data.humidity < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'Humidity :'+data.humidity +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //
            if (Sens.Rules[i].Type === "Pressure") 
            {
               if (data.temperature > Sens.Rules[i].Tmax || data.temperature  < Sens.Rules[i].Tmin)
                 {
                     var smtpTransport = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                           user: 'azizbenrekaya@gmail.com',
                           pass: 'motdepasse012'
                         }
                       });
 
                       var mailOptions = {
                         to: "medaziz.benrekaya@esprit.tn",
                         from: 'azizbenrekaya@gmail.com',
                         subject: 'AlertClient',
                         text: 'You are receiving this because you created a rule for a specific factor.\n\n' +
                             'Sensor: '+Sens.SensorIdentifier+'\n\n' +
                             'Pressure :'+data.pressure +'\n\n'
                             
                          
                       };  
                       smtpTransport.sendMail(mailOptions, function(err) {
                         
                         console.log('mail sent');
                       });
                 }
            
             }
            //

       }
    }
}

//End AlertFunction
 
function decrypt(data, time) {
    // console.log(data);
    // console.log('time :', Date(time));
    if (data.length === 10) {
        temp=(parseInt(data.substring(0,4),16)/100);
        hum =(parseInt(data.substring(4,8) , 16)/100);
        v=(parseInt(data.substring(8,10) , 16));
        volt =  ((v - 30)/(42 - 30) *100).toFixed(0);
        timeGMT = new Date();
        timeGMT.setHours(timeGMT.getHours() + 1)
        //return({temperature : temp , humidite : hum , batterie : volt , humiditéSol : 0 , time : Date.parse(time)});
        return({temperature : temp , humidite : hum , batterie : volt , humiditéSol : 0 , time : timeGMT.toISOString().replace(/T/, ' ').replace(/\..+/, '')});
    }
    if (data.length === 18) {
        hum1=(parseInt(data.substring(0,4),16)/10);
        hum2 =(parseInt(data.substring(4,8) , 16)/10);
        hum3=(parseInt(data.substring(8,12) , 16)/10);
        tempSol=(parseInt(data.substring(12,16) , 16)/10);
        v=(parseInt(data.substring(16,18) , 16));
        volt = ((v - 30)/(42 - 30) *100).toFixed(0);
        timeGMT = new Date();
        timeGMT.setHours(timeGMT.getHours() + 1)
        // return({humdity1 : hum1 , humdity2 : hum2 , humdity3 : hum3 , temperatureSol : tempSol , batterie : volt , time : Date.parse(time)});
        return({humdity1 : hum1 , humdity2 : hum2 , humdity3 : hum3 , temperatureSol : tempSol , batterie : volt , time : timeGMT.toISOString().replace(/T/, ' ').replace(/\..+/, '')});
    }
    if (data.length === 78) {
        CO= Buffer(changeEndianness(data.substring(6,14)),'hex').readFloatBE(0);
        CO2 = Buffer(changeEndianness(data.substring(16,24)),'hex').readFloatBE(0);
        O2 = (Buffer(changeEndianness(data.substring(26,34)),'hex').readFloatBE(0) * 100 ) / 1000000;
        CH4 = Buffer(changeEndianness(data.substring(36,44)),'hex').readFloatBE(0) ;
        temp = Buffer(changeEndianness(data.substring(46,54)),'hex').readFloatBE(0);
        humidity = Buffer(changeEndianness(data.substring(56,64)),'hex').readFloatBE(0);
        pressure = (Buffer(changeEndianness(data.substring(66,74)),'hex').readFloatBE(0))/1000;
        Batterie = (parseInt(data.substring(76) , 16));
        timeGMT = new Date();
        timeGMT.setHours(timeGMT.getHours() + 1)

       return({CO : CO , CO2 : CO2 , O2 : O2, CH4: CH4 , temperature : temp , humidity : humidity , pressure : pressure , batterie : Batterie , time : timeGMT.toISOString().replace(/T/, ' ').replace(/\..+/, '')})
    }
    if (data.length === 68) {
        O3= Buffer(changeEndianness(data.substring(6,14)),'hex').readFloatBE(0);
        NO2 = Buffer(changeEndianness(data.substring(16,24)),'hex').readFloatBE(0);
        NO = Buffer(changeEndianness(data.substring(26,34)),'hex').readFloatBE(0) ;
        temp = Buffer(changeEndianness(data.substring(36,44)),'hex').readFloatBE(0);
        humidity = Buffer(changeEndianness(data.substring(46,54)),'hex').readFloatBE(0);
        pressure = (Buffer(changeEndianness(data.substring(56,64)),'hex').readFloatBE(0))/1000;
        Batterie = (parseInt(data.substring(66) , 16));
        timeGMT = new Date();
        timeGMT.setHours(timeGMT.getHours() + 1)

       return({O3 : O3 , NO2:NO2 , NO:NO ,temperature : temp , humidity : humidity , pressure : pressure , batterie : Batterie , time : timeGMT.toISOString().replace(/T/, ' ').replace(/\..+/, '')})
    }

}
const changeEndianness = (string) => {
    const result = [];
    let len = string.length - 2;
    while (len >= 0) {
      result.push(string.substr(len, 2));
      len -= 2;
    }
    return result.join('');
}
function getdate(time) {
    var date2 = ' '
    var ii =0
    var bool = false
    while(ii<time.length && bool == false){
        date2 = date2 + time[ii]
        ii = ii + 1
        if(time[ii]==' ')
         bool = true
    }
    return date2
}
function transform(t){
    var date2 = ' '
    var ii =11
    var bool = false
    while(ii<16 ){
        date2 = date2 + t[ii]
        ii = ii + 1
    }
    return date2
}
//******************************************Socket io****************************************************//
//Sensor/UpdateValue
// SocketClients = [];
// const chat = io
//     .of('/Sensor/UpdateValue')
//     .on('connection', (socket) => {
//         //lista lkol
//         socket.on('getChartdata', async (message) => {
//             //console.log('Chart Update ',message);
//             //console.log('getChartdata', socket.id);
//             //console.log('SocketClients length ', SocketClients.length);
//             if (SocketClients.length === 0) {
//                 //console.log('create 1');
//                 let clientInfo = {};
//                 clientInfo.socketId = socket.id;
//                 clientInfo.token = message.Accesstoken;
//                 clientInfo.locationId = message.LocationId;
//                 SocketClients.push(clientInfo);
//             } else {
//                 let exist = false;
//                 SocketClients.forEach(item => {
//                     if (item.socketId === socket.id) {
//                         if (item.token === message.Accesstoken) {
//                             if (item.locationId === message.LocationId) {
//                                 //console.log('Socket Already Exists');
//                                 exist = true;
//                             } else {
//                                 exist = true;
//                                 //console.log('Changed Location Id');
//                                 //console.log('SocketClients ', SocketClients);
//                                 item.locationId = message.LocationId;
//                             }
//                         }
//                     }
//                 });
//                 if (exist === false) {
//                     //console.log('create 2');
//                     let clientInfo = {};
//                     clientInfo.socketId = socket.id;
//                     clientInfo.token = message.Accesstoken;
//                     clientInfo.locationId = message.LocationId;
//                     SocketClients.push(clientInfo);
//                 }
//             }
//             // console.log('Socket Clients' , SocketClients);
//             // socket.emit('getChartdata',  await getChart(message.LocationId, message.Accesstoken));
//         });
//         socket.on('getData', (message) => {
//             //console.log('change data');
//         });
//         socket.on('disconnect', (message) => {
//             //console.log('disconnect' , message);
//             let i = 0;
//             SocketClients.forEach(item => {
//                 if (item.socketId === socket.id)
//                     SocketClients.splice(i, 1);
//                 i++;
//             })
//         });
//     });
// SocketRelays = [];
// const relays = io
//     .of('/Sensor/UpdateRelay')
//     .on('connection', (socket) => {
//         console.log('relay ', socket.id, ' connected');
//         socket.on('join', async (message) => {
//             console.log('relay ', message, ' is joining');
//             console.log('socket id :', socket.id);
//             console.log('Relay id ', message.id.toString());
//             if (SocketRelays.length === 0) {
//                 console.log('create 1');
//                 let clientInfo = {};
//                 clientInfo.socketId = socket.id;
//                 clientInfo.relayId = message.id;
//                 SocketRelays.push(clientInfo);
//             } else {
//                 let exist = false;
//                 SocketRelays.forEach(item => {
//                     if (item.socketId === socket.id) {
//                         if (item.relayId === message.id) {
//                             console.log('Socket Already Exists');
//                             exist = true;
//                         } else {
//                             exist = true;
//                             //console.log('Changed Location Id');
//                             //console.log('SocketClients ', SocketClients);
//                             item.relayId = message.id;
//                         }
//                     }
//                 });
//                 if (exist === false) {
//                     //console.log('create 2');
//                     let clientInfo = {};
//                     clientInfo.socketId = socket.id;
//                     clientInfo.relayId = message.id;
//                     SocketRelays.push(clientInfo);
//                 }
//             }
//             // console.log('Socket Clients' , SocketClients);

//             //socket.emit('connected',  'true');
//         });
//         socket.on('status', (message) => {
//             console.log('status', message.status);
//         });
//         socket.on('disconnect', (message) => {
//             console.log('disconnect', message);
//             let i = 0;
//             SocketRelays.forEach(item => {
//                 if (item.socketId === socket.id)
//                     SocketRelays.splice(i, 1);
//                 i++;
//             })
//         });
//     });

// async function getChart(LocationId, AccessToken) {
//     return new Promise(async function (resolve, reject) {
//         try {
//             payload = jwt.verify(AccessToken, process.env.token_Key);
//         } catch (e) {
//             console.log('token not verified');
//             return;
//         }
//         if (!payload) {
//             console.log('empty payload');
//             return;
//         }
//         decoded = jwt.decode(AccessToken, {complete: true});
//         user = await User.findById(decoded.payload.id);
//         if (!user) {
//             console.log('empty user ', user);
//             return;
//         }
//         locationss = await Location.findById(LocationId);
//         if (!locationss) {
//             console.log('empty locationss ', locationss);
//             return;
//         }
//         console.log('return value', await locationss.AutomaticIrrigation);
//         resolve(await locationss.AutomaticIrrigation) // successfully fill promise
//     })
// }

// async function AlertClients(data, Sensor) {
//     //console.log('Alert Clients', Sensor._id);
//     //console.log('data', data);
//     loc = await Location.find({Sensor_ids: Sensor._id});
//     if (!loc) {
//         return;
//     }
//     //console.log('location to update', loc[0]._id);
//     //console.log('SocketClients', SocketClients);
//     SocketClients.forEach(item => {
//         //console.log('item ', item.locationId);
//         //console.log('loc[0]._id ', loc[0]._id);
//         if (item.locationId == loc[0]._id) {
//             //console.log('Needs Update');
//             //console.log('socket id ' , item.socketId);
//             //console.log('new data' , data);
//             // state = io.to(item.socketId).emit('getChartdata', 'I just met you');
//             state = io.of('/Sensor/UpdateValue').to(item.socketId).emit('setChartdata', {
//                 SensId: Sensor._id,
//                 newData: data
//             });
//             // console.log('state' , state);
//         }
//     });
// }


// async function RelayAction(data, Sensor) {
//     console.log('Relay Action', Sensor);
//     //console.log('data', data);
//     //console.log('location to update', loc[0]._id);
//     //console.log('SocketClients', SocketClients);
//     SocketRelays.forEach(item => {
//         console.log('item ', item.relayId);
//         //console.log('loc[0]._id ', loc[0]._id);
//         if (item.relayId == Sensor) {
//             console.log('Needs Update');
//             //console.log('socket id ' , item.socketId);
//             //console.log('new data' , data);
//             // state = io.to(item.socketId).emit('getChartdata', 'I just met you');
//             state = io.of('/Sensor/UpdateRelay').to(item.socketId).emit("NewState", data);
//             // console.log('state' , state);
//         }
//     });
// }

/*io.on('connection', function (client) {
    console.log('Client connected...');

    client.on('join', function (data) {
        console.log(data);
    });
    client.emit('news','rtyrtyrtyrtyrtyrtyrtyrty');
/*
        client.on('disconnect', function () {
            console.log('Client disconnected!');
        });
    });*/


    router.post('/getdataperstation', async (req, res) => {
        console.log("x")
    
        try {
            station.findOne({_id: req.body.id}, (err, sta) => {
                // console.log(sta)  
                // console.log(sta.Sensor_ids[0])
                if (sta.Sensor_ids.length === 2)
                {
                   finalResult = []
                 Sensor.findOne({_id: sta.Sensor_ids[1]}, (err, sens )=> {
                     CO = []
                     CO2 = []
                     O2 = [] 
                     CH4 = []
                     temp = []
                     humidite = []
                     pressure = []
                     time = []
                     batterie = sens.data[sens.data.length-1].batterie 
                     name = sens.name
                     //  console.log(sens.data.length)
                     for( let i= 0; i<sens.data.length ; i=i+1) {
                         console.log(req.body.date)
                      
                        if((getdate(sens.data[i].time)).trim() === req.body.date)
                         // if(sens.data[i].time.trim() === req.body.date.trim())
                         {  
                         CO.push(sens.data[i].CO)
                         CO2.push(sens.data[i].CO2)
                         O2.push(sens.data[i].O2)
                         CH4.push(sens.data[i].CH4)
                         pressure.push(sens.data[i].pressure)    
                         temp.push(sens.data[i].temperature)
                         humidite.push(sens.data[i].humidity)
                         time.push(transform(sens.data[i].time))
                        }
                         else
                         i = i + 2
 
                     }
                     
                     let x = {CO,CO2,O2,CH4,pressure,temp,humidite,time,batterie:batterie,name:name};
                     finalResult.push(x)
                 }) 
                 Sensor.findOne({_id: sta.Sensor_ids[0]}, (err, sens )=> {
                     O3 = []
                     NO2 = []
                     NO = [] 
                     temp = []
                     humidite = []
                     pressure = []
                     time = []
                     batterie = sens.data[sens.data.length-1].batterie 
                     name = sens.name
                     //  console.log(sens.data.length)
                     for( let j= 0; j<sens.data.length ; j=j+1) {
                         console.log(req.body.date)
                      
                        if((getdate(sens.data[j].time)).trim() === req.body.date)
                         // if(sens.data[i].time.trim() === req.body.date.trim())
                         {  
                         O3.push(sens.data[j].O3)
                         NO2.push(sens.data[j].NO2)
                         NO.push(sens.data[j].NO)
                         pressure.push(sens.data[j].pressure)    
                         temp.push(sens.data[j].temperature)
                         humidite.push(sens.data[j].humidity)
                         time.push(transform(sens.data[j].time))
                        }
                         else
                         j = j + 2
 
                     }
                     
                     let y = {O3,NO2,NO,pressure,temp,humidite,time,batterie:batterie,name:name};
                     finalResult.push(y)
                     res.json(finalResult)  
                 }) 
                             

                } 
 

                else
                        {

                Sensor.findOne({_id: sta.Sensor_ids[0]}, (err, sens )=> {
                    temp = []
                    humidite = []
                    time = [] 
                    //  console.log(sens.data.length)
                    for( let i= 0; i<sens.data.length ; i=i+2) {
                        console.log(req.body.date)
                     
                       if((getdate(sens.data[i].time)).trim() === req.body.date)
                        // if(sens.data[i].time.trim() === req.body.date.trim())
                        {
                        temp.push(sens.data[i].temperature)
                        humidite.push(sens.data[i].humidite)
                        time.push(transform(sens.data[i].time))
                       }
                        else
                        i = i + 2

                    }
                    
                    let x = {temp,humidite,time};
                    res.json(x)
                })

                       }

                  
            })

              
          
        } catch (e) {
            console.log(e);
        }
    });

    router.post('/getopenweather', async (req, res) => {
        weather.setCoordinate(req.body.lattitude, req.body.longitude);
        weather.setUnits('metric');
        weather.setAPPID('3e097b42a4c29e7962cd3d10a6a4e666');
    
        try {
            weather.setCoordinate(req.body.lattitude, req.body.longitude);
            weather.setUnits('metric');
            weather.setAPPID('3e097b42a4c29e7962cd3d10a6a4e666');
       
            weather.getWeatherForecastForDays(6, function(err, obj){
                res.json(obj);
            }); 
         
        } catch (e) {
            console.log(e);
        }
    });


module.exports = router;
