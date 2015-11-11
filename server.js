/**
* Created by eduardo on 30/10/15.
*/
var express = require('express'),
 bodyParser = require('body-parser'),
 app        = express(),
 http       = require('http').Server(app),
 io         = require('socket.io')(http),
 fs         = require('fs'),
 request    = require("request"),
 exec       = require('child_process').exec;

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

  var runProcess = exec('protractor ' + __dirname + '/public/exports/conf.js');

  runProcess.stdout.on('data', function(data){
    console.log(data);
    io.emit('protractor-log', data);
  });

  res.send('run');
});

app.get('/webdriver-manager/:command', function(req, res){

  var command = req.params.command;

  exec('webdriver-manager ' + command, function(error, stdout, stderr) {

    var stdout = stdout.split('\n');

    var drivers = [{driver: 'firefox'}];
    stdout.forEach(function(driver){
      if(driver.match(/is up to date/i) && driver.match(/chrome|firefox|ie/i))
          drivers.push({driver: driver.match(/(\w+)/)[0]});
    });

    //console.log(stdout);
    res.send(drivers);

  });

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

  var describe = JSON.parse(req.body.describe);
  var baseUrl  = req.body.baseUrl;
  //var onPrepare = JSON.parse(req.body.onPrepare);

  var conf = "exports.config = {\r\n" +
             "  framework: 'jasmine2',\r\n" +
             "  seleniumAddress: 'http://localhost:4444/wd/hub',\r\n" +
             "  baseUrl: '" + baseUrl + "',\r\n" +
             "  specs: ['spec.js'],\r\n" +
             "  onPrepare: function(){\r\n" +
             "    browser.driver.get('" + baseUrl +"');\r\n";

  describe[0].spec.actions.forEach(function(action){

    var line = getLine(action);

    console.log(action);
    conf += '    ' + line + ';\r\n';

  });

  conf += "return browser.driver.wait(function() {return browser.driver.getCurrentUrl().then(function(url) {console.log(url);return url === baseUrl;});}, 10000, 'Error');";

  conf += "\r\n}";

  // Update conf.js to run with protractor
  fs.writeFile(__dirname + '/public/exports/conf.js', conf, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file conf.js was saved!");
  });

  var output = "describe('" + describe.string + "', function(){\r\n\r\n";

  describe[1].specs.forEach(function(spec){
    output += "  it('" + spec.string + "', function(){\r\n\r\n";

    spec.actions.forEach(function(action){

      var line = getLine(action);

      output += '    ' + line + ';\r\n';

      console.log(line);
    });

    output += '\r\n  });\r\n\r\n';
  });

  output += '});\r\n';

  // Update spec to run with protractor
  fs.writeFile(__dirname + '/public/exports/spec.js', output, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file spec.js was saved!");
  });

  res.send('ok');
});

function getLine(action){

  var line = null;

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

  return line;
}

http.listen(9000, function () {
 console.log('Server listening on *:9000');

  var webdriver = exec('webdriver-manager start');

  webdriver.stdout.on('data', function(data){
    console.log('webdriver-manager start');
  });

});
