var mongoose = require('mongoose')
var citeSchema = new mongoose.Schema({

    area: {type : String , trim : true,required : true},
    description : {type : String , trim : true,required : true},
    lattitude : {type:Number,required: true},
    longitude: {type:Number,required: true}
    
  
})

    
module.exports = mongoose.model('Cite',citeSchema)   