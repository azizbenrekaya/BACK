const mongoose=require('mongoose');
const dataSchema= mongoose.Schema({
    Created_date: {
        type : Date,
        default : Date.now()
    },
});
module.exports=mongoose.model('Data',dataSchema);
