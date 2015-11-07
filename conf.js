//var Jasmine2HtmlReporter = require('protractor-jasmine2-html-reporter');
//var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');
/*var reporter=new HtmlReporter({
 baseDirectory: '/home/eduardo/tests/', // a location to store screen shots.
 docTitle: 'Protractor Demo Reporter',
 docName:  'protractor-demo-tests-report.html'
 });*/

//var baseUrl = 'http://localhost:8080/pmi/';
var baseUrl = 'http://pmi.sbox.me/';

exports.config = {
  //framework: 'jasmine2',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['test.js'],
  baseUrl: baseUrl,
  onPrepare: function() {

    /*var jasmineReporters = require('jasmine-reporters');
     jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
     consolidateAll: true,
     savePath: '/home/eduardo/testresults',
     filePrefix: 'xmloutput'
     }));*/


    /*jasmine.getEnv().addReporter(
     new HtmlScreenshotReporter({
     dest: '/home/eduardo/tests',
     filename: 'my-report.html'
     })
     );*/

    /*jasmine.getEnv().addReporter(new Jasmine2HtmlReporter(
     {
     savePath: '/home/eduardo/tests',
     screenshotsFolder: 'images'
     }
     ));*/


    //browser.driver.manage().window().maximize();

    //browser.ignoreSynchronization = true;

    browser.driver.get(baseUrl);

    var user   = 'piraja';
    var passwd = 'itaipu';

    element(by.model("user.username")).sendKeys(user);
    element(by.model("user.password")).sendKeys(passwd);
    element(by.id("entrar")).click();

    //browser.pause();

    //browser.get('index.html');

    return browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function(url) {
        console.log(url);
        return url === baseUrl;
      });
    }, 10000, 'Erro ao acessar o sistema');
  }
  /*multiCapabilities: [{
   browserName: 'firefox'
   }, {
   browserName: 'chrome'
   }]*/
};