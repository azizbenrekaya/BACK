var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/AboveGreen',{ useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },()=>{
console.log('db connect')

});