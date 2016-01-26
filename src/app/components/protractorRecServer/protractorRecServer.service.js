/**
 * Created by ealves on 12/12/15.
 *
 * WebDriver Manager Service
 */
(function() {
  'use strict';

  angular
    .module('protractorRec')
    .service('protractorRecServer', protractorRecServer);

  /** @ngInject */
  function protractorRecServer($rootScope, $http) {

    this.serverUrl = 'http://localhost:9000/';

    this.loading = false;
    this.recording = false;

    /**
     * Javascript snippet to inject on session
     */
    this.snippet = 'if(!document.getElementById("recorder-iframe")){' +
      'var b=document.getElementsByTagName("body")[0];' +
      'var i=document.createElement("iframe");' +
      'i.id="recorder-iframe";' +
      'i.setAttribute("style", "display:none");' +
      'b.appendChild(i);' +
      'var i = document.getElementById("recorder-iframe");' +
      'var s = i.contentWindow.document.createElement("script");' +
      's.onload=function(){' +
      'var s = i.contentWindow.document.createElement("script");' +
      's.src = "http://localhost:9000/snippet.js";' +
      'i.contentWindow.document.body.appendChild(s);' +
      '},s.src = "http://localhost:9000/socket.io-1.3.7.js",i.contentWindow.document.body.appendChild(s);}';

    /* Conf example */
    this.confSample = {
      string: 'Conf.js',
      baseUrl: 'http://protractortest.org',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      capabilities: ['chromedriver'],
      spec: {
        actions: [
          {type: 'link', value: 'http://protractortest.org', action: 'get'}
        ]
      }
    };

    /* Spec example */
    this.specSample = {
      string: 'Describe Protractor Example',
      specs: [
        {
          string: 'Should navigate to protractortest.org',
          actions: [
            {
              type: 'a',
              value: 'Tutorial',
              action: 'click',
              locator: {
                type: 'linkText',
                value: 'Tutorial',
                strategy: 'link text'
              },
              locators: [
                {
                  type: 'linkText',
                  value: 'Tutorial',
                  strategy: 'link text'
                },
                {
                  type: 'get',
                  value: '#/tutorial'
                }
              ]
            },
            {
              type: 'h1',
              value: 'Tutorial',
              action: 'assertion',
              locator: {
                type: 'xpath',
                value: "//*[@id=\"tutorial\"]",
                strategy: 'xpath'
              },
              locators: [
                {
                  type: 'id',
                  value: 'tutorial',
                  strategy: 'id'
                }
              ]
            }
          ]
        }
      ]
    };

    this.getCapabilities = function(){
      return $http({
        method: 'GET',
        url: this.serverUrl + 'webdriver-manager/status'
      });
    };

    this.runProtractor = function() {
      return $http({
        method: 'GET',
        url: this.serverUrl + 'run'
      });
    };

    this.exportProtractor = function(data) {
      return $http({
        method: 'POST',
        url: 'http://localhost:9000/export',
        data: data
      })
    };

    this.getHtmlSource = function(data) {
      return $http({
        method: 'POST',
        url: this.serverUrl + 'html',
        data: data
      });
    };

    this.setConf = function(conf) {
      localStorage.setItem('conf', angular.toJson(conf));
      $rootScope.$broadcast('conf', conf);
    };

    this.isLoading = function() {
      return this.loading;
    };

    this.setLoading = function(status) {
      localStorage.setItem('loading', status);
      this.loading = status;
    };

    this.isRecording = function() {
      return this.recording;
    };

    this.setRecording = function(status) {
      localStorage.setItem('recording', status);
      this.recording = status;
    };

    this.getLine = function(action) {

      var line = '';

      if(action.action == 'wait'){

        var elm = '';

        if(action.locator.type == 'xpath')
          elm = "element(by.xpath('" + action.locator.value + "'))";

        if(action.locator.type == 'css')
          elm = "element(by.css('" + action.locator.value + "');";

        line += "browser.wait(EC.presenceOf(" + elm + "), 10000);";

      }

      if(action.type == 'select' && action.action == 'click' && action.locator.type == 'model')
        line += "element(by.model('" + action.locator.value + "')).$('[value=\"" + action.value + "\"]').click();";

      if(action.action == 'click' && action.locator.type == 'repeater')
        line += "element(by.repeater('" + action.locator.value + "').row(" + action.value + ")).";

      if(action.action == 'sendKeys' && action.locator.type == 'model') {
        line += "element(by.model('" + action.locator.value + "')).sendKeys('" + action.value + "');";
      }

      if(action.action == 'click' && action.locator.type == 'model') {
        line += "element(by.model('" + action.locator.value + "')).click();";
      }

      if(action.action == 'sendKeys' && action.locator.type == 'css') {
        line += "element(by.css('" + action.locator.value + "')).sendKeys('" + action.value + "');";
      }

      if(action.action == 'click' && action.type == 'button' && action.value) {
        line += "element(by.buttonText('" + action.value + "')).click();";
      }

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText') {
        line += "element(by.linkText('" + action.value + "')).click();";
      }

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'get') {
        line += "browser.get('" + action.locator.value + "');";
      }

      if(action.action == 'click' && action.locator.type == 'xpath') {
        line += "element(by.xpath('" + action.locator.value + "')).click();";
      }

      if(action.action == 'click' && action.locator.type == 'id') {
        line += "element(by.id('" + action.locator.value + "')).click();";
      }

      if(action.action == 'click' && action.locator.type == 'css') {
        line += "element(by.css('" + action.locator.value + "')).click();";
      }

      if(action.action == 'assertion' && action.locator.type == 'bind')
        line += "expect(element(by.binding('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'id')
        line += "expect(element(by.id('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'xpath')
        line += "expect(element(by.xpath('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'css')
        line += "expect(element(by.css('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'browser' && action.type == 'sleep')
        line += "browser.sleep(" + action.value + ");";

      return line;
    };

  }
})();
