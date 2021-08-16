const mongoose=require('mongoose');
const SensorsSchema= mongoose.Schema({
    name: {
        type : String
    },
    SensorIdentifier: {
        type : String,
        required : true
    },
    SensorType: {
        type : String,
        required : true
    },
    Description: {
        type : String,
    },
    SensorLattitude : {type:Number},
    SensorLongitude: {type:Number}
    ,
    Created_date: {
        type : Date,
        default : Date.now()
    },
    data: []
    ,
    Rules :[
        {
            Type: {
                type : String,
            },
            Tmax: {
                type : Number,
            },
            Tmin: {
                type : Number,
            }
         
        }
    ]
});
module.exports=mongoose.model('Sensors',SensorsSchema);
