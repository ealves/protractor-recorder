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
  function config($logProvider, $mdIconProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

    $mdIconProvider
        .icon('account-circle', 'assets/svg/ic_account_circle_24px.svg'        , 24)
        .icon('archive', 'assets/svg/ic_archive_24px.svg'        , 24)
        .icon('add', 'assets/svg/ic_add_24px.svg', 24)
        .icon('arrow_back', 'assets/svg/ic_arrow_back_24px.svg', 24)
        .icon('arrow_forward', 'assets/svg/ic_arrow_forward_24px.svg', 24)
        .icon('chevron_right', 'assets/svg/ic_chevron_right_24px.svg' , 24)
        .icon('chevron_left', 'assets/svg/ic_chevron_left_24px.svg' , 24)
        .icon('chevron_left', 'assets/svg/ic_chevron_left_24px.svg' , 24)
        .icon('close', 'assets/svg/ic_close_24px.svg', 24)
        .icon('assignment', 'assets/svg/ic_assignment_24px.svg', 24)
        .icon('check', 'assets/svg/ic_check_24px.svg'        , 24)
        .icon('delete', 'assets/svg/ic_delete_24px.svg', 24)
        .icon('edit', 'assets/svg/ic_edit_24px.svg', 24)
        .icon('email', 'assets/svg/ic_email_24px.svg'        , 24)
        .icon('list', 'assets/svg/ic_list_24px.svg'        , 24)
        .icon('home', 'assets/svg/ic_home_24px.svg', 24)
        .icon('more_horiz', 'assets/svg/ic_more_horiz_24px.svg'        , 24)
        .icon('more_vert', 'assets/svg/ic_more_vert_24px.svg'        , 24)
        .icon('menu', 'assets/svg/ic_menu_24px.svg'        , 24)
        .icon('music_note', 'assets/svg/ic_music_note_24px.svg', 24)
        .icon('pause', 'assets/svg/ic_pause_24px.svg', 24)
        .icon('picture_as_pdf', 'assets/svg/ic_picture_as_pdf_24px.svg', 24)
        .icon('person', 'assets/svg/ic_person_24px.svg', 24)
        .icon('play_circle', 'assets/svg/ic_play_circle_outline_24px.svg', 24)
        .icon('settings', 'assets/svg/ic_settings_24px.svg', 24)
        .icon('stop', 'assets/svg/ic_stop_24px.svg', 24)
        .icon('save', 'assets/svg/ic_save_24px.svg', 24);


  }

})();
