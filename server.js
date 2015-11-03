/**
* Created by eduardo on 30/10/15.
*/
var express = require('express'),
 app     = express(),
 http    = require('http').Server(app),
 io      = require('socket.io')(http);

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

http.listen(9000, function () {
 console.log('Server listening on *:9000');
});
