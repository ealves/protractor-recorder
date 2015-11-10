(function () {
  'use strict';

  angular
      .module('protractorRec')
      .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $log, $filter, $timeout, $mdToast, socket) {

    var vm = this;

    vm.url = localStorage.getItem('url') ? localStorage.getItem('url') : 'http://google.com';

    vm.session = {};

    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];

    //vm.actions = [];
    vm.lines = [];

    vm.describe = {};
    vm.spec = [];

    vm.dataBind = [];

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
          actions: [
            {"type": "link", "value": "http://google.com", "action": "get"}
          ]
        }
      ]
    };

    vm.blankSpec = {
      string: '',
      actions: []
    };

    vm.hidden = false;
    vm.isOpen = false;
    vm.hover = false;
    // On opening, add a delayed property which shows tooltips after the speed dial has opened
    // so that they have the proper position; if closing, immediately hide the tooltips
    $scope.$watch('main.isOpen', function (isOpen) {
      if (isOpen) {
        $timeout(function () {
          vm.tooltipVisible = vm.isOpen;
        }, 600);
      } else {
        vm.tooltipVisible = vm.isOpen;
      }
    });

    socket.on('click', function (data) {
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('keyup', function (data) {
      $log.debug('onkeyup');
      $log.debug(data);

      var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

      lastAction.action = 'sendKeys';
      lastAction.value = data;

    });

    socket.on('assertion', function (data) {
      $log.debug('onassertion');
      $log.debug(data);

      var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

      lastAction.action = 'assertion';
      lastAction.value = data;

      vm.dataBind.forEach(function (data) {

        lastAction.locators.push(data);

      });

    });

    socket.on('session-disconnect', function (data) {
      $log.debug('on-session-disconnect');
      $log.debug(data);
      vm.getSessionSource();

    });

    vm.setExample = function () {

      if (!vm.describes.length) {

        vm.describes.push(angular.copy(vm.sample));

        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);

        vm.createSession();
      } else {
        vm.setDescribe(vm.describes[0]);
        vm.setSpec(vm.describe.specs[0]);
      }

    };

    vm.newDescribe = function () {
      $log.debug('newDescribe');

    };

    vm.addSpec = function () {
      $log.debug('addSpec');

      vm.describe.specs.push(angular.copy(vm.blankSpec));
      vm.setSpec(vm.describe.specs[vm.describe.specs.length - 1]);

    };

    vm.setDescribe = function (describe) {
      vm.describe = describe;
    };

    vm.setSpec = function (spec) {
      vm.spec = spec;
    };

    vm.snippet = 'var head=document.getElementsByTagName("head")[0],script=document.createElement("script");script.onload=function(){var e=document.createElement("script");e.src="http://localhost:9000/snippet.js",head.appendChild(e)},script.src="http://localhost:9000/socket.io-1.3.7.js",head.appendChild(script);';

    vm.setElement = function (element) {

      var target = angular.element(element.outerHTML);
      var parent = !element.offsetParent.outerHTML ? [] : angular.element(element.offsetParent.outerHTML);

      if (target[0].tagName.match(/^button/i) || parent[0].tagName.match(/^button/i) && !target[0].tagName.match(/^input/i)) {

        vm.addElement(parent, 'button', 'click', target.text().trim(), element.xPath);

      } else if (target[0].tagName.match(/^input/i)) {
        vm.addElement(target, 'input', 'click', false, element.xPath);
      } else if (target[0].tagName.match(/^a/i)) {
        vm.addElement(target, 'a', 'click', false, element.xPath);
      } else {

        var value = target.text() ? target.text() : false;

        vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value, element.xPath);
      }
    };

    vm.addElement = function (element, type, actionType, value, xPath) {

      var locators = [];

      if (type == 'button' && value)
        locators.push({type: 'buttonText', value: value});

      if (type == 'input' && vm.getAttr('ng-model', element))
        locators.push({type: 'model', value: vm.getAttr('ng-model', element)});

      if (type == 'input' && vm.getAttr('type', element) == 'button') {
        locators.push({type: 'id', value: vm.getAttr('id', element)});
      }

      if (type == 'input' && vm.getAttr('type', element) == 'submit') {
        locators.push({type: 'css', value: '[value="' + element.val() + '"]'});
      }

      if (vm.getAttr('href', element)) {
        locators.push({type: 'href', value: vm.getAttr('href', element)});
        value = vm.getAttr('href', element);
      }

      if (vm.getAttr('id', element))
        locators.push({type: 'id', value: '#' + vm.getAttr('id', element)});

      if (vm.getAttr('class', element)) {

        if (value)
          locators.push({type: 'xpath', value: '//' + type + '[.="' + value + '"]'});
        else if (xPath && !vm.getAttr('ng-click', element))
          locators.push({type: 'xpath', value: xPath});
        else if (vm.getAttr('ng-click', element)) {
          //element(by.css("[ng-click='changeToRemove(row.entity)']")).click();
          locators.push({type: 'css', value: '[ng-click="' + vm.getAttr('ng-click', element) + '"]'})
        }

      }

      var action = {
        //element: element.html(),
        type: type,
        value: value,
        action: actionType,
        locators: locators,
        locator: locators ? {type: locators[0].type, value: locators[0].value} : null
      };

      vm.spec.actions.push(action);

      var mainContent = angular.element( document.querySelector('#main') );
      mainContent[0].scrollTop = mainContent[0].scrollHeight;
      //localStorage.setItem('actions', angular.toJson(vm.actions));

      //vm.getSessionUrl();

    };

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

    vm.runTest = function () {

      $log.debug('runTest');

      $http({
        method: 'GET',
        url: 'http://localhost:9000/run'
      }).then(function successCallback(response) {

        $log.debug('Test finished');
        $log.debug(response);

      });
    };

    vm.removeSpec = function (index) {
      vm.describe.specs.splice(index, 1);
    };

    vm.exportProtractor = function () {

      $log.debug('exportProtractor');

      $http({
        method: 'POST',
        url: 'http://localhost:9000/export',
        data: {describe: angular.toJson(vm.describe)}
      }).then(function successCallback(response) {

        $log.debug('Exported');
        $log.debug(response);

        $mdToast.show(
            $mdToast.simple()
                .content('File exported!')
                .position('bottom left')
                .hideDelay(3000)
        );

      });

      $log.debug('Export Protractor');
      var lines = [];

      angular.forEach(vm.spec.actions, function (action) {

        if (action.action == 'sendKeys') {
          lines.push("element(by.model('" + action.locators[0].value + "')).sendKeys('" + action.value + "')");
        }

        if (action.action == 'click' && action.type == 'button' && action.value) {
          lines.push("element(by.buttonText('" + action.value + "')).click()");
        }

        if (action.action == 'click' && action.type == 'a') {
          lines.push("browser.get('" + action.value + "')");
        }

        if (action.action == 'click' && action.locators[0].type == 'xpath') {
          lines.push("element(by.xpath('" + action.locators[0].value + "')).click()");
        }

        if (action.action == 'click' && action.locators[0].type == 'id') {
          lines.push("element(by.id('" + action.locators[0].value + "')).click()");
        }

        if (action.action == 'click' && action.type == 'input' && action.locators[0].type == 'css') {
          lines.push("element(by.css('" + action.locators[0].value + "')).click()");
        }

      });

      vm.lines = lines;

      $log.debug(lines);

    };

    vm.removeAction = function (index) {
      vm.spec.actions.splice(index, 1);

      //localStorage.setItem('actions', angular.toJson(vm.actions));

    };

    vm.getAttr = function (attr, elem) {
      if (elem.attr(attr))
        return elem.attr(attr);
      return false;
    };

    vm.createSession = function () {
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

    vm.getSession = function () {

      $http({
        method: 'GET',
        url: 'http://localhost:4444/wd/hub/sessions'
      }).then(function successCallback(response) {

        $log.debug('Get Session');

        if (response.data.value.length) {
          vm.session = response.data.value[0];

          vm.getSessionSource();
        }

      });

    };

    vm.setSessionUrl = function () {

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

    vm.getSessionUrl = function () {

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

    $scope.$watch('main.url', function () {
      $log.debug('watch Url');

      localStorage.setItem('url', vm.url);

      /*if(newValue != oldValue)
       vm.setSessionUrl();*/
    });

    vm.sessionExecute = function () {

      $http({
        method: 'POST',
        url: 'http://localhost:4444/wd/hub/session/' + vm.session.id + '/execute',
        data: {'script': vm.snippet, 'args': [{'f': ''}]}
      }).then(function successCallback() {

        $log.debug('Session Executed');

        $mdToast.show(
            $mdToast.simple()
                .content('Session started!')
                .position('bottom left')
                .hideDelay(3000)
        );

      });

    };

    vm.getSessionSource = function () {

      if (vm.session.id) {
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

    vm.getNgIncludes = function () {

      $log.debug('getNgIncludes');

      var ngIncludes = vm.session.source.match(/ngInclude:\s?["|'](.*?)["|']/igm);

      $log.debug(ngIncludes);

      var includes = [];

      angular.forEach(ngIncludes, function (include) {

        include = include.replace(/:\s|\"|\'|ngInclude|{{|}}/g, '').trim();

        if (!$filter('filter')(includes, include).length) {

          $http({
            method: 'POST',
            url: 'http://localhost:9000/html',
            data: {url: vm.url, include: include}
          }).then(function successCallback(response) {

            vm.session.source += response.data;
            vm.getAllDataBind();

          });

        }

        includes.push(include);

      });


    };

    vm.verifySnippet = function () {

      if (vm.session.source && !vm.session.source.match(/snippet\.js/)) {
        vm.sessionExecute();
      }

    };

    vm.deleteSession = function () {

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
