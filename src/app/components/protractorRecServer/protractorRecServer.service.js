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
  function protractorRecServer($http) {

    this.serverUrl = 'http://localhost:9000/';

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
  }
})();