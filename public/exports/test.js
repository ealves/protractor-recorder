describe('Describe Google Search Example', function(){

  it('Should do a search', function(){

    browser.get('administrativo#/fonte-dados');
    element(by.buttonText('Nova Fonte de Dados')).click();
    element(by.xpath('//label[.="WFS"]')).click();
    element(by.model('currentEntity.nome')).sendKeys('Teste WFS');
    element(by.model('currentEntity.endereco')).sendKeys('http://testewfs2.com.br');

  });

});
