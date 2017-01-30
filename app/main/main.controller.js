(function() {
  'use strict';

  angular
    .module('protractorRecorder')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($rootScope, $scope, $routeParams, $log, $filter, $timeout, $mdToast, $mdDialog, $document, socket, protractorRecServer, seleniumJWP) {

    var vm = this;

    vm.protractorRecServer = protractorRecServer;

    /*-------------------------------------------------------------------
     * 		 				 	ATTRIBUTES
     *-------------------------------------------------------------------*/

    /* Base options for new spec */
    vm.blankSpec = {
      string: '',
      actions: []
    };

    vm.conf = protractorRecServer.getConf();
    vm.describes = protractorRecServer.getDescribes();
    vm.session = protractorRecServer.getSession();

    vm.spec = angular.copy(vm.blankSpec);

    vm.showSelectedOptions = false;
    vm.index = false;

    if (vm.session.id) {
      seleniumJWP.setSession(vm.session);
    }

    vm.lines = [];
    vm.describe = protractorRecServer.getDescribe(1);
    vm.dataBind = [];

    vm.selectedItems = 0;


    init();


    vm.hidden = false;
    vm.isOpen = false;
    vm.hover = false;

    vm.joinRoom = joinRoom;
    vm.setCapabilities = setCapabilities;
    vm.newDescribe = newDescribe;
    vm.setSpec = setSpec;
    vm.addSpec = addSpec;
    vm.setDescribe = setDescribe;
    vm.setElementOnChange = setElementOnChange;
    vm.setElement = setElement;
    vm.addElement = addElement;
    vm.addModifierKey = addModifierKey;
    vm.getAllDataBind = getAllDataBind;
    vm.removeSpec = removeSpec;
    vm.runFromHere = runFromHere;
    vm.setActionLocator = setActionLocator;
    vm.getAttr = getAttr;
    vm.createSession = createSession;
    vm.setSessionUrl = setSessionUrl;
    vm.getSessionUrl = getSessionUrl;
    vm.toggleAll = toggleAll;
    vm.toggleAction = toggleAction;
    vm.removeActions = removeActions;
    vm.duplicateActions = duplicateActions;
    vm.toggleBreakPoint = toggleBreakPoint;
    vm.addBrowserSleep = addBrowserSleep;
    vm.sessionExecute = sessionExecute;
    vm.clearSession = clearSession;
    vm.deleteSession = deleteSession;
    vm.getNgIncludes = getNgIncludes;
    vm.verifySnippet = verifySnippet;
    vm.getSessionSource = getSessionSource;
    vm.specDialog = specDialog;
    vm.getSessionElementId = getSessionElementId;
    vm.getElementAction = getElementAction;
    vm.socketElementExecute = socketElementExecute;
    vm.sessionElementExecute = sessionElementExecute;
    vm.clearRunTestResult = clearRunTestResult;
    vm.actionDialog = actionDialog;

    function init() {
      setSpec((function() {
        if ($routeParams.id) {
          $rootScope.$broadcast('navbar:title', 'Spec ' + $routeParams.id);

          return protractorRecServer.getSpec($routeParams.id);
        } else {
          return protractorRecServer.getSpec();
        }
      })());
    }

    // On opening, add a delayed property which shows tooltips after the speed dial has opened
    // so that they have the proper position; if closing, immediately hide the tooltips
    $scope.$watch('main.isOpen', function(isOpen) {
      if (isOpen) {
        $timeout(function() {
          vm.tooltipVisible = vm.isOpen;
        }, 600);
      } else {
        vm.tooltipVisible = vm.isOpen;
      }
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
    /**
     * Messages: onsnippet, click, change, keyup, assertion, session-disconnect, protractor-log
     */

    socket.on('onsnippet', function() {
      protractorRecServer.setSnippet(true);
    });

    socket.on('click', function(data) {
      $log.debug('onclick');
      $log.debug(data);

      vm.setElement(data);

    });

    socket.on('change', function(data) {
      $log.debug('onchange');
      $log.debug(data);

      vm.setElementOnChange(data);

    });

    socket.on('keyup', function(data) {
      $log.debug('onkeyup');
      $log.debug(data);

      var keyCodeArray = [9, 13, 16, 17, 18, 27]
      var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

      if (protractorRecServer.isRecording()) {

        var target = angular.element(data.element.outerHTML);

        if (keyCodeArray.indexOf(data.keyCode) != -1) {

          if (target[0].tagName === 'INPUT') {

            if (data.keyCode === 9) {
              vm.setElement(data.element);
              var lastAction = vm.spec.actions[vm.spec.actions.length - 1];
              lastAction.action = 'sendKeys';
            } else if (data.keyCode === 16 && angular.isDefined(lastAction)) {

              if (lastAction.type === 'input') {
                lastAction.action = 'sendKeys';
                lastAction.value = data.value;
              }

            } else {
              vm.addModifierKey(data.keyCode);
            }

          } else {
            vm.addModifierKey(data.keyCode);
          }

        } else if (angular.isDefined(lastAction)) {

          if (lastAction.type === 'input') {
            lastAction.action = 'sendKeys';
            lastAction.value = data.value;
          }
        }
      }

    });

    socket.on('assertion', function(data) {
      $log.debug('onassertion');
      $log.debug(data);

      if (protractorRecServer.isRecording() && data) {
        var lastAction = vm.spec.actions[vm.spec.actions.length - 1];

        lastAction.action = 'assertion';
        lastAction.value = data.trim();

        vm.dataBind.forEach(function(data) {
          lastAction.locators.push(data);
        });
      }

    });

    socket.on('mousemove', function(data) {
      $log.debug('mousemove');
      $log.debug(data);

      var lastAction = vm.spec.actions[vm.spec.actions.length - 1];
      if (protractorRecServer.isRecording() && data && lastAction.action != 'assertion' && lastAction.type != 'select') {

        vm.setElement(data);
        lastAction.type = 'mouseUp';
      }
    });

    $scope.$watch('main.conf', function() {
      $log.debug('watch conf');
      localStorage.setItem('conf', angular.toJson(vm.conf));
    }, true);

    $scope.$watch('main.describe', function() {
      $log.debug('watch describe');
      localStorage.setItem('describes', angular.toJson(vm.describes));

    }, true);

    $scope.$watchCollection('main.describes', function() {
      $log.debug('watch describes');
      localStorage.setItem('describes', angular.toJson(vm.describes));
    }, true);

    $scope.$watch('main.spec', function() {
      $log.debug('watch spec');

      if ($routeParams.id) {
        var id = parseInt($routeParams.id);
        vm.describes[0].specs[id - 1] = vm.spec;
        localStorage.setItem('describes', angular.toJson(vm.describes));



      } else {
        vm.conf.spec = vm.spec;
        localStorage.setItem('conf', angular.toJson(vm.conf));
      }

      vm.selectedItems = $filter('filter')(vm.spec.actions, {
        checked: true
      }).length;

      if (vm.selectedItems) {
        vm.showSelectedOptions = true
      } else {
        vm.showSelectedOptions = false;
      }
    }, true);


    $scope.$watch('main.session', function() {
      $log.debug('watch session');
      localStorage.setItem('session', angular.toJson(vm.session));
    }, true);


    function joinRoom(room) {
      $log.debug('connectRoom');
      socket.emit('joinroom', room);
    };

    function setCapabilities(capability) {
      if (capability.checked) {
        vm.conf.capabilities.push(capability.driver);
      } else {
        var index = vm.conf.capabilities.indexOf(capability.driver);
        vm.conf.capabilities.splice(index, 1);
      }
    };

    // TODO
    function newDescribe() {
      $log.debug('newDescribe');
    };

    function setSpec(spec) {
      vm.spec = spec;
    }

    function addSpec() {
      $log.debug('addSpec');

      vm.describe.specs.push(angular.copy(vm.blankSpec));
      vm.setSpec(vm.describe.specs[vm.describe.specs.length - 1]);
    }

    function setDescribe(describe) {
      vm.describe = describe;
    }

    function setElementOnChange(element) {

      if (protractorRecServer.isRecording()) {

        var target = angular.element(element.outerHTML);

        if (target[0].tagName.match(/^select/i) && element.value) {

          vm.addElement(target, 'select', 'click', element.value, element.xPath);
        }
      }
    };

    // TODO: Refactor
    function setElement(element) {

      if (protractorRecServer.isRecording()) {
        var target = angular.element(element.outerHTML);
        var parent = !element.offsetParent.outerHTML ? [] : angular.element(element.offsetParent.outerHTML);

        var value = '';

        if (target[0].tagName.match(/^button/i) || (parent[0].tagName && parent[0].tagName.match(/^button/i)) && !target[0].tagName.match(/^input/i)) {

          vm.addElement(parent, 'button', 'click', target.text().trim(), element.xPath);

        } else if (target[0].tagName.match(/^input/i)) {

          if (target[0].type == 'file')
            vm.addElement(target, 'input', 'sendKeys', false, element.xPath);
          else
            vm.addElement(target, 'input', 'click', false, element.xPath);

        } else if (target[0].tagName.match(/^a/i)) {
          vm.addElement(target, 'a', 'click', target.text().trim(), element.xPath);
        } else if (element.ngRepeat) {

          value = target.text() ? target.text() : false;

          //if(value)
          vm.addElement(target, target[0].tagName.toLowerCase(), 'wait', value.trim(), element.xPath);

          vm.addElement(target, 'row', 'click', element.ngRepeat.rowIndex, element.xPath, element.ngRepeat.value);

          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value.trim(), element.xPath);

        } else if (target[0].tagName.match(/^canvas/i)) {
          $log.debug('canvas');
          value = element.mouseCoordinates[0] + 'x' + element.mouseCoordinates[1];
          vm.addElement(target, 'mouseMove', 'browser', value, element.xPath);
          vm.spec.actions.push({
            action: 'browser',
            type: 'mouseDown',
            value: false
          });

        } else if (!target[0].tagName.match(/^select/i)) {
          value = target.text() ? target.text().trim() : false;
          vm.addElement(target, target[0].tagName.toLowerCase(), 'click', value, element.xPath);
        }
      }
    };

    // TODO: Refactor
    function addElement(element, type, actionType, value, xPath, repeater) {

      var locators = [];

      if (type == 'select' && vm.getAttr('ng-model', element))
        locators.push({
          type: 'model',
          value: vm.getAttr('ng-model', element)
        });

      if (type == 'row')
        locators.push({
          type: 'repeater',
          value: repeater
        });

      if (type == 'button' && value)
        locators.push({
          type: 'buttonText',
          value: value
        });

      if (type == 'input' && vm.getAttr('ng-model', element))
        locators.push({
          type: 'model',
          value: vm.getAttr('ng-model', element)
        });

      if (type == 'input' && vm.getAttr('name', element))
        locators.push({
          type: 'css',
          value: '[name="' + vm.getAttr('name', element) + '"]',
          strategy: 'css selector'
        });

      /*if (type == 'input' && vm.getAttr('type', element) == 'button') {
        locators.push({type: 'id', value: vm.getAttr('id', element)});
      }*/

      if (type == 'input' && vm.getAttr('type', element) == 'submit')
        locators.push({
          type: 'css',
          value: '[value="' + element.val() + '"]',
          strategy: 'css selector'
        });

      if (vm.getAttr('href', element)) {
        locators.push({
          type: 'linkText',
          value: value,
          strategy: 'link text'
        });
        locators.push({
          type: 'get',
          value: vm.getAttr('href', element)
        });
      }

      if (vm.getAttr('id', element) && !element[0].tagName.match(/md/i))
        locators.push({
          type: 'id',
          value: vm.getAttr('id', element),
          strategy: 'id'
        });

      //if (vm.getAttr('class', element) || actionType == 'wait') {

      /*if (value && type != 'row')
        locators.push({type: 'xpath', value: '//' + type + '[.="' + value + '"]', strategy: 'xpath'});*/

      if (xPath && !vm.getAttr('ng-click', element) && !vm.getAttr('class', element))
        locators.push({
          type: 'xpath',
          value: xPath,
          strategy: 'xpath'
        });

      if (vm.getAttr('ng-click', element))
        locators.push({
          type: 'css',
          value: '[ng-click="' + vm.getAttr('ng-click', element) + '"]',
          strategy: 'css selector'
        })

      if (xPath)
        locators.push({
          type: 'xpath',
          value: xPath,
          strategy: 'xpath'
        });

      if (vm.getAttr('class', element))
        locators.push({
          type: 'css',
          value: '.' + vm.getAttr('class', element).replace(/\s/g, '.')
        });
      //}

      var action = {
        //element: element.html(),
        type: type,
        value: value,
        action: actionType,
        locators: locators,
        locator: locators ? {
          type: locators[0].type,
          value: locators[0].value
        } : null
      };

      vm.spec.actions.push(action);

      $timeout(function(){
        var mainContent = angular.element($document[0].querySelector('#table'));
        mainContent[0].scrollTop = mainContent[0].scrollHeight;
      });

      vm.getSessionUrl();

      //localStorage.setItem('actions', angular.toJson(vm.actions));

      //vm.getSessionUrl();

    };

    function addModifierKey(keyCode) {

      var key;

      switch (keyCode) {
        case 9:
          key = 'TAB';
          break;
        case 13:
          key = 'ENTER';
          break;
        case 16:
          key = 'SHIFT';
          break;
        case 17:
          key = 'CONTROL';
          break;
        case 18:
          key = 'ALT';
          break;
        case 27:
          key = 'ESCAPE';
          break;
        default:

      }

      var action = {
        type: 'modifier',
        value: 'protractor.Key.' + key,
        action: 'browser'
      };

      vm.spec.actions.push(action);
    };

    /**
     * Get all data bind to suggest on assertions
     */
    function getAllDataBind() {

      $log.debug('getAllDataBind');

      var dataBind = vm.session.source.match(/\{{2}(.*?)\}{2}|ng-bind=["|'](.*?)["|']/igm);

      angular.forEach(dataBind, function(data) {

        data = data.replace(/\"|\'|ng-bind=|{{|}}/g, '').trim();

        if (!$filter('filter')(vm.dataBind, data).length) {

          vm.dataBind.push({
            type: 'bind',
            value: data
          });

        }

      });

      $log.debug(dataBind);
      $log.debug(vm.dataBind);

    };

    function removeSpec(index) {
      vm.describe.specs.splice(index, 1);
    };

    function runFromHere(index) {

      if (protractorRecServer.isRecording())
        protractorRecServer.setRecording(false);

      vm.index = index;

      var time = vm.conf.runSpeed ? vm.conf.runSpeed : 0;
      var line = vm.spec.actions[index];

      if (typeof line.value === 'number' && line.action == 'wait' || line.type == 'sleep') {

        $timeout(function() {
          line.executed = true;
          vm.runFromHere(vm.index + 1);
        }, line.value);

      } else if (line.type == 'row') {

        vm.runFromHere(vm.index + 1);

      } else {

        var element = vm.getElementAction(vm.spec.actions[index]);
        vm.getSessionElementId(element);

      }

    };

    // TODO
    function setActionLocator(action) {
      $log.debug(action);
    };

    function getAttr(attr, elem) {
      if (elem.attr(attr))
        return elem.attr(attr);
      return false;
    };

    function createSession() {

      if (!vm.session.id) {

        var options = {
          'desiredCapabilities': {
            'browserName': 'chrome',
            acceptSSlCerts: true
          }
        };

        seleniumJWP.newSession(options).success(function(response) {
          $log.debug('Session Created');
          seleniumJWP.setSession(response);
          vm.session.id = response.sessionId;
          protractorRecServer.setRecording(true);
          vm.setSessionUrl();

        }).error(function(response) {
          $log.debug(response);
        });

      } else {
        protractorRecServer.setRecording(true);
      }
    };

    function setSessionUrl() {
      seleniumJWP.setSessionUrl(vm.conf.baseUrl).success(function() {
        $log.debug('setSessionUrl');
        vm.getSessionUrl();
        vm.getSessionSource();
      }).error(function(response) {
        $log.debug(response);
      });
    };

    function getSessionUrl() {
      seleniumJWP.getSessionUrl().success(function(response) {
        $log.debug('getSessionUrl');
        vm.session.url = response.value;
      }).error(function(response) {
        $log.debug(response);
      });
    };

    function toggleAll() {

      angular.forEach(vm.spec.actions, function(action) {

        action.checked = !vm.selectAll;

      });

      if (vm.selectAll)
        vm.showSelectedOptions = false;

    };

    function toggleAction(action) {
      if (!action.checked) {
        //vm.showSelectedOptions = true;
      }
    };

    function removeActions(index) {

      if (index != undefined) {
        vm.spec.actions.splice(index, 1);
      } else {
        var i = vm.spec.actions.length;
        while (i--) {
          var action = vm.spec.actions[i];
          if (action.checked)
            vm.spec.actions.splice(i, 1);
        }
        vm.selectAll = false;
      }
    };

    function duplicateActions(index) {

      if (index != undefined) {
        var newAction = angular.copy(vm.spec.actions[index]);
        vm.spec.actions.push(newAction);
      }
    };

    function toggleBreakPoint(index) {
      if (vm.spec.actions[index].breakpoint == undefined)
        vm.spec.actions[index].breakpoint = true;
      else
        vm.spec.actions[index].breakpoint = !vm.spec.actions[index].breakpoint;
    };

    function addBrowserSleep(index) {
      var action = {
        action: 'browser',
        type: 'sleep',
        value: 1000
      };
      vm.spec.actions.splice(index, 0, action);
    };

    function sessionExecute() {

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

        protractorRecServer.setSnippet(true);

        protractorRecServer.setLoading(false);

        vm.getSessionUrl();

      }).error(function(response) {
        $log.debug(response);
      });

    };

    function clearSession() {
      vm.session = {};
      seleniumJWP.setSession();
      protractorRecServer.setSession();
      protractorRecServer.setLoading(false);
      protractorRecServer.setRecording(false);
    };

    function deleteSession() {
      seleniumJWP.deleteSession().success(function() {
        $log.debug('Session Deleted');
        vm.clearSession();
      }).error(function(response) {
        $log.debug(response);
        vm.clearSession();
      });
    };

    function getSessionSource() {

      if (vm.session.id) {

        vm.joinRoom(vm.session.id);

        seleniumJWP.getSessionSource().success(function(response) {
          vm.session.source = response.value;
          if (response.value) {
            vm.getNgIncludes();
            vm.verifySnippet();
          }
        }).error(function(response) {
          $log.debug(response);
          $log.debug('Error session source');
          vm.deleteSession();
        });
      } else {
        protractorRecServer.setLoading(false);
        protractorRecServer.setRecording(false);
      }
    };

    /**
     * Get all html from ng-includes and concatenate with main source
     */
    function getNgIncludes() {

      $log.debug('getNgIncludes');

      var ngIncludes = vm.session.source.match(/ngInclude:\s?["|'](.*?)["|']/igm);

      $log.debug(ngIncludes);

      var includes = [];

      angular.forEach(ngIncludes, function(include) {

        include = include.replace(/:\s|\"|\'|ngInclude|{{|}}/g, '').trim();

        if (!$filter('filter')(includes, include).length) {

          protractorRecServer.getHtmlSource({
            url: vm.url,
            include: include
          }).success(function(response) {
            vm.session.source += response;
            vm.getAllDataBind();
          }).error(function(response) {
            $log.debug(response);
          });
        }
        includes.push(include);
      });
    };

    function verifySnippet() {

      var countIframe = vm.session.source.match(/recorder-iframe/);
      countIframe != null ? countIframe.length : countIframe = 0;

      if (!protractorRecServer.hasSnippet() || countIframe == 0) {
        vm.sessionExecute();
      } else {
        protractorRecServer.setLoading(false);
      }
    };

    var DialogSpecController = function($scope, $mdDialog, spec, describe) {

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

    function specDialog(ev) {

      var spec = angular.copy(vm.spec);
      var describe = angular.copy(vm.describe);

      var closeTo = angular.element($document[0].getElementById('edit-spec'));

      $mdDialog.show({
        controller: DialogSpecController,
        controllerAs: 'spec',
        templateUrl: 'main/spec-dialog.html',
        parent: angular.element($document[0].body),
        targetEvent: ev,
        closeTo: closeTo,
        locals: {
          spec: spec,
          describe: describe
        },
        clickOutsideToClose: true
      }).then(function(result) {
        if (result) {

          $filter('filter')(vm.describes[0].specs, {
            string: vm.spec.string
          })[0].string = result.spec.string;
          vm.spec = result.spec;
          vm.describes[0].string = result.describe.string;

          //localStorage.setItem('describes', angular.toJson(vm.describes));
        }
        //angular.copy(vm.spec, spec);
      }, function() {});
    };

    function getSessionElementId(element) {

      $log.debug('getSessionElementId');

      seleniumJWP.findSessionElements(element).success(function(response) {

        $log.debug('findSessionElements');
        $log.debug(response);

        // IF ELEMENT WAS NOT FOUND EXECUTE SAME ACTION AGAIN
        if (response.value.length == 0) {

          // Increase counter
          vm.spec.actions[vm.index].runningCount = vm.spec.actions[vm.index].runningCount ? vm.spec.actions[vm.index].runningCount++ : 1;

          // Execute time is less than 30, try running again or stop with error
          if (vm.spec.actions[vm.index].runningCount < 30) {
            vm.runFromHere(vm.index);
          } else {
            vm.spec.actions[vm.index].error = true;
          }
        }

        angular.forEach(response.value, function(value, index) {

          var length = response.value.length;
          var elementId = value.ELEMENT;
          var indexValue = index;

          $log.debug(value.ELEMENT);

          seleniumJWP.getSessionElementDisplayed(elementId).success(function(response) {

            $log.debug('getSessionElementDisplayed');
            $log.debug(response);

            if (response.value) {

              if (length > 1)
                element.index = indexValue;

              if (element.action === 'wait') {
                vm.spec.actions[vm.index].executed = true;
                $timeout(function() {
                  vm.runFromHere(vm.index + 1);
                }, 1000);

              } else {
                vm.sessionElementExecute(elementId, element);
              }
            }

          }).error(function(response) {
            $log.debug(response);
          });

        });

      }).error(function(response) {
        $log.debug(response);
        $log.debug('index: ' + vm.index);

        vm.spec.actions[vm.index].error = true;
      });

    };

    function getElementAction(action) {

      $log.debug('getElementAction');

      var element = {};

      element.keys = action.value;

      /*if(action.action == 'click' && action.type == 'a' && action.locator.type == 'linkText') {
        element.using      = 'link text';
        element.value      = action.value;
        element.action     = 'click';

        $log.debug(element);
        return element;
      }*/

      if (action.action == 'sendKeys') {

        angular.forEach(action.locators, function(locator) {

          if (locator.strategy && !element.using) {
            element.using = locator.strategy;
            element.value = locator.value;
            element.action = 'value';
          }

        });

        $log.debug(element);
        return element;

      }

      if (action.action == 'click' || action.action == 'wait') {

        // Priority to use locator xpath
        var locator = $filter('filter')(action.locators, {
          type: 'xpath'
        })[0];

        if (locator) {

          element.using = locator.strategy;
          element.value = locator.value;
          element.action = action.action;

        } else {

          angular.forEach(action.locators, function(locator) {

            if (locator.strategy && !element.using) {

              element.using = locator.strategy;
              element.value = locator.value;
              element.action = action.action;
            }
          });

        }

        $log.debug(element);
        return element;
      }

      return false;

    };

    function socketElementExecute(element) {
      socket.emit('execute', element);
    };

    function sessionElementExecute(elementId, element) {

      $log.debug('sessionElementExecute');

      var data = {};

      if (element.action == 'value') {
        data.value = [element.keys];
      }

      //vm.socketElementExecute(element);

      seleniumJWP.sessionElementExecute(elementId, element, data).success(function(response) {

        $log.debug(response);

        vm.spec.actions[vm.index].index = element.index;
        vm.spec.actions[vm.index].executed = true;

        if (vm.spec.actions[vm.index + 1]) {

          if (typeof vm.spec.actions[vm.index + 1].value === 'number' && vm.spec.actions[vm.index + 1].action == 'wait' || vm.spec.actions[vm.index + 1].type == 'sleep') {

            $timeout(function() {
              vm.spec.actions[vm.index + 1].executed = true;
              vm.runFromHere(vm.index + 2);
            }, vm.spec.actions[vm.index + 1].value);

          } else {

            var time = vm.conf.runSpeed ? vm.conf.runSpeed : 0;
            $timeout(function() {
              vm.runFromHere(vm.index + 1);
            }, time);

          }

        } else {

          $mdToast.show(
            $mdToast.simple()
            .content('Actions executed!')
            .position('bottom left')
            .hideDelay(3000)
          );

          vm.clearRunTestResult();
        }

      }).error(function(response) {
        $log.debug(response);
      });

    };

    function clearRunTestResult() {
      angular.forEach(vm.spec.actions, function(action) {
        action.executed = false;
        action.error = false;
      });
    };

    var DialogActionController = function($scope, $mdDialog, index, action) {

      var vm = this;

      vm.action = action ? action : {};

      //'mouseMove', 'mouseDown', 'mouseUp', 'doubleClick'
      vm.actionTypes = ['assertion', 'get', 'click', 'sendKeys', 'wait', 'browser'];
      vm.locatorsTypes = ['model', 'repeater', 'buttonText', 'css', 'linkText', 'get', 'id', 'xpath'];
      vm.strategies = ['class name', 'css selector', 'id', 'name', 'link text', 'partial link text', 'tag name', 'xpath'];

      vm.hide = function() {
        $mdDialog.hide();
      };

      vm.cancel = function() {
        $mdDialog.cancel();
      };

      vm.saveSpec = function() {
        $mdDialog.hide({
          index: index,
          action: vm.action
        });
      };
    };

    function actionDialog(ev, index, action) {

      if (action)
        var actionCopy = angular.copy(action);

      var closeTo = angular.element($document[0].getElementById('add-spec'));

      $mdDialog.show({
        controller: DialogActionController,
        controllerAs: 'action',
        templateUrl: 'main/action-dialog.html',
        parent: angular.element($document[0].body),
        targetEvent: ev,
        closeTo: closeTo,
        locals: {
          index: index,
          action: actionCopy
        },
        clickOutsideToClose: true
      }).then(function(result) {
        if (result) {

          $log.debug(result.action);

          if (result.index != undefined) {
            vm.spec.actions[result.index] = result.action;
          } else {
            if (result.action.locator)
              result.action.locators = [{
                type: result.action.locator.type,
                value: result.action.locator.value,
                strategy: result.action.locator.strategy
              }];
            vm.spec.actions.push(result.action);
          }
        }
      }, function() {});
    };

    vm.getSessionSource();

  }

})();
