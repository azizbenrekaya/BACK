var createError = require('http-errors');
//var express = require('express');
//var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const httpClient = require('request');
const express = require('express');
const jsforce = require('jsforce');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');



//

var usersRouter = require('./routes/users');
var deviceRouter = require('./routes/device');
var citeRouter = require('./routes/cite');
var stationRouter = require('./routes/station')
var SensorRouter = require('./routes/sensor')



var app = express();
var db = require('./db')
// Setup HTTP server

app.use(session({secret: 'S3CRE7', resave: true, saveUninitialized: true}));//bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/user', usersRouter);
app.use('/api/device', deviceRouter);
app.use('/api/cite', citeRouter);
app.use('/api/station', stationRouter);
app.use('/api/sensor',SensorRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
