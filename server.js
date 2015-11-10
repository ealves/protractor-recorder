/**
* Created by eduardo on 30/10/15.
*/
var express = require('express'),
 bodyParser = require('body-parser'),
 app     = express(),
 http    = require('http').Server(app),
 io      = require('socket.io')(http),
 fs      = require('fs'),
 request = require("request");

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

app.get('/run', function(req, res){


  var exec = require('child_process').exec;

  exec('protractor ' + __dirname + '/public/exports/conf.js', function(error, stdout, stderr) {

    console.log(stdout);

  });

  res.send('run');
});

app.post('/html', function(req, res){

  var url = req.body.url;
  var include = req.body.include;

  console.log(url + '/' + include);

  request({
    uri: url + '/' + include,
  }, function(error, response, body) {
    //console.log(body);
    res.send(body);
  });

});

app.post('/export', function(req, res){

  var describe = req.body.describe;
  var id = req.body.id;

  describe = JSON.parse(describe);

  //console.log(describe);
  //console.log(id);

  var output = "describe('" + describe.string + "', function(){\r\n\r\n";

  describe.specs.forEach(function(spec){
    output += "  it('" + spec.string + "', function(){\r\n\r\n";

    spec.actions.forEach(function(action){

      var line = '';

      if(action.action == 'sendKeys') {
        line = "element(by.model('" + action.locators[0].value + "')).sendKeys('" + action.value + "')";
      }

      if(action.action == 'click' && action.type == 'button' && action.value) {
        line = "element(by.buttonText('" + action.value + "')).click()";
      }

      if(action.action == 'click' && action.type == 'a') {
        line = "browser.get('" + action.value + "')";
      }

      if(action.action == 'click' && action.locators[0].type == 'xpath') {
        line = "element(by.xpath('" + action.locators[0].value + "')).click()";
      }

      if(action.action == 'click' && action.locators[0].type == 'id') {
        line = "element(by.id('" + action.locators[0].value + "')).click()";
      }

      if(action.action == 'click' && action.locators[0].type == 'css') {
        line = "element(by.css('" + action.locators[0].value + "')).click()";
      }

      if(action.action == 'assertion')
        line = "expect(element(by.binding('" + action.locator.value + "')).getText()).toBe('" + action.value + "')";

      output += '    ' + line + ';\r\n';

      console.log(line);
    });

    output += '\r\n  });\r\n\r\n';
  });

  output += '});\r\n';

  fs.writeFile(__dirname + '/public/exports/test.js', output, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });

  res.send('ok');
});


http.listen(9000, function () {
 console.log('Server listening on *:9000');
});
