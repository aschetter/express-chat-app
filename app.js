var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// routes
var routes = require('./routes/index');
var users = require('./routes/users');

// create express app and server
var app = express();
var server = require('http').createServer(app);

// express app listens on port 3000
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// socket.io setup
var io = require('socket.io');
var sio = io.listen(8080);

//Connect to MongoDB client
MongoClient.connect('mongodb://127.0.0.1/chat', function(err, db) {
    if (err) {
        throw err;
    }

    // Connect to socket.io
    sio.on('connection', function (socket) {

        // Use the 'messages' collection
        var collection = db.collection('messages');

        // Send a message to the client confirming it connected to the server
        socket.emit('connected', 'You are connected to the chat server!');
        socket.on('confirmConnection', function (data) {
            console.log(data);
        });

        // Send the messages stored in the DB when the user loads the page
        collection.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
            if (err) {
                throw err;
            }
            socket.emit('output', res);
        });

        // Define method to send the message status
        function sendStatus (s) {
            socket.emit('status', s);
        };

        // Process messages sent from the client
        socket.on('toServer', function (data) {
            console.log(data);

            var name = data.name;
            var message = data.message;

            // Verify the content and name aren't empty
            var whiteSpaceCheck = /^\s*$/;

            if (whiteSpaceCheck.test(name) || whiteSpaceCheck.test(message)) {
                sendStatus('Name and message is required.');
            } else {

                // If the content and name aren't empty, store the message in the DB
                collection.insert({name: name, message: message}, function() {

                    // Send most recent message to all clients
                    sio.emit('output', [data]);

                    // Send status to the client confirming the message was received
                    sendStatus({
                        message: "Message sent.",
                        clear: true
                    });
                });
            }
        });
    });
});

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

module.exports = app;
