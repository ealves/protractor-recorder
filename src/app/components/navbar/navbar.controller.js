(function () {
  'use strict';

  angular
  .module('protractorRec')
  .controller('NavbarController', NavbarController);

  /** @ngInject */
  function NavbarController($scope, $log, $location, protractorRecServer) {

    var vm = this;

    vm.capabilities  = [];

    vm.conf = localStorage.getItem('conf') ? angular.fromJson(localStorage.getItem('conf')) : false;
    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];

    /* Configuration example */
    if(!vm.conf) {
      vm.conf = {
        isRecording: false,
        string: 'Conf.js',
        seleniumAddress: 'http://localhost:4444/wd/hub',
        capabilities: ['chromedriver'],
        spec: {
          actions: [
          {type: 'link', value: vm.url, action: 'get'}
          ]
        }

      };
    }

    $scope.$watch('navbar.conf', function () {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    vm.setSpec = function (spec, conf) {
      $log.debug('setSpec');
      if(vm.showConf && conf == undefined || conf == true) {
        vm.showConf = true;
        vm.spec = vm.conf.spec;
        $location.path('/conf');
      } else {
        vm.spec = spec;
        vm.showConf = false;
        $location.path('/');
      }

      angular.forEach(vm.spec.actions, function(action) {
        action.checked = false;
      });
    };
    
    vm.openConf = function() {

      $location.url('/conf');

      /*vm.showConf = true;
      vm.setSpec(vm.conf.spec, vm.showConf);*/
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

    vm.getCapabilities();
  }
})();