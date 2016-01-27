(function () {
  'use strict';

  angular
    .module('protractorRec')
    .controller('NavbarController', NavbarController);

  /** @ngInject */
  function NavbarController($rootScope, $scope, $log, $location, $filter, $mdToast, $document, $routeParams, socket, protractorRecServer, seleniumJWP) {

    var vm = this;

    vm.protractorRecServer = protractorRecServer;
    /*-------------------------------------------------------------------
     *              ATTRIBUTES
     *-------------------------------------------------------------------*/

    vm.showSelectedOptions = false;
    vm.index = false;

    vm.capabilities  = [];

    /* If first run set examples or get from local storage */
    vm.conf      = localStorage.getItem('conf') ? angular.fromJson(localStorage.getItem('conf')) : false;
    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];
    vm.session   = localStorage.getItem('session') ? angular.fromJson(localStorage.getItem('session')) : {};

    vm.loading   = localStorage.getItem('loading') != undefined ? localStorage.getItem('loading') : false;
    vm.recording = localStorage.getItem('recording') != undefined ? localStorage.getItem('recording') : false;

    protractorRecServer.setLoading(vm.loading);
    protractorRecServer.setRecording(vm.recording);

    /**
     * Javascript snippet to inject on session
     */
    vm.snippet = 'if(!document.getElementById("recorder-iframe")){' +
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

    vm.lines         = [];
    vm.describe      = {};
    vm.spec          = [];
    vm.dataBind      = [];

    vm.selectedItems = 0;

    /* Configuration example */
    if(!vm.conf) {
      protractorRecServer.setConf(protractorRecServer.confSample);
    }

    /*-------------------------------------------------------------------
     * 		 				  BROADCAST MESSAGES
     *-------------------------------------------------------------------*/
    $scope.$on('conf', function(events, args) {
      vm.conf = args;
    });

    /*-------------------------------------------------------------------
     * 		 				  SOCKET ON
     *-------------------------------------------------------------------*/
    socket.on('session-disconnect', function (data) {

      seleniumJWP.getSessionUrl().success(function(response){

        if(vm.session.url != response.value && !vm.isSnippet) {

          protractorRecServer.setLoading(true);

          vm.getSessionSource();

        }

        vm.session.url = response.value;
      });

      //vm.isSnippet = false;


      $log.debug('on-session-disconnect');
      $log.debug(data);

    });

    socket.on('protractor-log', function (data) {
      $log.debug('protractor-log');
      $log.debug(data);
    });

    vm.openConf = function() {
      $location.url('/conf');
    };

    vm.verifySnippet = function(){

      var countIframe = vm.session.source.match(/recorder-iframe/);
      countIframe != null ? countIframe.length : countIframe = 0;

      if (!vm.isSnippet && countIframe == 0) {
        vm.sessionExecute();
      } else {
        protractorRecServer.setLoading(false);
      }
    };

    /**
     * Get all html from ng-includes and concatenate with main source
     */
    vm.getNgIncludes = function () {

      $log.debug('getNgIncludes');

      var ngIncludes = vm.session.source.match(/ngInclude:\s?["|'](.*?)["|']/igm);
      var includes = [];

      angular.forEach(ngIncludes, function (include) {

        include = include.replace(/:\s|\"|\'|ngInclude|{{|}}/g, '').trim();

        if (!$filter('filter')(includes, include).length) {

          protractorRecServer.getHtmlSource({url: vm.url, include: include}).success(function(response){
            vm.session.source += response;
            vm.getAllDataBind();
          });
        }
        includes.push(include);
      });
    };

    vm.getSessionSource = function () {

      if (vm.session.id) {
        seleniumJWP.getSessionSource().success(function(response) {
          vm.session.source = response.value;
          if(response.value) {
            vm.getNgIncludes();
            vm.verifySnippet();
          }
        }).error(function(response){
          $log.debug(response);
          $log.debug('Error session source');
          vm.deleteSession();
        });
      } else {
        protractorRecServer.setLoading(false);
        protractorRecServer.setRecording(false);
      }
    };

    vm.setSessionUrl = function () {
      seleniumJWP.setSessionUrl(vm.conf.baseUrl).success(function(){
        $log.debug('setSessionUrl');
        vm.getSessionUrl();
        vm.getSessionSource();
      });
    };

    vm.getSessionUrl = function () {
      seleniumJWP.getSessionUrl().success(function(response){
        $log.debug('getSessionUrl');
        vm.session.url = response.value;
      });
    };

    vm.runTest = function () {

      $log.debug('runTest');

      protractorRecServer.runProtractor().success(function(response){
        $log.debug('Test finished');
        $log.debug(response);
      });
    };

    vm.createSession = function () {

      if(!vm.session.id) {
        protractorRecServer.setLoading(true);
        var options = {'desiredCapabilities': {'browserName': 'chrome', acceptSSlCerts: true}};

        seleniumJWP.newSession(options).success(function(response){
          $log.debug('Session Created');
          seleniumJWP.setSession(response);
          vm.session.id = response.sessionId;

          protractorRecServer.setRecording(true);

          protractorRecServer.setConf(vm.conf);

          vm.setSessionUrl();
        });
      } else {
        protractorRecServer.setRecording(true);
      }
    };

    vm.pauseRecording = function(){
      protractorRecServer.setRecording(false);
    };

    $scope.$watch('navbar.conf', function () {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    $scope.$watch('navbar.describe', function () {
      $log.debug('watch describe');
      localStorage.setItem('describes', angular.toJson(vm.describes));

    }, true);

    $scope.$watchCollection('navbar.describes', function () {
      $log.debug('watch describes');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    });

    $scope.$watch('navbar.session', function () {
      $log.debug('watch session');
      localStorage.setItem('session', angular.toJson(vm.session));
    }, true);

    /**
     * Get all data bind to suggest on assertions
     */
    vm.getAllDataBind = function () {

      $log.debug('getAllDataBind');

      var dataBind = vm.session.source.match(/\{{2}(.*?)\}{2}|ng-bind=["|'](.*?)["|']/igm);

      angular.forEach(dataBind, function (data) {

        data = data.replace(/\"|\'|ng-bind=|{{|}}/g, '').trim();

        if (!$filter('filter')(vm.dataBind, data).length) {

          vm.dataBind.push({type: 'bind', value: data});

        }

      });

      $log.debug(dataBind);
      $log.debug(vm.dataBind);

    };

    vm.sessionExecute = function () {

      seleniumJWP.sessionExecute(protractorRecServer.snippet).success(function() {
        $log.debug('Session Executed');

        if (!vm.isSnippet) {
          $mdToast.show(
            $mdToast.simple()
              .content('Session ready to record!')
              .position('bottom left')
              .hideDelay(3000)
          );
        }

        protractorRecServer.setLoading(false);

        vm.isSnippet = true;
        vm.getSessionUrl();
      });

    };

    vm.getAttr = function (attr, elem) {
      if (elem.attr(attr))
        return elem.attr(attr);
      return false;
    };

    vm.clearSession = function(){
      vm.session = {};
      seleniumJWP.setSession();

      protractorRecServer.setLoading(false);
      protractorRecServer.setRecording(false);
    };

    vm.deleteSession = function(){
      seleniumJWP.deleteSession().success(function() {
        $log.debug('Session Deleted');
        vm.clearSession();
      }).error(function(response){
        $log.debug(response);
        vm.clearSession();
      });
    };

    vm.getCapabilities = function(){
      $log.debug('getCapabilities');
      protractorRecServer.getCapabilities().success(function(response){
        vm.capabilities = response;
        vm.capabilities.forEach(function(capability){
          if(!vm.conf.capabilities.indexOf(capability.driver)){
            capability.checked = true;
          }
        });
      }).error(function(message){
        $log.debug(message);
      });
    };

    vm.setDescribe = function (describe) {
      vm.describe = describe;
    };

    vm.setSpec = function (spec, index) {

      $log.debug($routeParams);

      $log.debug('setSpec');
      if(vm.showConf && index == undefined) {
        vm.showConf = true;
        vm.spec = vm.conf.spec;
        $location.path('/conf');
      } else {
        vm.spec = spec;
        vm.showConf = false;
        if(index)
          $location.path('/spec/' + index);
      }

      angular.forEach(vm.spec.actions, function(action) {
        action.checked = false;
      });
    };

    vm.setExample = function () {

      if (!vm.describes.length) {

        vm.describes.push(angular.copy(protractorRecServer.specSample));
        vm.conf = angular.copy(protractorRecServer.confSample);

        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);

        vm.createSession();
      } else {
        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);
      }

    };

    vm.exportProtractor = function () {

      $log.debug('exportProtractor');

      vm.conf = protractorRecServer.getConf();
      /* Get line to export actions in conf.js */
      vm.conf.spec.lines = [];

      angular.forEach(vm.conf.spec.actions, function (action) {

        if(action.breakpoint) {
          vm.conf.spec.lines('    browser.pause();');
        }

        vm.conf.spec.lines.push(protractorRecServer.getLine(action));

      });

      vm.spec = protractorRecServer.getSpec($routeParams.id);
      /* Get line to export actions in spec.js */
      vm.spec.lines = [];

      if($filter('filter')(vm.spec.actions, {action: 'wait'}).length != 0)
        vm.spec.lines.push('    var EC = protractor.ExpectedConditions;');

      angular.forEach(vm.spec.actions, function (action) {

        if(action.breakpoint) {
          vm.spec.lines.push('browser.pause();');
        }

        vm.spec.lines.push(protractorRecServer.getLine(action));

      });

      vm.describes[0].specs[0] = vm.spec;

      var data = {baseUrl: vm.conf.baseUrl, conf: angular.toJson(vm.conf), describe: angular.toJson(vm.describes)};

      protractorRecServer.exportProtractor(data).success(function(response){
        $log.debug('Exported');
        $log.debug(response);

        $mdToast.show(
          $mdToast.simple()
            .content('File exported!')
            .position('bottom left')
            .hideDelay(3000)
        );
      });
    };

    vm.setExample();
    vm.getCapabilities();

  }
})();
