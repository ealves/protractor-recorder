describe('Fonte de Dados', function(){

  it('Deve cadastrar fonte de dados', function(){

    browser.get('administrativo#/fonte-dados');
    element(by.buttonText('Nova Fonte de Dados')).click();
    element(by.xpath('//label[.="WFS"]')).click();
    element(by.model('currentEntity.nome')).sendKeys('Teste WFS');
    element(by.model('currentEntity.endereco')).sendKeys('http://testewfs.com');
    element(by.buttonText('Salvar')).click();
    expect(element(by.binding('msg.text')).getText()).toBe('Fonte de dados geográficos inserida com sucesso!');

  });

});
