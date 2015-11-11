describe('Fonte de Dados', function(){

  it('Teste', function(){

    browser.get('administrativo#/fonte-dados');
    element(by.xpath('body/div[1]/div[2]/div[1]/div[2]/div[1]/div[1]/div[1]/div[2]/div[2]/div[1]/div[5]/div[4]/div[2]/div[1]/a[2]/i[1]')).click();
    element(by.buttonText('Cancelar')).click();

  });

});
