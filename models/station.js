var mongoose = require('mongoose')
var Cite = require('../models/cite')

var stationSchema = new mongoose.Schema({
    name: {type : String , trim : true,required : true},
    localisation: {type : String , trim : true,required : true},
    lattitude : {type:Number},
    longitude: {type:Number},
    created_date: {
        type : Date,
        default : Date.now()
    },
    cite :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Cite', default:null
      },
      Sensor_ids: [mongoose.Schema.Types.ObjectId]

    
  
})

    
module.exports = mongoose.model('Station',stationSchema)   