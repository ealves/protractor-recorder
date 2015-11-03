(function() {
  'use strict';

  angular
    .module('protractorRec')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
