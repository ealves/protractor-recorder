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
  function protractorRecServer($rootScope, $http, $location) {

    this.serverUrl = 'http://localhost:9000/';

    this.spec = {};
    this.describes = [];
    this.describe = {};

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

    this.getConf = function() {
      return localStorage.getItem('conf') ? angular.fromJson(localStorage.getItem('conf')) : {};
    };

    this.setSpec = function(spec) {
      this.spec = spec;
      $rootScope.$broadcast('spec', spec);
    };

    this.setDescribe = function(describe) {
      this.describe = describe;
      $rootScope.$broadcast('describe', describe);
    };

    this.getDescribes = function() {
      return localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];
    };

    this.setDescribes = function(describe) {
      localStorage.setItem('describe', angular.toJson(describe));
      $rootScope.$broadcast('describe', describe);
    };

    this.getDescribe = function(id) {
      id = parseInt(id);
      return this.getDescribes()[id - 1];
    };

    this.getSession = function() {
      return localStorage.getItem('session') ? angular.fromJson(localStorage.getItem('session')) : {};
    };

    this.getSpec = function(id) {

      if(id == undefined && $location.path() == '/conf') {
        return this.getConf().spec;
      }
      id = parseInt(id);
      return this.getDescribe(1).specs[id - 1];
    };

    this.setLoading = function(status) {
      if(typeof status == 'string')
        status == 'true' ? true : false;
      localStorage.setItem('loading', status);
    };

    this.isLoading = function() {
      var loading = localStorage.getItem('loading') != undefined ? localStorage.getItem('loading') : false;
      if(typeof loading == 'string')
        return loading == 'true' ? true : false;
    };

    this.setRecording = function(status) {
      if(typeof status == 'string')
        status = status == 'true' ? true : false;
      localStorage.setItem('recording', status);
    };

    this.isRecording = function() {
      var recording = localStorage.getItem('recording') != undefined ? localStorage.getItem('recording') : false;
      if(typeof recording == 'string')
        return recording == 'true' ? true : false;
    };

    this.setSnippet = function(status) {
      if(typeof status == 'string')
        status = status == 'true' ? true : false;
      localStorage.setItem('snippet', status);
    };

    this.hasSnippet = function() {
      var snippet = localStorage.getItem('snippet') != undefined ? localStorage.getItem('snippet') : false;
      if(typeof snippet == 'string')
        return snippet == 'true' ? true : false;
    };

    this.setSession = function(session) {
      if(session == undefined) {
        session = {};
        this.setRecording(false);
        this.setSnippet(false);
      }
      localStorage.setItem('session', angular.toJson(session));
      $rootScope.$broadcast('session', session);
    };

    this.getLine = function(action) {

      var line = '';

      if(action.action == 'wait') {

        var elm = '';

        if(action.locator.type == 'xpath')
          elm = "element(by.xpath('" + action.locator.value + "'))";

        if(action.locator.type == 'css')
          elm = "element(by.css('" + action.locator.value + "');";

        line += "browser.wait(EC.presenceOf(" + elm + "), 10000);";

      }

      if(action.locator.type == 'xpath')
        var locator = "element(by.xpath('" + action.locator.value + "'))";

      if(action.type == 'select' && action.action == 'click' && action.locator.type == 'model')
        line = "element(by.model('" + action.locator.value + "')).$('[value=\"" + action.value + "\"]').click();";

      if(action.action == 'click' && action.locator.type == 'repeater')
        line = "element(by.repeater('" + action.locator.value + "').row(" + action.value + ")).";

      if(action.action == 'sendKeys' && action.locator.type == 'model')
        line = "element(by.model('" + action.locator.value + "')).sendKeys('" + action.value + "');";

      if(action.action == 'sendKeys' && action.locator.type == 'xpath')
        line = "element(by.xpath('" + action.locator.value + "')).sendKeys('" + action.value + "');";

      if(action.action == 'sendKeys' && action.locator.type == 'id')
        line = "element(by.id('" + action.locator.value + "')).sendKeys('" + action.value + "');";

      if(action.action == 'click' && action.locator.type == 'model')
        line = "element(by.model('" + action.locator.value + "')).click();";

      if(action.action == 'sendKeys' && action.locator.type == 'css')
        line = "element(by.css('" + action.locator.value + "')).sendKeys('" + action.value + "');";

      if(action.action == 'click' && action.type == 'button' && action.value)
        line = "element(by.buttonText('" + action.value + "')).click();";

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText')
        line = "element(by.linkText('" + action.value + "')).click();";

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'get')
        line = "browser.get('" + action.locator.value + "');";

      if(action.action == 'click' && action.locator.type == 'xpath')
        line = "element(by.xpath('" + action.locator.value + "')).click();";

      if(action.action == 'click' && action.locator.type == 'id')
        line = "element(by.id('" + action.locator.value + "')).click();";

      if(action.action == 'click' && action.locator.type == 'css')
        line = "element(by.css('" + action.locator.value + "')).click();";

      if(action.action == 'assertion' && action.locator.type == 'bind')
        line = "expect(element(by.binding('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'id')
        line = "expect(element(by.id('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'xpath')
        line = "expect(element(by.xpath('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'css')
        line = "expect(element(by.css('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'browser' && action.type == 'sleep')
        line = "browser.sleep(" + action.value + ");";

      if(action.action == 'click' && action.type == 'canvas') {
        action.value = action.value.split('x');
        line = "browser.actions().mouseMove(element(by.xpath('" + action.locator.value + "')), {x: " + action.value [0] + ", y: " + action.value[1] + "}).click().perform();";
      }

      if(action.action.match(/[mouseDown|mouseMove|mouseUp]/)) {
        action.value = action.value.split('x');

        line = "browser.actions()." + action.action + "(";

        if(locator)
          line += "element(by.xpath('" + action.locator.value + "')), ";

        line += "{x: " + action.value [0] + ", y: " + action.value[1] + "}";

        if(action.value)
          line += ").click().perform();";
      }

      if(action.index != undefined) {
        line = line.replace('element', 'element.all');
        line = line.replace(')).', ')).get(' + action.index + ').');
      }

      return line;
    };
  }
})();
