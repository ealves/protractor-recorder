/**
 * Created by ealves on 12/12/15.
 *
 * WebDriver Manager Service
 */
(function() {
  'use strict';

  angular
      .module('protractorRec')
      .service('webDriverManager', webDriverManager);

  /** @ngInject */
  function webDriverManager($http) {

    this.getCapabilities = function(){

      return $http({
        method: 'GET',
        url: 'http://localhost:9000/webdriver-manager/status'
      });

    };
  }
})();