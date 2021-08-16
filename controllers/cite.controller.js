const Cite = require('../models/cite');
// var weather = require('openweather-apis');
const OpenWeatherMapHelper = require("openweathermap-node");
//UNITS = "metric";
const helper = new OpenWeatherMapHelper(
	{
		APPID: '3d65d8d7f94b89082954ab07dcab7ede',
    units: 'Metric'
	  
	}
);
// weather.setAPPID("3d65d8d7f94b89082954ab07dcab7ede");
module.exports.delete = async (req,res) => {
  Cite.remove({ _id : req.body.id } , function (err, obj) {
    if (err) throw err;
});
}

module.exports.update = async (req,res) => {
  try {
    Cite.findOneAndUpdate({_id : req.body._id } , req.body , { res: true} , function (d) {
     
     res.json(d)
  });

  }
  catch(err) {
     res.json("error")
  }

}
module.exports.addcite = async (req, res) => {
    try {
        //const user = await User.create({nom, prenom, email, password });
        //res.status(201).json({ user: user._id});
        Cite.findOne({ area: req.body.area}).then(cite => {
          if (!cite) {
            var cite = new Cite({
              area : req.body.area,
              description : req.body.description,
              lattitude : req.body.lattitude,
              longitude: req.body.longitude
              
              
            }); 
           cite.save((err, user) => {
              if (err) res.json(err);
              else res.status(201).json("CiteCreated");
            });
      }
      else {
          res.status(403).json("Cite already exist")
        }
  
      }) }
  
      catch(err) {
        //const errors = signUpErrors(err);
        res.json("erreur")
      }
  }
   

  module.exports.getcurrentweather = async (req, res) => { 
    try {
    helper.getCurrentWeatherByGeoCoordinates(req.body.lattitude,req.body.longitude, (err, currentWeather) => {
     
      var temp = (currentWeather.main.temp-273.15).toFixed(1) ;
      var humid = currentWeather.main.humidity + "%"
      var descrip = currentWeather.weather[0].main + ',' + currentWeather.weather[0].description 
      var result = {"temperature":temp,"humidity":humid,"description":descrip}
          res.json(result);
      
  });
       }
    catch(err){res.json("error")}
   
  }


  module.exports.getallcite = async (req, res) => { 
    try { 
      Cite.find((err, c) => {

        if(err)
            res.json(err)
        else
            res.json(c)
    });
    }
    catch(err){res.json("error")}

  }

  module.exports.gettemp= async (req, res) => { 
   
  
    try { 
  
      // weather.setCoordinate(req.body.lattitude,req.body.longitude);
      // weather.getAllWeather(function(err, JSONObj){
      //   res.json(JSONObj);
      // });
      // weather.getWeatherForecastForDays(3, function(err, obj){
      //   res.json(obj);
      // });
      
      helper.UNITS = 'metric'
      helper.getThreeHourForecastByGeoCoordinates(req.body.lattitude,req.body.longitude, (err, threeHourForecast) => {
        if(err){
            console.log(err);
        }
        else{
         
          date =[]
          temperature=[]
          tab = threeHourForecast.list
          for(let i=0;i<threeHourForecast.list.length;i++){
            if((getdate(threeHourForecast.list[i].dt_txt)).trim() === req.body.date){
            var temp = threeHourForecast.list[i].main.temp-273.15 ;
           
              date.push(transform(threeHourForecast.list[i].dt_txt)) 
              temperature.push(temp.toFixed(1) )
            
            
            }
          //  threeHourForecast.list[i].dt_txt +':'+ 
        }
          let result ={temperature,date}
          res.json(result)
        }

    });  
    }
    catch(err){res.json("error")}

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

// module.exports.getalldata= async (req, res) => { 
  
  
//   try { 
    
   
//     // helper.units = "aa"
//     console.log(helper)
//     helper.getThreeHourForecastByGeoCoordinates(req.body.lattitude,req.body.longitude, (err, threeHourForecast) => {
//       if(err){
//           console.log(err);
//       }
//       else{
//         let d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
//         console.log(d)
//        //res.json(threeHourForecast.list)
//        forecast =  threeHourForecast.list
//        finaldata = []
//        todaysdata = []
//        for(let i=0;i<forecast.length;i++)
//         { 
//           if ((getdate(forecast[i].dt_txt)).trim() == (getdate(d)).trim())
//            {

//             var y = {
//               "temperature" : forecast[i].main.temp = (forecast[i].main.temp-273.15).toFixed(1)+'°' ,
//               "windspeed " : forecast[i].wind.speed = (forecast[i].wind.speed * 3.6).toFixed(1),
//               "humidite": forecast[i].main.humidity + '%',
//               "weather":forecast[i].weather[0].main ,
//               "description" : forecast[i].weather[0].description ,
//               "precipitation" : (forecast[i].pop*100).toFixed(0) + '%',
//               "date": forecast[i].dt_txt
//                         }
//                         todaysdata.push(y)
//            }
//           else
//              {

//          var x = {
//         "temperature" : forecast[i].main.temp = (forecast[i].main.temp-273.15).toFixed(1)+'°' ,
//         "windspeed " : forecast[i].wind.speed = (forecast[i].wind.speed * 3.6).toFixed(1),
//         "humidite": forecast[i].main.humidity + '%',
//         "weather":forecast[i].weather[0].main ,
//         "description" : forecast[i].weather[0].description ,
//         "precipitation" : (forecast[i].pop*100).toFixed(0) + '%',
//         "date": forecast[i].dt_txt
//                   }
                 
                 
//          finaldata.push(x)
//              }


//         }
//         let final = {todaysdata,finaldata}
//         res.json(final)
      

//       }

//   });  
//   }
//   catch(err){res.json("error")}

// }
function getDayOfWeek(date) {
  const dayOfWeek = new Date(date).getDay();    
  return isNaN(dayOfWeek) ? null : 
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}
module.exports.getalldata= async (req, res) => { 
  
  
  try { 
    
   
    // helper.units = "aa"
    console.log(helper)
    helper.getThreeHourForecastByGeoCoordinates(req.body.lattitude,req.body.longitude, (err, threeHourForecast) => {
      if(err){
          console.log(err);
      }
      else{
        let d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        console.log(d)
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let dayName = days[new Date().getDay()];
        console.log(dayName)
       //res.json(threeHourForecast.list)
       forecast =  threeHourForecast.list
       finaldata = []
       todaysdata = []
       secondday =[];thirdday =[];fourthday =[];fifthday =[];lastday=[];
       for(let i=0;i<forecast.length;i++)
        { 
          if ((getdate(forecast[i].dt_txt)).trim() == (getdate(d)).trim())
           {

            var y = {
              
              "temperature" : forecast[i].main.temp = (forecast[i].main.temp-273.15).toFixed(1)+'°' ,
              "windspeed" : forecast[i].wind.speed = (forecast[i].wind.speed * 3.6).toFixed(1),
              "humidite": forecast[i].main.humidity + '%',
              "weather":forecast[i].weather[0].main ,
              "description" : forecast[i].weather[0].description ,
              "precipitation" : Number((forecast[i].pop*100).toFixed(0)) ,
              "date": (getdate(forecast[i].dt_txt)).trim() ,
              "day" : getDayOfWeek((getdate(forecast[i].dt_txt)).trim()) ,
              "time":transform(forecast[i].dt_txt).trim()
                        }
                        todaysdata.push(y)
           }
          else
             {
               
         var x = {
        "temperature" : forecast[i].main.temp = (forecast[i].main.temp-273.15).toFixed(1)+'°' ,
        "windspeed" : forecast[i].wind.speed = (forecast[i].wind.speed * 3.6).toFixed(1),
        "humidite": forecast[i].main.humidity + '%',
        "weather":forecast[i].weather[0].main ,
        "description" : forecast[i].weather[0].description ,
        "precipitation" : Number((forecast[i].pop*100).toFixed(0)) ,
        "date": (getdate(forecast[i].dt_txt)).trim() ,
        "day" : getDayOfWeek((getdate(forecast[i].dt_txt)).trim()) ,
        "time":transform(forecast[i].dt_txt).trim()
                  }
                 
                 
         finaldata.push(x)
             }


        }
        for(let i=0;i<8;i++)
        secondday.push(finaldata[i])
        if (todaysdata.length == 0)
        todaysdata = secondday
        for(let i=8;i<16;i++)
        thirdday.push(finaldata[i])
        for(let i=16;i<24;i++)
        fourthday.push(finaldata[i])
        for(let i=24;i<32;i++)
        fifthday.push(finaldata[i])
        for(let i=32;i<finaldata.length;i++)
        lastday.push(finaldata[i])
        
        let fx = {todaysdata,secondday,thirdday,fourthday,fifthday,lastday}
        res.json(fx)
      

      }

  });  
  }
  catch(err){res.json("error")}

}