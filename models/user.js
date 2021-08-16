var mongoose = require('mongoose')
var userSchema = new mongoose.Schema({

    nom : {type : String , trim : true,required : true},
    prenom : {type : String,required : true},
    email : {type : String , required : true},
    password : {type:String , required : true}
  
})

    
module.exports = mongoose.model('User',userSchema)     