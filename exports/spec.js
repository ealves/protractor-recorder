describe('Describe Protractor Example', function(){

  it('Should navigate to protractortest.org', function(){

    element(by.linkText('Tutorial')).click();
    expect(element(by.xpath('//*[@id="tutorial"]')).getText()).toBe('Tutorial');

  });

});
