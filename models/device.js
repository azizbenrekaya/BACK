var mongoose = require('mongoose')
var deviceSchema = new mongoose.Schema({

    id_device : {type : String , trim : true,required : true},
    cite : {type : String , trim : true,required : true}
    
  
})

    
module.exports = mongoose.model('Device',deviceSchema)   