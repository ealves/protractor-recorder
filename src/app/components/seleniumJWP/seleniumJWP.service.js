/**
 * Created by ealves on 12/12/15.
 *
 * Selenium Service Json Wire Protocol (JWP)
 */
(function() {
  'use strict';

  angular
      .module('protractorRec')
      .service('seleniumJWP', seleniumJWP);

  /** @ngInject */
  function seleniumJWP($http) {

    this.domain  = 'http://localhost';
    this.port    = '4444';
    this.url     = '';
    this.session = {};

    this.setConfigUrl = function(){
      this.url = this.domain + ':' + this.port + '/wd/hub/';
    };

    this.setSession = function(session){
      if(session == undefined)
        return this.session = {};
      if(session.sessionId)
        session.id = session.sessionId;
      return this.session = session;
    };

    this.newSession = function(options){
      return $http({
        method: 'POST',
        url: this.url + 'session',
        data: options
      });
    };

    this.setSessionUrl = function(url){
      return $http({
        method: 'POST',
        url: this.url + 'session/' + this.session.id + '/url',
        data: {url: url}
      })
    };

    this.getSessionUrl = function(){
      return $http({
        method: 'GET',
        url: this.url + 'session/' + this.session.id + '/url'
      });
    };

    this.getSessions = function(){
      return $http({
        method: 'GET',
        url: this.url + 'sessions'
      });
    };

    this.sessionExecute = function(script){
      return $http({
        method: 'POST',
        url: this.url + 'session/' + this.session.id + '/execute',
        data: {script: script, args: [{f: ''}]}
      });
    };

    this.getSessionSource = function(){
      return $http({
        method: 'GET',
        url: this.url + 'session/' + this.session.id + '/source'
      })
    };

    this.findSessionElement = function(element){
      return $http({
        method: 'POST',
        url: this.url + 'session/' + this.session.id + '/element',
        data: element
      });
    };

    this.sessionElementExecute = function(elementId, element, data){
      return $http({
        method: 'POST',
        url: this.url + 'session/' + this.session.id + '/element/' + elementId + '/' + element.action,
        data: data
      });
    };

    this.deleteSession = function(){
      return $http({
        method: 'DELETE',
        url: this.url + 'session/' + this.session.id
      })
    };

    this.setConfigUrl();

  }
})();