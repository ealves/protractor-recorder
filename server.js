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

  //console.log(socket.id);
  //console.log(socket);

  console.log('a user connected');

  socket.on('onclick', function (data) {
    console.log('onclick');
    console.log(data);

    io.emit('click', data);

  });

  socket.on('onchange', function (data) {
    console.log('onchange');
    console.log(data);

    io.emit('change', data);

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

  request({
    uri: url + '/' + include,
  }, function(error, response, body) {
    res.send(body);
  });

});

app.post('/export', function(req, res){

  var conf = JSON.parse(req.body.conf);
  var describe = JSON.parse(req.body.describe);
  var baseUrl  = req.body.baseUrl;
  //var onPrepare = JSON.parse(req.body.onPrepare);

  var confOutput = "exports.config = {\r\n";

  if(conf.jasmine)
    confOutput += "  framework: 'jasmine2',\r\n";

  confOutput += "  seleniumAddress: '" + conf.seleniumAddress + "',\r\n" +
             "  baseUrl: '" + baseUrl + "',\r\n" +
             "  specs: ['spec.js'],\r\n" +
             "  onPrepare: function(){\r\n";

  if(conf.maximize)
    confOutput += "    browser.driver.manage().window().maximize();\r\n";

  confOutput += "    browser.driver.get('" + baseUrl +"');\r\n";

  if(conf.spec.lines){
    conf.spec.lines.forEach(function(line){

      confOutput += '    ' + line + '\r\n';

    });
  }

  if(conf.login)
    confOutput += "    return browser.driver.wait(function() {\r\n" +
        "      return browser.driver.getCurrentUrl().then(function(url) {\r\n" +
        "        return url != '" + baseUrl + "';});\r\n" +
        "    }, 10000, 'Error');\r\n";

  confOutput += "  }\r\n}";

  // Update conf.js to run with protractor
  fs.writeFile(__dirname + '/public/exports/conf.js', confOutput, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file conf.js was saved!");
  });

  var output = "describe('" + describe[0].string + "', function(){\r\n\r\n";

  describe[0].specs.forEach(function(spec){
    output += "  it('" + spec.string + "', function(){\r\n\r\n";

    if(spec.lines){  
      spec.lines.forEach(function(line, index){

        if(line.slice(-1) == ';')
          output += line + '\r\n    ';
        else
          output += line;

        /*if(lastAction != null && lastAction.locator && lastAction.locator.type == 'repeater') {

          output += line + ';\r\n';

        } else {

          if (action.locator.type == 'repeater')
            output += '    ' + line + '.';
          else
            output += '    ' + line + ';\r\n';
        }

        lastAction = action;*/

      });
    }

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

http.listen(9000, function () {
 console.log('Server listening on *:9000');

  /*var webdriver = exec('webdriver-manager start');

  webdriver.stdout.on('data', function(data){
    console.log('webdriver-manager start');
  });*/

});
