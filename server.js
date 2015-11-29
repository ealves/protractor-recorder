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

  conf.spec.actions.forEach(function(action){

    var line = getLine(action);

    //console.log(action);
    confOutput += '    ' + line + ';\r\n';

  });

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

    var lastAction = null;

    spec.actions.forEach(function(action, index){

      var line = getLine(action);

      console.log(lastAction);

      if(lastAction != null && lastAction.locator && lastAction.locator.type == 'repeater') {

        console.log(spec.actions[index - 1]);

        output += line + ';\r\n';

      } else {

        if (action.locator.type == 'repeater')
          output += '    ' + line + '.';
        else
          output += '    ' + line + ';\r\n';
      }

      lastAction = action;

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

  var line = '';

  if(action.action == 'wait'){

    line = "var EC = protractor.ExpectedConditions;\r\n";

    if(action.locator.type == 'xpath')
      line += "    var elm = element(by.xpath('" + action.locator.value + "'));\r\n";

    if(action.locator.type == 'css')
      line += "    var elm = element(by.css('" + action.locator.value + "'));\r\n";

    line += "    browser.wait(EC.presenceOf(elm), 10000)";

  }

  if(action.type == 'select' && action.action == 'click' && action.locator.type == 'model')
    line = "element(by.model('" + action.locator.value + "')).$('[value=\"" + action.value + "\"]').click()";

  if(action.action == 'click' && action.locator.type == 'repeater')
    line = "element(by.repeater('" + action.locator.value + "').row(" + action.value + "))";

  if(action.action == 'sendKeys' && action.locator.type == 'model') {
    line = "element(by.model('" + action.locators[0].value + "')).sendKeys('" + action.value + "')";
  }

  if(action.action == 'sendKeys' && action.locator.type == 'css') {
    line = "element(by.css('" + action.locator.value + "')).sendKeys('" + action.value + "')";
  }

  if(action.action == 'click' && action.type == 'button' && action.value) {
    line = "element(by.buttonText('" + action.value + "')).click()";
  }

  if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText') {
    line = "element(by.linkText('" + action.value + "')).click()";
  }

  if(action.action == 'click' && action.type == 'a' && action.locator.type == 'get') {
    line = "browser.get('" + action.locator.value + "')";
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

  if(action.action == 'assertion' && action.locator.type == 'bind')
    line = "expect(element(by.binding('" + action.locator.value + "')).getText()).toBe('" + action.value + "')";

  if(action.action == 'assertion' && action.locator.type == 'id')
    line = "expect(element(by.id('" + action.locator.value + "')).getText()).toBe('" + action.value + "')";

  if(action.action == 'assertion' && action.locator.type == 'xpath')
    line = "expect(element(by.xpath('" + action.locator.value + "')).getText()).toBe('" + action.value + "')";

  if(action.action == 'assertion' && action.locator.type == 'css')
    line = "expect(element(by.css('" + action.locator.value + "')).getText()).toBe('" + action.value + "')";

  return line;
}

http.listen(9000, function () {
 console.log('Server listening on *:9000');

  /*var webdriver = exec('webdriver-manager start');

  webdriver.stdout.on('data', function(data){
    console.log('webdriver-manager start');
  });*/

});
