(function () {
  'use strict';

  angular
    .module('protractorRec')
    .controller('NavbarController', NavbarController);

  /** @ngInject */
  function NavbarController($scope, $log, $location, $filter, $mdToast, $routeParams, $timeout, socket, protractorRecServer, seleniumJWP) {

    var vm = this;

    vm.protractorRecServer = protractorRecServer;

    /*-------------------------------------------------------------------
     *              ATTRIBUTES
     *-------------------------------------------------------------------*/

    vm.title = 'Conf.js';

    vm.showSelectedOptions = false;
    vm.index = false;

    vm.capabilities  = [];

    vm.conf      = protractorRecServer.getConf();
    vm.describes = protractorRecServer.getDescribes();
    vm.session   = protractorRecServer.getSession();

    vm.lines         = [];
    vm.describe      = {};
    vm.spec          = [];
    vm.dataBind      = [];

    vm.selectedItems = 0;

    $scope.$on('navbar:title', function(events, args){
      vm.title = args;
    });

    /*-------------------------------------------------------------------
     * 		 				  BROADCAST MESSAGES
     *-------------------------------------------------------------------*/
    $scope.$on('conf', function(events, args) {
      vm.conf = args;
    });

    $scope.$on('session', function(events, args) {
      vm.session = args;
    });

    /*-------------------------------------------------------------------
     * 		 				  SOCKET ON
     *-------------------------------------------------------------------*/
    socket.on('session-disconnect', function (data) {

      protractorRecServer.setSnippet(false);

      seleniumJWP.getSessionUrl().success(function(response){

        if(vm.session.url != response.value || !protractorRecServer.hasSnippet()) {

          protractorRecServer.setLoading(true);

          vm.getSessionSource();

        }

        vm.session.url = response.value;

      }).error(function(response){
        $log.debug(response);
        vm.deleteSession();
      });

      $log.debug('on-session-disconnect');
      $log.debug(data);

    });

    socket.on('protractor-log', function (data) {
      $log.debug('protractor-log');
      $log.debug(data);

      if(data === 'Started') {
        protractorRecServer.setLoading(false);
      }
    });

    vm.openConf = function() {
      vm.title = 'Conf.js';
      $location.url('/conf');
    };

    $scope.$watch('navbar.conf', function () {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    vm.verifySnippet = function(){

      var countIframe = vm.session.source.match(/recorder-iframe/);
      countIframe != null ? countIframe.length : countIframe = 0;

      if (!protractorRecServer.hasSnippet() && countIframe == 0) {
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
          }).error(function(response){
            $log.debug(response);
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
      }).error(function(response){
        $log.debug(response);
      });
    };

    vm.getSessionUrl = function () {
      seleniumJWP.getSessionUrl().success(function(response){
        $log.debug('getSessionUrl');
        vm.session.url = response.value;
      }).error(function(response){
        $log.debug(response);
      });
    };

    vm.runTest = function () {

      $log.debug('runTest');

      protractorRecServer.runProtractor().success(function(response){
        $log.debug(response);

        $timeout(function(){
          $mdToast.show(
            $mdToast.simple()
              .content(response)
              .position('bottom left')
              .hideDelay(3000)
          );
        }, 1500);

      }).error(function(response){

        protractorRecServer.setLoading(false);
        $log.debug(response);
      });
    };

    vm.createSession = function () {

      if(!vm.session.id) {
        protractorRecServer.setSnippet(false);
        protractorRecServer.setLoading(true);

        var sortedDrivers = vm.conf.capabilities.sort();
        var browserName = sortedDrivers[0];
        if(browserName === 'chromedriver')
          browserName = 'chrome';

        var options = {'desiredCapabilities': {'browserName': browserName, acceptSSlCerts: true}};

        seleniumJWP.newSession(options).success(function(response){
          $log.debug('Session Created');
          seleniumJWP.setSession(response);

          vm.session = response;
          vm.session.id = response.sessionId;

          protractorRecServer.setSession(vm.session);
          protractorRecServer.setRecording(true);
          protractorRecServer.setConf(vm.conf);

          vm.setSessionUrl();
        }).error(function(response){
          $log.debug(response);
        });
      } else {
        protractorRecServer.setRecording(true);
      }
    };

    vm.pauseRecording = function(){
      protractorRecServer.setRecording(false);
    };

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

        if (!protractorRecServer.hasSnippet()) {
          $mdToast.show(
            $mdToast.simple()
              .content('Session ready to record!')
              .position('bottom left')
              .hideDelay(3000)
          );
        }

        protractorRecServer.setLoading(false);
        protractorRecServer.setSnippet(true);

        vm.getSessionUrl();
      }).error(function(response){
        $log.debug(response);
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
      protractorRecServer.setSession();
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
          if(vm.conf.capabilities.indexOf(capability.driver) != -1){
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

      $log.debug('setExample');

      if(angular.equals(vm.conf, {})){
        protractorRecServer.setConf(protractorRecServer.confSample);
      }

      if (!vm.describes.length) {

        vm.describes.push(angular.copy(protractorRecServer.specSample));
        vm.conf = angular.copy(protractorRecServer.confSample);

        protractorRecServer.setDescribes(vm.describes);
        protractorRecServer.setDescribe(vm.describes[0]);
        protractorRecServer.setSpec(protractorRecServer.describe.specs[0]);

        vm.createSession();

      }
    };

    vm.exportProtractor = function (run) {

      $log.debug('exportProtractor');

      protractorRecServer.setLoading(true);

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
            .content(response)
            .position('bottom left')
            .hideDelay(3000)
        );

        if(run) {
          vm.runTest();
        } else {
          protractorRecServer.setLoading(false);
        }

      }).error(function(response){
        $log.debug(response);

        protractorRecServer.setLoading(false);

        $mdToast.show(
          $mdToast.simple()
            .content(response)
            .position('bottom left')
            .hideDelay(3000)
        );
      });
    };

    vm.setCapabilities = function(capability) {
      if(capability.checked)
        vm.conf.capabilities.push(capability.driver);
      else
        delete vm.conf.capabilities[vm.conf.capabilities.indexOf(capability.driver)];
      vm.conf.capabilities = vm.conf.capabilities.filter(Boolean);
      protractorRecServer.setConf(vm.conf);
    };

    vm.setExample();
    vm.getCapabilities();

  }
})();
