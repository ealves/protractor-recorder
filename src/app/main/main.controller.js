(function () {
  'use strict';

  angular
      .module('protractorRec')
      .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $log, $filter, $timeout, $mdToast, socket) {

    var vm = this;

    vm.isLoadingSession = false;
    vm.showConf = false;
    vm.isSnippet = false;

    vm.url       = localStorage.getItem('url') ? localStorage.getItem('url') : 'http://www.protractortest.org';
    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];
    vm.conf      = localStorage.getItem('conf') ? angular.fromJson(localStorage.getItem('conf')) : false;

    vm.session      = {};
    vm.lines        = [];
    vm.describe     = {};
    vm.spec         = [];
    vm.dataBind     = [];
    vm.capabilities = [];

    if(!vm.conf) {
      vm.conf = {
        isRecording: false,
        string: 'Conf.js',
        seleniumAddress: 'http://localhost:4444/wd/hub',
        capabilities: ['chromedriver'],
        spec: {
          actions: [
            {"type": "link", "value": vm.url, "action": "get"}
          ]
        }

      };
    }

    vm.sample = {
      string: 'Describe Protractor Example',
      specs: [
        {
          string: 'Should navigate to protractortest.org',
          actions: [
            {"type": "link", "value": "http://www.protractortest.org", "action": "get"}
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

    socket.on('onsnippet', function(data){
      vm.isSnippet = true;
    });

    socket.on('click', function (data) {
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('keyup', function (data) {
      $log.debug('onkeyup');
      $log.debug(data);

      if(vm.conf.isRecording) {
        var lastAction = vm.spec.actions[vm.spec.actions.length - 1];
        lastAction.action = 'sendKeys';
        lastAction.value = data;
      }

    });

    socket.on('assertion', function (data) {
      $log.debug('onassertion');
      $log.debug(data);

      if(vm.conf.isRecording) {
        var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

        lastAction.action = 'assertion';
        lastAction.value = data;

        vm.dataBind.forEach(function (data) {

          lastAction.locators.push(data);

        });
      }

    });

    socket.on('session-disconnect', function (data) {

      vm.isSnippet = false;
      vm.isLoadingSession = true;

      $log.debug('on-session-disconnect');
      $log.debug(data);

      vm.getSessionSource();

    });

    socket.on('protractor-log', function (data) {
      $log.debug('protractor-log');
      $log.debug(data);
    });

    vm.setCapabilities = function(capability) {
      if(capability.checked){
        vm.conf.capabilities.push(capability.driver);
      } else {
        var index = vm.conf.capabilities.indexOf(capability.driver);
        vm.conf.capabilities.splice(index, 1);
      }
    };

    vm.openConf = function(){
      vm.showConf = true;

      vm.setSpec(vm.conf.spec, vm.showConf);

    };
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

    vm.setSpec = function (spec, conf) {

      $log.debug(conf);
      vm.showConf = conf;
      vm.spec = spec;
    };

    vm.snippet = 'var b=document.getElementsByTagName("body")[0];' +
        'var i = document.createElement("iframe");' +
        'i.id="recorder-iframe";' +
        'i.setAttribute("style", "display:none");' +
        'b.appendChild(i);' +
        'var i = document.getElementById("recorder-iframe");' +
        'var s = i.contentWindow.document.createElement("script");' +
        's.src = "http://localhost:9000/socket.io-1.3.7.js";' +
        'i.contentWindow.document.body.appendChild(s);' +
        'var s = i.contentWindow.document.createElement("script");' +
        's.src = "http://localhost:9000/snippet.js";' +
        'i.contentWindow.document.body.appendChild(s);';

    vm.setElement = function (element) {

      if(vm.conf.isRecording) {
        var target = angular.element(element.outerHTML);
        var parent = !element.offsetParent.outerHTML ? [] : angular.element(element.offsetParent.outerHTML);

        var value = '';

        if (target[0].tagName.match(/^button/i) || (parent[0].tagName && parent[0].tagName.match(/^button/i)) && !target[0].tagName.match(/^input/i)) {

          vm.addElement(parent, 'button', 'click', target.text().trim(), element.xPath);

        } else if (target[0].tagName.match(/^input/i)) {
          vm.addElement(target, 'input', 'click', false, element.xPath);
        } else if (target[0].tagName.match(/^a/i)) {
          vm.addElement(target, 'a', 'click', target.text().trim(), element.xPath);
        } else if (element.ngRepeat) {

          value = target.text() ? target.text() : false

          //if(value)
          vm.addElement(target, target[0].tagName.toLowerCase(), 'wait', value, element.xPath);

          vm.addElement(target, 'row', 'click', element.ngRepeat.rowIndex, element.xPath, element.ngRepeat.value);

          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value, element.xPath);

        } else {
          value = target.text() ? target.text() : false;
          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value, element.xPath);
        }
      }
    };

    vm.addElement = function (element, type, actionType, value, xPath, repeater) {

      var locators = [];

      if(type == 'row')
        locators.push({type: 'repeater', value: repeater});

      if (type == 'button' && value)
        locators.push({type: 'buttonText', value: value});

      if (type == 'input' && vm.getAttr('ng-model', element))
        locators.push({type: 'model', value: vm.getAttr('ng-model', element)});

      if (type == 'input' && vm.getAttr('name', element))
        locators.push({type: 'css', value: '[name="' + vm.getAttr('name', element) + '"]'});

      /*if (type == 'input' && vm.getAttr('type', element) == 'button') {
        locators.push({type: 'id', value: vm.getAttr('id', element)});
      }*/

      if (type == 'input' && vm.getAttr('type', element) == 'submit') {
        locators.push({type: 'css', value: '[value="' + element.val() + '"]'});
      }

      if (vm.getAttr('href', element)) {
        locators.push({type: 'linkText', value: value});
        locators.push({type: 'get', value: vm.getAttr('href', element)});
      }

      if (vm.getAttr('id', element))
        locators.push({type: 'id', value: vm.getAttr('id', element)});

      if (vm.getAttr('class', element) || actionType == 'wait') {

        if (value)
          locators.push({type: 'xpath', value: '//' + type + '[.="' + value + '"]'});
        else if (xPath && !vm.getAttr('ng-click', element) && !vm.getAttr('class', element))
          locators.push({type: 'xpath', value: xPath});
        else if (vm.getAttr('ng-click', element)) {
          //element(by.css("[ng-click='changeToRemove(row.entity)']")).click();
          locators.push({type: 'css', value: '[ng-click="' + vm.getAttr('ng-click', element) + '"]'})
        } else if(vm.getAttr('class', element)) {
          locators.push({type: 'css', value: '.' + vm.getAttr('class', element)});
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

      vm.getSessionUrl();

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
      $log.debug(vm.describes);
      $http({
        method: 'POST',
        url: 'http://localhost:9000/export',
        data: {baseUrl: vm.url, conf: angular.toJson(vm.conf), describe: angular.toJson(vm.describes)}
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

      if(!vm.session.id) {

        vm.isLoadingSession = true;

        $http({
          method: 'POST',
          url: 'http://localhost:4444/wd/hub/session',
          data: {'desiredCapabilities': {'browserName': 'chrome'}}
        }).then(function successCallback(response) {

          $log.debug('Session Created');

          vm.session.id = response.data.sessionId;

          vm.conf.isRecording = true;

          vm.setSessionUrl();

        });
      } else {
        vm.conf.isRecording = true;
      }
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

    $scope.$watch('main.conf', function () {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    $scope.$watch('main.describe', function () {
      $log.debug('watch describe');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    }, true);

    $scope.$watchCollection('main.describes', function () {
      $log.debug('watch describes');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    });

    $scope.$watch('main.url', function (newVal) {
      $log.debug('watch Url');

      if(newVal.match(/^https/)){

        $mdToast.show(
            $mdToast.simple()
                .content('Do not use https on Base Url!')
                .position('bottom left')
                .hideDelay(3000)
        );

        vm.url = '';

      } else {

        localStorage.setItem('url', vm.url);
      }

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

        vm.isLoadingSession = false;
        vm.isSnippet = true;

        vm.getSessionUrl();

        $mdToast.show(
            $mdToast.simple()
                .content('Session ready to record!')
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

          if(response.data.value) {
            vm.getNgIncludes();
            vm.verifySnippet();
          }

        }, function errorCallback(response) {
          $log.debug(response);
          $log.debug('Error session source');
          vm.deleteSession();

        });
      } else {
        vm.isLoadingSession = false;
        vm.conf.isRecording = false;
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

    vm.verifySnippet = function(){

      if (!vm.isSnippet && !vm.session.source.match(/recorder-iframe/)) {
        vm.sessionExecute();
      } else {
        vm.isLoadingSession = false;
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

        vm.isLoadingSession = false;
        vm.conf.isRecording = false;

      });

    };

    vm.getCapabilities = function(){

      $log.debug('getCapabilities');

      $http({
        method: 'GET',
        url: 'http://localhost:9000/webdriver-manager/status'
      }).then(function successCallback(response) {

        $log.debug(response);
        vm.capabilities = response.data;

        vm.capabilities.forEach(function(capability){

          if(!vm.conf.capabilities.indexOf(capability.driver)){
            capability.checked = true;
          }

        });

      });

    };

    vm.pauseRecording = function(){
      vm.conf.isRecording = false;
    };

    vm.getCapabilities();
    vm.setExample();
    vm.getSession();

  }

})();
