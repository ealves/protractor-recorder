(function() {
  'use strict';

  angular
    .module('protractorRec')
    .config(config).factory('socket', function ($rootScope) {
        var socket = io('http://localhost:9000');
        return {
          on: function (eventName, callback) {
            socket.on(eventName, function () {
              var args = arguments;
              $rootScope.$apply(function () {
                callback.apply(socket, args);
              });
            });
          },
          emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
              var args = arguments;
              $rootScope.$apply(function () {
                if (callback) {
                  callback.apply(socket, args);
                }
              });
            })
          }
        };
      });

  /** @ngInject */
  function config($logProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

  }

})();
