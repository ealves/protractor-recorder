(function () {
  'use strict';

  angular
      .module('protractorRec')
      .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $log, $filter, $timeout, $mdToast, $location, $mdDialog, $document, socket, protractorRecServer, seleniumJWP) {

    var vm = this;

    /*-------------------------------------------------------------------
     * 		 				 	ATTRIBUTES
     *-------------------------------------------------------------------*/

    vm.isLoadingSession    = false;
    vm.showConf            = $location.path() == '/conf' ? true : false;
    vm.isSnippet           = false;
    vm.showSelectedOptions = false;
    vm.index = false;

    /* If first run set examples or get from local storage */
    vm.url       = localStorage.getItem('url') ? localStorage.getItem('url') : 'http://www.protractortest.org';
    vm.describes = localStorage.getItem('describes') ? angular.fromJson(localStorage.getItem('describes')) : [];
    vm.conf      = localStorage.getItem('conf') ? angular.fromJson(localStorage.getItem('conf')) : false;
    vm.session   = localStorage.getItem('session') ? angular.fromJson(localStorage.getItem('session')) : {};

    if(vm.session.id) {
      seleniumJWP.setSession(vm.session);
    }

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
    vm.capabilities  = [];
    vm.selectedItems = 0;

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

    /* Spec example */
    vm.sample = {
      string: 'Describe Protractor Example',
      specs: [
        {
          string: 'Should navigate to protractortest.org',
          actions: [
            {
              type: 'a',
              value: 'Tutorial',
              action: 'click',
              locator: {
                type: 'linkText',
                value: 'Tutorial',
                strategy: 'link text'
              },
              locators: [
                {
                  type: 'linkText',
                  value: 'Tutorial',
                  strategy: 'link text'
                },
                {
                  type: 'get',
                  value: '#/tutorial'
                }
              ]
            },
            {
              type: 'h1',
              value: 'Tutorial',
              action: 'assertion',
              locator: {
                type: 'xpath',
                value: "//*[@id=\"tutorial\"]",
                strategy: 'xpath'
              },
              locators: [
                {
                  type: 'id',
                  value: 'tutorial',
                  strategy: 'id'
                }
              ]
            }
          ]
        }
      ]
    };

    /* Base options for new spec */
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

    /*-------------------------------------------------------------------
     * 		 				  SOCKET ON
     *-------------------------------------------------------------------*/
    /**
     * Messages: onsnippet, click, change, keyup, assertion, session-disconnect, protractor-log
     */

    socket.on('onsnippet', function(){
       vm.isSnippet = true;
    });

    socket.on('click', function (data) {
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('change', function (data) {
      $log.debug('onchange');
      $log.debug(data);

      vm.setElementOnChange(data);

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

      if(vm.conf.isRecording && data) {
        var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

        lastAction.action = 'assertion';
        lastAction.value = data.trim();

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

    vm.openConf = function() {
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

    vm.setElementOnChange = function (element) {

      if (vm.conf.isRecording) {

        var target = angular.element(element.outerHTML);

        if (target[0].tagName.match(/^select/i) && element.value) {

          vm.addElement(target, 'select', 'click', element.value, element.xPath);
        }
      }
    };

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

          value = target.text() ? target.text() : false;

          //if(value)
          vm.addElement(target, target[0].tagName.toLowerCase(), 'wait', value.trim(), element.xPath);

          vm.addElement(target, 'row', 'click', element.ngRepeat.rowIndex, element.xPath, element.ngRepeat.value);

          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value.trim(), element.xPath);

        } else if(!target[0].tagName.match(/^select/i)){
          value = target.text() ? target.text() : false;
          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value.trim(), element.xPath);
        }
      }
    };

    vm.addElement = function (element, type, actionType, value, xPath, repeater) {

      var locators = [];

      if(type == 'select' && vm.getAttr('ng-model', element))
        locators.push({type: 'model', value: vm.getAttr('ng-model', element)});

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

      if (type == 'input' && vm.getAttr('type', element) == 'submit')
        locators.push({type: 'css', value: '[value="' + element.val() + '"]'});

      if (vm.getAttr('href', element)) {
        locators.push({type: 'linkText', value: value, strategy: 'link text'});
        locators.push({type: 'get', value: vm.getAttr('href', element)});
      }

      if (vm.getAttr('id', element) && !element[0].tagName.match(/md/i))
        locators.push({type: 'id', value: vm.getAttr('id', element), strategy: 'id'});

      //if (vm.getAttr('class', element) || actionType == 'wait') {

        if (value)
          locators.push({type: 'xpath', value: '//' + type + '[.="' + value + '"]', strategy: 'xpath'});

        if (xPath && !vm.getAttr('ng-click', element) && !vm.getAttr('class', element))
          locators.push({type: 'xpath', value: xPath});

        if (vm.getAttr('ng-click', element))
          locators.push({type: 'css', value: '[ng-click="' + vm.getAttr('ng-click', element) + '"]', strategy: 'css selector'})

        if(vm.getAttr('class', element))
          locators.push({type: 'css', value: '.' + vm.getAttr('class', element).replace(/\s/g, '.'), strategy: 'css selector'});

        if (xPath)
          locators.push({type: 'xpath', value: xPath, strategy: 'xpath'});
      //}

      var action = {
        //element: element.html(),
        type: type,
        value: value,
        action: actionType,
        locators: locators,
        locator: locators ? {type: locators[0].type, value: locators[0].value} : null
      };

      vm.spec.actions.push(action);

      var mainContent = angular.element( $document[0].querySelector('#main') );
      mainContent[0].scrollTop = mainContent[0].scrollHeight;

      vm.getSessionUrl();

      //localStorage.setItem('actions', angular.toJson(vm.actions));

      //vm.getSessionUrl();

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

    vm.runTest = function () {

      $log.debug('runTest');

      protractorRecServer.runProtractor().success(function(response){
        $log.debug('Test finished');
        $log.debug(response);
      });
    };

    vm.removeSpec = function (index) {
      vm.describe.specs.splice(index, 1);
    };

    vm.exportProtractor = function () {

      $log.debug('exportProtractor');

      /* Get line to export actions in conf.js */
      vm.conf.spec.lines = [];

      angular.forEach(vm.conf.spec.actions, function (action) {

        if(action.breakpoint) {
          vm.conf.spec.lines('    browser.pause();');
        }

        vm.conf.spec.lines.push(vm.getLine(action));

      });

      /* Get line to export actions in spec.js */
      vm.spec.lines = [];

      if($filter('filter')(vm.spec.actions, {action: 'wait'}).length != 0)
        vm.spec.lines.push('    var EC = protractor.ExpectedConditions;');

      angular.forEach(vm.spec.actions, function (action) {

        if(action.breakpoint) {
          vm.spec.lines.push('    browser.pause();');
        }

        vm.spec.lines.push(vm.getLine(action));

      });

      var data = {baseUrl: vm.url, conf: angular.toJson(vm.conf), describe: angular.toJson(vm.describes)};

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

    vm.getLine = function(action) {

      var line = '';

      if(action.action == 'wait'){

        var elm = '';

        if(action.locator.type == 'xpath')
          elm = "element(by.xpath('" + action.locator.value + "'))";

        if(action.locator.type == 'css')
          elm = "element(by.css('" + action.locator.value + "');";

        line += "browser.wait(EC.presenceOf(" + elm + "), 10000);";

      }

      if(action.type == 'select' && action.action == 'click' && action.locator.type == 'model')
        line += "element(by.model('" + action.locator.value + "')).$('[value=\"" + action.value + "\"]').click();";

      if(action.action == 'click' && action.locator.type == 'repeater')
        line += "element(by.repeater('" + action.locator.value + "').row(" + action.value + ")).";

      if(action.action == 'sendKeys' && action.locator.type == 'model') {
        line += "element(by.model('" + action.locator.value + "')).sendKeys('" + action.value + "');";
      }

      if(action.action == 'sendKeys' && action.locator.type == 'css') {
        line += "element(by.css('" + action.locator.value + "')).sendKeys('" + action.value + "');";
      }

      if(action.action == 'click' && action.type == 'button' && action.value) {
        line += "element(by.buttonText('" + action.value + "')).click();";
      }

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText') {
        line += "element(by.linkText('" + action.value + "')).click();";
      }

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'get') {
        line += "browser.get('" + action.locator.value + "');";
      }

      if(action.action == 'click' && action.locator.type == 'xpath') {
        line += "element(by.xpath('" + action.locator.value + "')).click();";
      }

      if(action.action == 'click' && action.locator.type == 'id') {
        line += "element(by.id('" + action.locator.value + "')).click();";
      }

      if(action.action == 'click' && action.locator.type == 'css') {
        line += "element(by.css('" + action.locator.value + "')).click();";
      }

      if(action.action == 'assertion' && action.locator.type == 'bind')
        line += "expect(element(by.binding('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'id')
        line += "expect(element(by.id('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'xpath')
        line += "expect(element(by.xpath('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'assertion' && action.locator.type == 'css')
        line += "expect(element(by.css('" + action.locator.value + "')).getText()).toBe('" + action.value + "');";

      if(action.action == 'browser' && action.type == 'sleep')
        line += "browser.sleep(" + action.value + ");";

      return line;
    };

    vm.runFromHere = function(index) {

      vm.index = index;
      var element = vm.getElementAction(vm.spec.actions[index]);
      vm.getSessionElementId(element);

    };

    vm.setActionLocator = function(action){
      $log.debug(action);
    };

    vm.getAttr = function (attr, elem) {
      if (elem.attr(attr))
        return elem.attr(attr);
      return false;
    };

    vm.createSession = function () {

      if(!vm.session.id) {

        vm.isLoadingSession = true;
        var options = {'desiredCapabilities': {'browserName': 'chrome', acceptSSlCerts: true}};

        seleniumJWP.newSession(options).success(function(response){
          $log.debug('Session Created');
          seleniumJWP.setSession(response);
          vm.session.id = response.sessionId;
          vm.conf.isRecording = true;
          vm.setSessionUrl();

        });

      } else {
        vm.conf.isRecording = true;
      }
    };

    vm.setSessionUrl = function () {
      seleniumJWP.setSessionUrl(vm.url).success(function(){
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

    $scope.$watch('main.conf', function () {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    $scope.$watch('main.describe', function () {
      $log.debug('watch describe');
      localStorage.setItem('describes', angular.toJson(vm.describes));

      vm.selectedItems = $filter('filter')(vm.spec.actions, {checked: true}).length;

      if(vm.selectedItems){
        vm.showSelectedOptions = true
      } else {
        vm.showSelectedOptions = false;
      }

    }, true);

    $scope.$watchCollection('main.describes', function () {
      $log.debug('watch describes');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    });

    $scope.$watch('main.session', function () {
      $log.debug('watch session');
      localStorage.setItem('session', angular.toJson(vm.session));
    }, true);

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

    });

    vm.toggleAll = function(){

      angular.forEach(vm.spec.actions, function(action){

        action.checked = !vm.selectAll;

      });

      if(vm.selectAll)
        vm.showSelectedOptions = false;

    };

    vm.toggleAction = function(action){
      if(!action.checked){
        //vm.showSelectedOptions = true;
      }
    };

    vm.removeActions = function(index){

      if(index != undefined){
        vm.spec.actions.splice(index, 1);
      } else {
        var i = vm.spec.actions.length;
        while (i--) {
          var action = vm.spec.actions[i];
          if (action.checked)
            vm.spec.actions.splice(i, 1);
        }
      }
    };

    vm.duplicateActions = function(index){

      if(index != undefined){
        var newAction = angular.copy(vm.spec.actions[index]);
        vm.spec.actions.push(newAction);
      }
    };

    vm.toggleBreakPoint = function(index) {
      if(vm.spec.actions[index].breakpoint == undefined)
        vm.spec.actions[index].breakpoint = true;
      else
        vm.spec.actions[index].breakpoint = !vm.spec.actions[index].breakpoint;
    };

    vm.addBrowserSleep = function(index) {
      var action = {
        action: 'browser',
        type: 'sleep',
        value: 1000
      };
      vm.spec.actions.splice(index, 0, action);
    };

    vm.sessionExecute = function () {

      seleniumJWP.sessionExecute(vm.snippet).success(function(){
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
        vm.isLoadingSession = false;
        vm.conf.isRecording = false;
      }
    };

    /**
     * Get all html from ng-includes and concatenate with main source
     */
    vm.getNgIncludes = function () {

      $log.debug('getNgIncludes');

      var ngIncludes = vm.session.source.match(/ngInclude:\s?["|'](.*?)["|']/igm);

      $log.debug(ngIncludes);

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

    vm.verifySnippet = function(){

      var countIframe = vm.session.source.match(/recorder-iframe/);
      countIframe != null ? countIframe.length : countIframe = 0;

      if (!vm.isSnippet && countIframe == 0) {
        vm.sessionExecute();
      } else {
        vm.isLoadingSession = false;
      }
    };

    vm.deleteSession = function(){

      seleniumJWP.deleteSession().success(function() {
        $log.debug('Session Deleted');

        vm.session = {};
        seleniumJWP.setSession();

        vm.isLoadingSession = false;
        vm.conf.isRecording = false;
      }).error(function(response){
        vm.session = {};
        seleniumJWP.setSession();

        vm.isLoadingSession = false;
        vm.conf.isRecording = false;
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

    vm.pauseRecording = function(){
      vm.conf.isRecording = false;
    };

    var DialogSpecController = function ($scope, $mdDialog, spec, describe) {

      var vm = this;

      vm.spec = spec;
      vm.describe = describe;

      vm.hide = function() {
        $mdDialog.hide();
      };

      vm.cancel = function() {
        $mdDialog.cancel();
      };

      vm.saveSpec = function() {
        $mdDialog.hide(vm);
      };
    };

    vm.specDialog = function(ev) {

      var spec     = angular.copy(vm.spec);
      var describe = angular.copy(vm.describe);

      var closeTo = angular.element($document[0].getElementById('edit-spec'));

      $mdDialog.show({
        controller: DialogSpecController,
        controllerAs: 'spec',
        templateUrl: 'app/main/spec-dialog.html',
        parent: angular.element($document[0].body),
        targetEvent: ev,
        closeTo: closeTo,
        locals: {
          spec: spec,
          describe: describe
        },
        clickOutsideToClose: true
      }).then(function(result) {
        if(result) {

          $filter('filter')(vm.describes[0].specs, {$$hashKey: vm.spec.$$hashKey})[0].string = result.spec.string;

          vm.spec = result.spec;
          vm.describes[0].string = result.describe.string;

          //localStorage.setItem('describes', angular.toJson(vm.describes));
        }
          //angular.copy(vm.spec, spec);
      }, function() {
      });
    };

    vm.getSessionElementId = function(element) {

      $log.debug('getSessionElementId');
      seleniumJWP.findSessionElement(element).success(function(response) {
        vm.sessionElementExecute(response.value.ELEMENT, element);
      });

    };

    vm.getElementAction = function(action){

      var element     = {};
      var using       = false;
      var value       = false;
      var actionType  = false;

      if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText') {
        using      = 'link text';
        value      = action.value;
        actionType = 'click';
      }

      if(action.action == 'sendKeys') {

        angular.forEach(action.locators, function(locator){

          if(locator.type != 'model') {

            using = locator.type;

            if(locator.type == 'css')
              using = 'css selector';

            value = locator.value;
            actionType = 'value';

            return true;

          }

        });

        //line = "element(by.model('" + action.locator.value + "')).sendKeys('" + action.value + "');";
      }

      if(action.action == 'click' && action.type == 'button' && action.value) {

        angular.forEach(action.locators, function(locator){

          if(locator.type == 'css') {
            using = 'css selector';
            value = locator.value;
            actionType = 'click';
          }

        });
      }


      if(using && value && actionType) {
        element.using  = using;
        element.value  = value;
        element.action = actionType;
        element.keys   = action.value;

        return element;
      }

      return false;

    };

    vm.sessionElementExecute = function(elementId, element){

      var data = {};

      if(element.action == 'value'){
        data.value = [element.keys];
      }

      seleniumJWP.sessionElementExecute(elementId, element, data).success(function(response) {

        $log.debug(response);
        if(vm.spec.actions[vm.index + 1]) {
          vm.runFromHere(vm.index + 1);
        }

      });

    };

    vm.getCapabilities();
    vm.setExample();
    vm.getSessionSource();

  }

})();
