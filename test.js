describe('Fonte de Dados', function(){

  it('Deve cadastrar fonte de dados', function(){

    browser.get('administrativo#/fonte-dados');
    element(by.buttonText('Nova Fonte de Dados')).click();
    element(by.xpath('//label[.="WMS"]')).click();
    element(by.model('currentEntity.nome')).sendKeys('Teste WMS');
    element(by.model('currentEntity.endereco')).sendKeys('http://teste.com');
    element(by.buttonText('Salvar')).click();

  });

});
