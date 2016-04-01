exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  baseUrl: 'http://protractortest.org',
  specs: ['spec.js'],
  capabilities: {browserName: 'chrome'},
  onPrepare: function(){
    browser.driver.manage().window().maximize();
    browser.driver.get('http://protractortest.org');
    
    element(by.linkText('Quick Start')).click();
    
    element(by.id('setup')).click();
  }
}