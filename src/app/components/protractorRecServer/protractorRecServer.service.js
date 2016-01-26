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

    /* Spec example */
    this.sample = {
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

    this.getSnippet = function() {
      return this.snippet;
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
      $rootScope.$broadcast('conf', conf);
    };

    this.isLoading = function() {
      return this.loading;
    };

    this.setLoading = function(status) {
      this.loading = status;
    };

    this.isRecording = function() {
      return this.recording;
    };

    this.setRecording = function(status) {
      this.recording = status;
    };
  }
})();
