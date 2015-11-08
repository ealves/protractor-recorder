(function() {
  'use strict';

  angular
      .module('protractorRec')
      .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $log, $filter, socket) {

    var vm = this;

    vm.url = localStorage.getItem('url') ? localStorage.getItem('url') : 'http://google.com';

    vm.session = {};

    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];

    //vm.actions = [];
    vm.lines = [];

    vm.describe = {};
    vm.spec = [];

    //$scope.actions = vm.actions;

    /*var actions = localStorage.getItem('actions');

    if(actions) {
      vm.actions = angular.fromJson(actions);
    }*/

    vm.sample = {
      string: 'Describe Google Search Example',
      specs: [
        {
          string: 'Should do a search',
          actions:
            [
              {"type":"link","value":"http://google.com","action":"get"}
            ]
        }
      ]
    };

    vm.blankSpec = {
      string: '',
      actions: []
    };

    socket.on('click', function(data){
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('keyup', function(data){
      $log.debug('onkeyup');
      $log.debug(data);

      var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

      lastAction.action = 'sendKeys';
      lastAction.value = data;

    });

    socket.on('assertion', function(data){
      $log.debug('onassertion');
      $log.debug(data);

    });

    socket.on('session-disconnect', function(data){
      $log.debug('on-session-disconnect');
      $log.debug(data);
      vm.getSessionSource();

    });

    vm.setExample = function() {

      if(!vm.describes.length) {

        vm.describes.push(angular.copy(vm.sample));

        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);

        vm.createSession();
      } else {
        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);
      }

    };

    vm.newDescribe = function(){
      $log.debug('newDescribe');

    };

    vm.addSpec = function(){
      $log.debug('addSpec');

      vm.describe.specs.push(angular.copy(vm.blankSpec));
      vm.setSpec(vm.describe.specs[vm.describe.specs.length - 1]);

    };

    vm.setDescribe = function(describe){
      vm.describe = describe;
    };

    vm.setSpec = function(spec){
      vm.spec = spec;
    };

    vm.snippet = 'var head=document.getElementsByTagName("head")[0],script=document.createElement("script");script.onload=function(){var e=document.createElement("script");e.src="http://localhost:9000/snippet.js",head.appendChild(e)},script.src="http://localhost:9000/socket.io-1.3.7.js",head.appendChild(script);';

    vm.setElement = function(element) {

      var target = angular.element(element.outerHTML);
      var parent  = !element.offsetParent.outerHTML ? [] : angular.element(element.offsetParent.outerHTML);

      if(target[0].tagName.match(/^button/i) || parent[0].tagName.match(/^button/i) && !target[0].tagName.match(/^input/i)){

        vm.addElement(parent, 'button', 'click', target.text().trim());

      } else if(target[0].tagName.match(/^input/i)){
        vm.addElement(target, 'input', 'click', false);
      } else if(target[0].tagName.match(/^a/i)) {
        vm.addElement(target, 'a', 'click', false);
      } else {

        var value = target.text() ? target.text() : false;

        vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value, element.xPath);
      }
    };

    vm.addElement = function(element, type, actionType, value, xPath) {

      var locators = [];

      if(type == 'button' && value)
        locators.push({type: 'buttonText', value: value});

      if(type == 'input' && vm.getAttr('ng-model', element))
        locators.push({type: 'model', value: vm.getAttr('ng-model', element)});

      if(type == 'input' && vm.getAttr('type', element) == 'button') {
        locators.push({type: 'id', value: vm.getAttr('id', element)});
      }

      if(type == 'input' && vm.getAttr('type', element) == 'submit') {
        locators.push({type: 'css', value: '[value="' + element.val() + '"]'});
      }

      if(vm.getAttr('href', element)) {
        locators.push({type: 'href', value: vm.getAttr('href', element)});
        value = vm.getAttr('href', element);
      }

      if(vm.getAttr('id', element))
        locators.push({type: 'id', value: '#' + vm.getAttr('id', element)});

      if(vm.getAttr('class', element)) {
        
        if(value)
          locators.push({type: 'xpath', value: '//' + type + '[.="' + value + '"]'});
        else
          locators.push({type: 'xpath', value: xPath});
      }

      var action = {
        element: element.html(),
        type: type,
        value: value,
        action: actionType,
        locators: locators,
        locator: locators ? locators[0].value : null
      };

      vm.spec.actions.push(action);

      //localStorage.setItem('actions', angular.toJson(vm.actions));

      //vm.getSessionUrl();

    };

    vm.getAllDataBind = function(){

      var matches = vm.session.source.match(/\{{2}(.*?)\}{2}|ng-bind=["|'](.*?)["|']/igm);

      $log.debug(matches);

    };

    vm.runTest = function(){

      $log.debug('runTest');

      $http({
        method: 'GET',
        url: 'http://localhost:9000/run'
      }).then(function successCallback(response) {

        $log.debug('Test finished');
        $log.debug(response);

      });
    };

    vm.removeSpec = function(index){
      vm.describe.specs.splice(index, 1);
    };

    vm.exportProtractor = function(){

      $http({
        method: 'POST',
        url: 'http://localhost:9000/export',
        data: {describe: angular.toJson(vm.describe)}
      }).then(function successCallback(response) {

        $log.debug('Exported');
        $log.debug(response);

      });

      $log.debug('Export Protractor');
      var lines = [];

      angular.forEach(vm.spec.actions, function(action){

        if(action.action == 'sendKeys') {
          lines.push("element(by.model('" + action.locators[0].value + "')).sendKeys('" + action.value + "')");
        }

        if(action.action == 'click' && action.type == 'button' && action.value) {
          lines.push("element(by.buttonText('" + action.value + "')).click()");
        }

        if(action.action == 'click' && action.type == 'a') {
          lines.push("browser.get('" + action.value + "')");
        }

        if(action.action == 'click' && action.locators[0].type == 'xpath') {
          lines.push("element(by.xpath('" + action.locators[0].value + "')).click()");
        }

        if(action.action == 'click' && action.locators[0].type == 'id') {
          lines.push("element(by.id('" + action.locators[0].value + "')).click()");
        }

        if(action.action == 'click' && action.type == 'input' && action.locators[0].type == 'css') {
          lines.push("element(by.css('" + action.locators[0].value + "')).click()");
        }

      });

      vm.lines = lines;

      $log.debug(lines);

    };

    vm.removeAction = function(index) {
      vm.spec.actions.splice(index, 1);

      //localStorage.setItem('actions', angular.toJson(vm.actions));

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
        vm.getSessionSource();

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

    $scope.$watch('main.describe', function () {
      $log.debug('watch describe');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    }, true);

    $scope.$watchCollection('main.describes', function () {
      $log.debug('watch describes');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    });

    $scope.$watch('main.url', function(){
      $log.debug('watch Url');

      localStorage.setItem('url', vm.url);

      /*if(newValue != oldValue)
        vm.setSessionUrl();*/
    });

    vm.sessionExecute = function(){

      $http({
        method: 'POST',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/execute',
        data: {'script': vm.snippet, 'args': [{'f': ''}]}
      }).then(function successCallback() {

        $log.debug('Session Executed');

      });

    };

    vm.getSessionSource = function(){

      if(vm.session.id){
        $http({
          method: 'GET',
          url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/source'
        }).then(function successCallback(response) {

          vm.session.source = response.data.value;

          /*var sourceHtml = angular.element(document.querySelector('#source'));
           sourceHtml.html(response.data.value);*/

          vm.getNgIncludes();
          vm.verifySnippet();
        });
      }

    };

    vm.getNgIncludes = function(){

      var ngIncludes = vm.session.source.match(/ngInclude:\s?["|'](.*?)["|']/igm);

      $log.debug(ngIncludes);

      var includes = [];

      angular.forEach(ngIncludes, function(include){

        include = include.replace(/\'/g, '');
        include = include.replace(/\"/g, '');
        include = include.replace('ngInclude:', '');
        include = include.trim();

        if(!$filter('filter')(includes, include).length){

          $http({
            method: 'POST',
            url: 'http://localhost:9000/html',
            data: {url: vm.url, include: include}
          }).then(function successCallback(response) {

            vm.session.source += response.data;
            vm.getAllDataBind();

          });
        }

        //includes.push(include);

      });


    };

    vm.verifySnippet = function(){

      if(vm.session.source && !vm.session.source.match(/snippet\.js/)) {
        vm.sessionExecute();
      }

    };

    vm.deleteSession = function(){

      $http({
        method: 'DELETE',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id
      }).then(function successCallback(response) {

        $log.debug('Session Deleted');
        $log.debug(response);

        vm.session = {};
      });

    };

    vm.setExample();
    vm.getSession();


  }
})();
