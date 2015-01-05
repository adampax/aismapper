var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var http = require('http');
var AisDecoder = require ('aisdecoder').AisDecoder;
var decoder = new AisDecoder;

var server = http.createServer(app); //.listen(3000);
var io = require('socket.io').listen(server);

var ships = {};

io.set('log level', 2);
io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function () {
        io.sockets.emit('user disconnected');
    });
});

//SERIAL PORT
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

var sp = new SerialPort(config.serialPort, {
    parser: serialport.parsers.readline("\n"),
    baudrate: 38400
    //parser: serialport.parsers.raw
});


sp.on('open', function(){
    console.log('Serial Port Opened');
    sp.on('data', function(data){
        var d = decode(data);
        console.log(d);

        //check to see if mmsi exists, and if coordinates are valid
        if(d.mmsi && (d.lat >= -90 && d.lat <= 90 ) && (d.lon >= -180 && d.lon <=180)){
            ships[d.mmsi] = d;
            io.sockets.emit('ais', d);
            db.insertPoint(d);
        } else {
            console.log('invalid mmsi or coordinates. Skipping');
        }
    });
});


function decode(args){
    return decoder.decode(args) || {};
}

var db = require('./lib/db');
db.init();


module.exports = server;