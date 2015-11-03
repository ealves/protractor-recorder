(function() {
  'use strict';

  angular
      .module('protractorRec')
      .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $location, $http, $log, socket) {

    var vm = this;

    vm.url = 'http://pmi.sbox.me/';

    vm.session = {};
    vm.actions = [];
    vm.lines = [];

    socket.on('click', function(data){
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('keyup', function(data){
      $log.debug('onkeyup');
      $log.debug(data);

      var lastAction = vm.actions[vm.actions.length - 1];

      lastAction.action = 'sendKeys';
      lastAction.value = data;

    });

    socket.on('focus', function(data){
      $log.debug('onfocus');
      $log.debug(data);

    });

    socket.on('assertion', function(data){
      $log.debug('onassertion');
      $log.debug(data);

    });

    socket.on('unload', function(data){
      $log.debug('onunload');
      $log.debug(data);

    });

    socket.on('session-disconnect', function(data){
      $log.debug('on-session-disconnect');
      $log.debug(data);
      vm.getSessionSource();

    });

    vm.snippet = 'var head=document.getElementsByTagName("head")[0],script=document.createElement("script");script.onload=function(){var e=document.createElement("script");e.src="http://localhost:9000/snippet.js",head.appendChild(e)},script.src="https://cdn.socket.io/socket.io-1.3.7.js",head.appendChild(script);';

    vm.setElement = function(element) {

      var target = angular.element(element.outerHTML);
      var parent  = angular.element(element.offsetParent.outerHTML);

      if(element.offsetParent.outerHTML.match(/button/) && !element.outerHTML.match(/input/)){

        vm.addElement(parent, 'button', 'click', target.text());

      } else if(element.outerHTML.match(/input/)){
        vm.addElement(target, 'input', 'click', false);
      }
    };

    vm.addElement = function(element, type, actionType, value) {

      var locators = [];

      if(type == 'input')
        locators.push({type: 'model', value: vm.getAttr('ng-model', element)});

      locators.push({type: 'id', value: '#' + vm.getAttr('id', element)});

      var action = {
        element: element,
        type: type,
        value: value,
        action: actionType,
        locators: locators
      };

      vm.actions.push(action);

      vm.getSessionUrl();

    };

    vm.removeAction = function(index) {
      vm.actions.splice(index, 1);
    };

    vm.getAttr = function(attr, elem) {
      if(elem.attr(attr))
        return elem.attr(attr);
      return false;
    };

    vm.createSession = function() {
      $http({
        method: 'POST',
        url: 'http://localhost:4444/wd/hub/session',
        data: {'desiredCapabilities': {'browserName': 'chrome'}}
      }).then(function successCallback(response) {

        $log.debug('Session Created');

        vm.session.id = response.data.sessionId;

        vm.setSessionUrl();

      });
    };

    vm.getSession = function(){

      $http({
        method: 'GET',
        url: 'http://localhost:4444/wd/hub/sessions'
      }).then(function successCallback(response) {

        $log.debug('Get Session');

        if(response.data.value.length) {
          vm.session = response.data.value[0];

          vm.getSessionSource();
        }

      });

    };

    vm.setSessionUrl = function(){

      $http({
        method: 'POST',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/url',
        data: {'url': vm.url}
      }).then(function successCallback() {

        $log.debug('setSessionUrl');

        vm.getSessionUrl();

      });

    };

    vm.getSessionUrl = function(){

      $http({
        method: 'GET',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/url'
      }).then(function successCallback(response) {

        $log.debug('getSessionUrl');

        vm.session.url = response.data.value;

      });

    };

    /*$scope.$watch('main.url', function(newValue, oldValue){
      $log.debug('watch Url');
      if(newValue != oldValue)
        vm.setSessionUrl();
    });*/

    vm.sessionExecute = function(){

      $http({
        method: 'POST',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/execute',
        data: {'script': vm.snippet, 'args': [{'f': ''}]}
      }).then(function successCallback() {

        $log.debug('Session Executed');

        localStorage.setItem('executed', 'true');
      });

    };

    vm.getSessionSource = function(){

      $http({
        method: 'GET',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/source'
      }).then(function successCallback(response) {

        vm.session.source = response.data.value;

        vm.verifySnippet();
      });

    };

    vm.getSession();

    vm.verifySnippet = function(){

      if(!vm.session.source.match(/snippet\.js/)) {
        vm.sessionExecute();
      }

    };

    vm.exportProtractor = function(){

      $log.debug('Export Protractor');
      var lines = [];

      angular.forEach(vm.actions, function(action){

        if(action.action == 'sendKeys') {
          lines.push("element(by.model('" + action.locators[0].value + "')).sendKeys('" + action.value + "')");
        }

        if(action.action == 'click' && action.type == 'button') {
          lines.push("element(by.buttonText('" + action.value + "')).click()");
        }

      });

      vm.lines = lines;

      $log.debug(lines);

    };

  }
})();
