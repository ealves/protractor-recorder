/**
* Created by eduardo on 30/10/15.
*/
var express = require('express'),
 bodyParser = require('body-parser'),
 app     = express(),
 http    = require('http').Server(app),
 io      = require('socket.io')(http);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

io.on('connection', function(socket){
console.log('a user connected');

  socket.on('onclick', function (data) {
    console.log('onclick');
    console.log(data);

    io.emit('click', data);

  });

  socket.on('onkeyup', function (data) {
  	console.log('onkeyup');
    console.log(data);

    io.emit('keyup', data);

  });

  socket.on('onfocus', function (data) {
  	console.log('onkeyup');
    console.log(data);

    io.emit('focus', data);

  });

  socket.on('onassertion', function (data) {
  	console.log('onassertion');
    console.log(data);

    io.emit('assertion', data);

  });

  socket.on('onunload', function (data) {
  	console.log('onunload');
    console.log(data);

    io.emit('unload', data);

  });

	socket.on('disconnect', function(){
	  console.log('user disconnected');

	  io.emit('session-disconnect', 'session');
	});
});

app.get('/', function (req, res) {
 res.send('ok');
});

app.get('/teste', function(req, res){
	io.emit('click', 'teste');
	io.emit('keyup', 'teste');
	res.send('teste');
});

app.post('/export', function(req, res){

  var describe = req.body.describe;
  var id = req.body.id;

  console.log(describe);
  console.log(id);

  res.send('ok');
});


http.listen(9000, function () {
 console.log('Server listening on *:9000');
});
